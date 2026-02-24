<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/*
 *
 *  All this does is tracking the total number of installations of ptero-billing for us to know how many people use it.
 *  It is not used for any other purpose and does not collect any personal data.
 *  It is a one-time call per installation.
 *
 */

class CallHomeHelper
{
    /**
     *
     * @return void
     * @throws \Exception
     */
    public static function callHome()
    {
        try {
            // Get domain
            $domain = request()->getHost();

            // Check if already called
            $callHomeFile = storage_path("app/call_home_sent");

            if (file_exists($callHomeFile)) {
                return;
            }

            // Send request
            $promise = Http::async()->post(
                "https://utils.ptero-billing.gg/callhome.php",
                [
                    "domain" => $domain,
                    "version" => config("app.version"),
                ],
            );

            // Create file to prevent multiple calls
            file_put_contents($callHomeFile, "sent");
        } catch (\Exception $e) {
            Log::error("CallHome failed: " . $e->getMessage());
        }
    }
}
