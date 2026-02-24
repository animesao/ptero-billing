<?php

namespace App\Http\Controllers;

use App\Services\Payments\PayPalService;
use App\Services\Payments\StripeService;
use Illuminate\Http\Request;

class WebhookController extends Controller
{
    public function stripe(Request $request, StripeService $stripeService)
    {
        $payload = $request->getContent();
        $signature = $request->header('Stripe-Signature');

        $payment = $stripeService->handleWebhook($payload, $signature);

        if ($payment) {
            return response()->json(['status' => 'success']);
        }

        return response()->json(['status' => 'ignored']);
    }

    public function paypal(Request $request, PayPalService $paypalService)
    {
        $payload = $request->all();

        // TODO: Добавить проверку webhook signature от PayPal

        $payment = $paypalService->handleWebhook($payload);

        if ($payment) {
            return response()->json(['status' => 'success']);
        }

        return response()->json(['status' => 'ignored']);
    }
}
