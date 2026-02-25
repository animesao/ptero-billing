<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Payment Gateway Configuration
    |--------------------------------------------------------------------------
    */

    'stripe' => [
        'key' => env('STRIPE_KEY', ''),
        'secret' => env('STRIPE_SECRET', ''),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET', ''),
        'currency' => env('STRIPE_CURRENCY', 'usd'),
    ],

    'paypal' => [
        'client_id' => env('PAYPAL_CLIENT_ID', ''),
        'secret' => env('PAYPAL_SECRET', ''),
        'mode' => env('PAYPAL_MODE', 'sandbox'), // sandbox или live
        'currency' => env('PAYPAL_CURRENCY', 'USD'),
        'notify_url' => env('PAYPAL_NOTIFY_URL', ''),
    ],
];
