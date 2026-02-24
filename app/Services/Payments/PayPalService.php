<?php

namespace App\Services\Payments;

use App\Models\Payment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayPalService
{
    protected string $clientId;
    protected string $secret;
    protected string $mode;
    protected string $currency;
    protected string $baseUrl;

    public function __construct()
    {
        $this->clientId = config('payments.paypal.client_id');
        $this->secret = config('payments.paypal.secret');
        $this->mode = config('payments.paypal.mode', 'sandbox');
        $this->currency = config('payments.paypal.currency', 'USD');

        $this->baseUrl = $this->mode === 'live'
            ? 'https://api.paypal.com'
            : 'https://api.sandbox.paypal.com';
    }

    /**
     * Получить access token
     */
    protected function getAccessToken(): ?string
    {
        $response = Http::withBasicAuth($this->clientId, $this->secret)
            ->asForm()
            ->post("{$this->baseUrl}/v1/oauth2/token", [
                'grant_type' => 'client_credentials',
            ]);

        if ($response->successful()) {
            $data = $response->json();
            return $data['access_token'] ?? null;
        }

        Log::error('PayPal token request failed', [
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return null;
    }

    /**
     * Создать заказ PayPal
     */
    public function createOrder(
        float $amount,
        string $invoiceNumber,
        string $successUrl,
        string $cancelUrl
    ): ?array {
        $token = $this->getAccessToken();

        if (!$token) {
            return null;
        }

        $payload = [
            'intent' => 'CAPTURE',
            'purchase_units' => [[
                'reference_id' => $invoiceNumber,
                'amount' => [
                    'currency_code' => $this->currency,
                    'value' => number_format($amount, 2, '.', ''),
                ],
                'description' => 'Оплата инвойса #' . $invoiceNumber,
            ]],
            'application_context' => [
                'brand_name' => config('app.name'),
                'locale' => 'ru-RU',
                'landing_page' => 'NO_PREFERENCE',
                'return_url' => $successUrl,
                'cancel_url' => $cancelUrl,
            ],
        ];

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$token}",
            'Content-Type' => 'application/json',
        ])->post("{$this->baseUrl}/v2/checkout/orders", $payload);

        if ($response->successful()) {
            $data = $response->json();

            // Находим approve link
            $approveLink = null;
            foreach ($data['links'] ?? [] as $link) {
                if ($link['rel'] === 'approve') {
                    $approveLink = $link['href'];
                    break;
                }
            }

            return [
                'id' => $data['id'],
                'approve_url' => $approveLink,
            ];
        }

        Log::error('PayPal order creation failed', [
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return null;
    }

    /**
     * Завершить заказ (capture)
     */
    public function captureOrder(string $orderId): ?array
    {
        $token = $this->getAccessToken();

        if (!$token) {
            return null;
        }

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$token}",
            'Content-Type' => 'application/json',
        ])->post("{$this->baseUrl}/v2/checkout/orders/{$orderId}/capture");

        if ($response->successful()) {
            return $response->json();
        }

        Log::error('PayPal order capture failed', [
            'order_id' => $orderId,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return null;
    }

    /**
     * Обработать webhook от PayPal
     */
    public function handleWebhook(array $payload): ?Payment
    {
        $eventType = $payload['event_type'] ?? null;

        switch ($eventType) {
            case 'PAYMENT.CAPTURE.COMPLETED':
                return $this->handleCaptureCompleted($payload);

            case 'PAYMENT.CAPTURE.DENIED':
            case 'PAYMENT.CAPTURE.FAILED':
                return $this->handleCaptureFailed($payload);

            case 'CHECKOUT.ORDER.APPROVED':
                return $this->handleOrderApproved($payload);

            default:
                Log::info('PayPal webhook received', ['event_type' => $eventType]);
        }

        return null;
    }

    /**
     * Обработать завершение платежа
     */
    protected function handleCaptureCompleted(array $payload): ?Payment
    {
        $resource = $payload['resource'] ?? [];
        $invoiceNumber = $resource['custom_id'] ?? $resource['supplementary_data']['related_ids']['order_id'] ?? null;

        if (!$invoiceNumber) {
            Log::warning('PayPal capture completed without invoice number', [
                'payload' => $payload,
            ]);
            return null;
        }

        $invoice = \App\Models\Invoice::where('invoice_number', $invoiceNumber)->first();

        if (!$invoice) {
            return null;
        }

        $captureId = $resource['id'] ?? null;

        $payment = Payment::firstOrCreate(
            ['transaction_id' => $captureId],
            [
                'user_id' => $invoice->user_id,
                'invoice_id' => $invoice->id,
                'gateway' => Payment::GATEWAY_PAYPAL,
                'status' => Payment::STATUS_COMPLETED,
                'amount' => (float) ($resource['amount']['value'] ?? 0),
                'currency' => $resource['amount']['currency_code'] ?? $this->currency,
                'payload' => $payload,
                'paid_at' => now(),
            ]
        );

        if ($payment->wasRecentlyCreated) {
            $stripeService = new StripeService();
            $stripeService->processPayment($payment);
        }

        return $payment;
    }

    /**
     * Обработать неудачный платёж
     */
    protected function handleCaptureFailed(array $payload): ?Payment
    {
        $resource = $payload['resource'] ?? [];
        $captureId = $resource['id'] ?? null;

        if ($captureId) {
            $payment = Payment::where('transaction_id', $captureId)->first();

            if ($payment) {
                $payment->update([
                    'status' => Payment::STATUS_FAILED,
                    'payload' => array_merge(
                        $payment->payload ?? [],
                        ['failure_reason' => $resource['status_details']['reason'] ?? null]
                    ),
                ]);
            }

            return $payment;
        }

        return null;
    }

    /**
     * Обработать одобрение заказа
     */
    protected function handleOrderApproved(array $payload): ?Payment
    {
        // Заказ одобрен, но ещё не захвачен
        Log::info('PayPal order approved', ['order_id' => $payload['resource']['id'] ?? null]);
        return null;
    }

    /**
     * Получить информацию о заказе
     */
    public function getOrder(string $orderId): ?array
    {
        $token = $this->getAccessToken();

        if (!$token) {
            return null;
        }

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$token}",
            'Content-Type' => 'application/json',
        ])->get("{$this->baseUrl}/v2/checkout/orders/{$orderId}");

        if ($response->successful()) {
            return $response->json();
        }

        return null;
    }
}
