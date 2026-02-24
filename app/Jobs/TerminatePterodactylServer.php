<?php

namespace App\Jobs;

use App\Models\Server;
use App\Services\PterodactylService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class TerminatePterodactylServer implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public Server $server
    ) {}

    public function handle(PterodactylService $pterodactyl): void
    {
        Log::info('Terminating Pterodactyl server', ['server_id' => $this->server->id]);

        try {
            if (!$this->server->pterodactyl_id) {
                Log::warning('Server has no Pterodactyl ID', ['server_id' => $this->server->id]);
                $this->server->update(['status' => Server::STATUS_TERMINATED]);
                return;
            }

            $success = $pterodactyl->deleteServer($this->server->pterodactyl_id);

            if ($success) {
                $this->server->update([
                    'status' => Server::STATUS_TERMINATED,
                    'terminated_at' => now(),
                ]);

                Log::info('Server terminated successfully', ['server_id' => $this->server->id]);

                // Отправляем уведомление
                $this->sendNotification();
            } else {
                throw new \Exception('Failed to delete server in Pterodactyl');
            }

        } catch (\Exception $e) {
            Log::error('Failed to terminate Pterodactyl server', [
                'server_id' => $this->server->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    protected function sendNotification(): void
    {
        // TODO: Отправить email уведомление о удалении
        Log::info('Server terminated notification', [
            'server_id' => $this->server->id,
            'user_id' => $this->server->user_id,
        ]);
    }
}
