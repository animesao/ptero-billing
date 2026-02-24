<?php

namespace App\Services\Payments;

use App\Models\Payment;
use Stripe\Stripe;
use Stripe\Checkout\Session;
use Stripe\Webhook;
use Stripe\Event;
use Illuminate\Support\Facades\Log;

class StripeService
{
    protected string $secretKey;
    protected string $webhookSecret;
    protected string $currency;

    public function __construct()
    {
        $this->secretKey = config('payments.stripe.secret');
        $this->webhookSecret = config('payments.stripe.webhook_secret');
        $this->currency = config('payments.stripe.currency', 'usd');

        Stripe::setApiKey($this->secretKey);
    }

    /**
     * Создать сессию оплаты
     */
    public function createCheckoutSession(
        string $email,
        float $amount,
        string $invoiceNumber,
        string $successUrl,
        string $cancelUrl
    ): Session {
        // Конвертируем в центы (Stripe использует наименьшие единицы)
        $amountInCents = (int) round($amount * 100);

        $session = Session::create([
            'payment_method_types' => ['card'],
            'line_items' => [[
                'price_data' => [
                    'currency' => $this->currency,
                    'product_data' => [
                        'name' => 'Оплата инвойса #' . $invoiceNumber,
                        'description' => 'Оплата услуг хостинга',
                    ],
                    'unit_amount' => $amountInCents,
                ],
                'quantity' => 1,
            ]],
            'mode' => 'payment',
            'customer_email' => $email,
            'metadata' => [
                'invoice_number' => $invoiceNumber,
            ],
            'success_url' => $successUrl . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => $cancelUrl,
        ]);

        return $session;
    }

    /**
     * Обработать webhook от Stripe
     */
    public function handleWebhook(string $payload, string $signature): ?Payment
    {
        try {
            $event = Webhook::constructEvent(
                $payload,
                $signature,
                $this->webhookSecret
            );
        } catch (\Exception $e) {
            Log::error('Stripe webhook verification failed', [
                'error' => $e->getMessage(),
            ]);
            return null;
        }

        switch ($event->type) {
            case Event::CHECKOUT_SESSION_COMPLETED:
                return $this->handleCheckoutCompleted($event->data->object);

            case Event::PAYMENT_INTENT_SUCCEEDED:
                return $this->handlePaymentSucceeded($event->data->object);

            case Event::PAYMENT_INTENT_FAILED:
                return $this->handlePaymentFailed($event->data->object);

            default:
                Log::info('Stripe webhook received', ['type' => $event->type]);
        }

        return null;
    }

    /**
     * Обработать завершение checkout сессии
     */
    protected function handleCheckoutCompleted(Session $session): ?Payment
    {
        $invoiceNumber = $session->metadata['invoice_number'] ?? null;

        if (!$invoiceNumber) {
            Log::warning('Stripe checkout completed without invoice number', [
                'session_id' => $session->id,
            ]);
            return null;
        }

        // Находим инвойс по номеру
        $invoice = \App\Models\Invoice::where('invoice_number', $invoiceNumber)->first();

        if (!$invoice) {
            Log::warning('Invoice not found', ['invoice_number' => $invoiceNumber]);
            return null;
        }

        // Создаём или обновляем платёж
        $payment = Payment::firstOrCreate(
            ['transaction_id' => $session->payment_intent],
            [
                'user_id' => $invoice->user_id,
                'invoice_id' => $invoice->id,
                'gateway' => Payment::GATEWAY_STRIPE,
                'status' => Payment::STATUS_COMPLETED,
                'amount' => $session->amount_total / 100,
                'currency' => $session->currency,
                'payload' => $session->toArray(),
                'paid_at' => now(),
            ]
        );

        // Обрабатываем оплату инвойса
        if ($payment->wasRecentlyCreated) {
            $this->processPayment($payment);
        }

        return $payment;
    }

    /**
     * Обработать успешный платёж
     */
    protected function handlePaymentSucceeded($paymentIntent): ?Payment
    {
        // Дополнительная обработка успешного платежа
        Log::info('Stripe payment succeeded', ['payment_intent' => $paymentIntent->id]);
        return null;
    }

    /**
     * Обработать неудачный платёж
     */
    protected function handlePaymentFailed($paymentIntent): ?Payment
    {
        $payment = Payment::where('transaction_id', $paymentIntent->id)->first();

        if ($payment) {
            $payment->update([
                'status' => Payment::STATUS_FAILED,
                'payload' => array_merge(
                    $payment->payload ?? [],
                    ['failure_reason' => $paymentIntent->last_payment_error['message'] ?? null]
                ),
            ]);
        }

        return $payment;
    }

    /**
     * Обработать платёж
     */
    protected function processPayment(Payment $payment): void
    {
        if ($payment->invoice) {
            $payment->invoice->update([
                'status' => \App\Models\Invoice::STATUS_PAID,
                'paid_at' => now(),
            ]);

            // Продлеваем сервер
            $this->extendServer($payment->invoice);
        }

        if ($payment->order && $payment->order->isPending()) {
            $payment->order->update([
                'status' => \App\Models\Order::STATUS_PAID,
                'paid_at' => now(),
            ]);

            // Создаём сервер
            dispatch(new \App\Jobs\CreatePterodactylServer($payment->order));
        }

        // Зачисляем на баланс если это пополнение
        if (!$payment->invoice && !$payment->order) {
            $payment->user->increment('balance', $payment->amount);
        }
    }

    /**
     * Продлить сервер
     */
    protected function extendServer(\App\Models\Invoice $invoice): void
    {
        if (!$invoice->server) {
            return;
        }

        $nextDate = $invoice->getNextBillingDate();

        $invoice->server->update([
            'next_billing_date' => $nextDate,
        ]);

        // Если сервер был приостановлен, активируем его
        if ($invoice->server->isSuspended()) {
            dispatch(new \App\Jobs\UnsuspendPterodactylServer($invoice->server));
        }
    }

    /**
     * Получить информацию о сессии
     */
    public function getSession(string $sessionId): ?Session
    {
        try {
            return Session::retrieve($sessionId);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve Stripe session', [
                'session_id' => $sessionId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }
}
