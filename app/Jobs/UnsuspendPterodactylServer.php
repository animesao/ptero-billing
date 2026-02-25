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

class UnsuspendPterodactylServer implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public Server $server
    ) {}

    public function handle(PterodactylService $pterodactyl): void
    {
        Log::info('Unsuspending Pterodactyl server', ['server_id' => $this->server->id]);

        try {
            if (!$this->server->pterodactyl_id) {
                Log::warning('Server has no Pterodactyl ID', ['server_id' => $this->server->id]);
                return;
            }

            $success = $pterodactyl->unsuspendServer($this->server->pterodactyl_id);

            if ($success) {
                $this->server->update([
                    'status' => Server::STATUS_ACTIVE,
                    'suspended_at' => null,
                ]);

                Log::info('Server unsuspended successfully', ['server_id' => $this->server->id]);

                // Отправляем уведомление
                $this->sendNotification();
            } else {
                throw new \Exception('Failed to unsuspend server in Pterodactyl');
            }

        } catch (\Exception $e) {
            Log::error('Failed to unsuspend Pterodactyl server', [
                'server_id' => $this->server->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    protected function sendNotification(): void
    {
        // TODO: Отправить email уведомление о разблокировке
        Log::info('Server unsuspended notification', [
            'server_id' => $this->server->id,
            'user_id' => $this->server->user_id,
        ]);
    }
}
