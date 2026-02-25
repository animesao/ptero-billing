<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Pterodactyl API Configuration
    |--------------------------------------------------------------------------
    */

    // URL вашей Pterodactyl панели (без завершающего слэша)
    'url' => env('PTERODACTYL_URL', ''),

    // Application API Key (создаётся в админ-панели Pterodactyl)
    'api_key' => env('PTERODACTYL_API_KEY', ''),

    // Таймаут запросов в секундах
    'timeout' => 30,

    // Версия API
    'api_version' => 'v1',
];
