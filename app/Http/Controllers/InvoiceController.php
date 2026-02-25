<?php

namespace App\Http\Controllers;

use App\Jobs\UnsuspendPterodactylServer;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\Payments\PayPalService;
use App\Services\Payments\StripeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class InvoiceController extends Controller
{
    public function __construct()
    {
        $this->middleware("auth");
    }

    public function index()
    {
        $invoices = Invoice::where("user_id", Auth::id())
            ->with("server")
            ->latest()
            ->paginate(10);

        return view("invoices.index", compact("invoices"));
    }

    public function show(Invoice $invoice)
    {
        if ($invoice->user_id !== Auth::id()) {
            abort(403);
        }

        $invoice->load("server", "payments");

        return view("invoices.show", compact("invoice"));
    }

    public function pay(Invoice $invoice, Request $request)
    {
        if ($invoice->user_id !== Auth::id()) {
            abort(403);
        }

        if ($invoice->isPaid()) {
            return back()->with("error", "Инвойс уже оплачен");
        }

        $gateway = $request->input("gateway", "stripe");

        return match ($gateway) {
            "paypal" => $this->payWithPaypal($invoice),
            "balance" => $this->payWithBalance($invoice),
            default => $this->payWithStripe($invoice),
        };
    }

    protected function payWithStripe(Invoice $invoice)
    {
        $stripeService = new StripeService();

        $session = $stripeService->createCheckoutSession(
            Auth::user()->email,
            $invoice->total,
            $invoice->invoice_number,
            route("invoices.show", $invoice) .
                "?session_id={CHECKOUT_SESSION_ID}",
            route("invoices.show", $invoice),
        );

        return redirect($session->url);
    }

    protected function payWithPaypal(Invoice $invoice)
    {
        $paypalService = new PayPalService();

        $order = $paypalService->createOrder(
            $invoice->total,
            $invoice->invoice_number,
            route("invoices.paypal.success", $invoice),
            route("invoices.show", $invoice),
        );

        if ($order && $order["approve_url"]) {
            return redirect($order["approve_url"]);
        }

        return back()->with("error", "Ошибка при создании PayPal заказа");
    }

    protected function payWithBalance(Invoice $invoice)
    {
        $user = Auth::user();

        if ($user->balance >= $invoice->total) {
            $user->decrement("balance", $invoice->total);

            $invoice->update([
                "status" => Invoice::STATUS_PAID,
                "paid_at" => now(),
            ]);

            $invoice->payments()->create([
                "gateway" => Payment::GATEWAY_BALANCE,
                "transaction_id" => "BAL-" . uniqid(),
                "status" => Payment::STATUS_COMPLETED,
                "amount" => $invoice->total,
                "currency" => config("billing.currency", "RUB"),
                "paid_at" => now(),
            ]);

            // Обрабатываем оплату
            $this->processPayment($invoice);

            return back()->with("success", "Инвойс оплачен с баланса");
        }

        return back()->with("error", "Недостаточно средств на балансе");
    }

    protected function processPayment(Invoice $invoice)
    {
        $invoice->update([
            "status" => Invoice::STATUS_PAID,
            "paid_at" => now(),
        ]);

        if ($invoice->server) {
            $nextDate = $invoice->getNextBillingDate();
            $invoice->server->update([
                "next_billing_date" => $nextDate,
            ]);

            if ($invoice->server->isSuspended()) {
                dispatch(
                    new \App\Jobs\UnsuspendPterodactylServer($invoice->server),
                );
            }
        }
    }

    public function paypalSuccess(
        Invoice $invoice,
        Request $request,
        PayPalService $paypalService,
    ) {
        if ($invoice->user_id !== Auth::id()) {
            abort(403);
        }

        $orderId = $request->input("token");

        if ($orderId) {
            $capture = $paypalService->captureOrder($orderId);

            if ($capture) {
                $captureId =
                    $capture["purchase_units"][0]["payments"]["captures"][0][
                        "id"
                    ] ?? null;

                if ($captureId) {
                    $invoice->payments()->create([
                        "gateway" => Payment::GATEWAY_PAYPAL,
                        "transaction_id" => $captureId,
                        "status" => Payment::STATUS_COMPLETED,
                        "amount" => $invoice->total,
                        "currency" => $invoice->currency,
                        "payload" => $capture,
                        "paid_at" => now(),
                    ]);

                    $this->processPayment($invoice);

                    return redirect()
                        ->route("invoices.show", $invoice)
                        ->with("success", "Инвойс оплачен через PayPal");
                }
            }
        }

        return redirect()
            ->route("invoices.show", $invoice)
            ->with("error", "Ошибка при оплате через PayPal");
    }

    public function stripeSuccess(
        Invoice $invoice,
        Request $request,
        StripeService $stripeService,
    ) {
        if ($invoice->user_id !== Auth::id()) {
            abort(403);
        }

        $sessionId = $request->input("session_id");

        if ($sessionId) {
            $session = $stripeService->getSession($sessionId);

            if ($session && $session->payment_status === "paid") {
                return redirect()
                    ->route("invoices.show", $invoice)
                    ->with("success", "Инвойс оплачен через Stripe");
            }
        }

        return redirect()
            ->route("invoices.show", $invoice)
            ->with("error", "Ошибка при оплате через Stripe");
    }
}
