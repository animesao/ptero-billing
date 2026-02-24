<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Billing Configuration
    |--------------------------------------------------------------------------
    */

    // Валюта по умолчанию
    'currency' => env('BILLING_CURRENCY', 'RUB'),

    // Период проверки инвойсов (в днях)
    'invoice_check_period' => 1,

    // Grace period перед суспендом (в днях)
    'grace_period' => 3,

    // Период перед удалением после суспенда (в днях)
    'termination_period' => 7,

    // Налог в процентах (0-100)
    'tax_rate' => env('BILLING_TAX_RATE', 0),

    // Включить купоны
    'coupons_enabled' => env('BILLING_COUPONS_ENABLED', true),
];
