<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\Server;
use App\Models\User;
use App\Services\PterodactylService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CreatePterodactylServer implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function handle(PterodactylService $pterodactyl): void
    {
        Log::info("Creating Pterodactyl server for order", [
            "order_id" => $this->order->id,
        ]);

        try {
            // Получаем или создаём пользователя в Pterodactyl
            $user = $this->getOrCreatePterodactylUser(
                $this->order->user,
                $pterodactyl,
            );

            if (!$user->pterodactyl_id) {
                throw new \Exception(
                    "Failed to create/find user in Pterodactyl",
                );
            }

            // Создаём сервер в базе данных
            $server = Server::create([
                "user_id" => $this->order->user_id,
                "order_id" => $this->order->id,
                "product_id" => $this->order->product_id,
                "name" =>
                    $this->order->server_name ?? $this->order->product->name,
                "status" => Server::STATUS_PENDING,
                "cpu" => $this->order->cpu ?? $this->order->product->cpu,
                "memory" =>
                    $this->order->memory ?? $this->order->product->memory,
                "disk" => $this->order->disk ?? $this->order->product->disk,
                "io" => $this->order->product->io,
                "databases" => $this->order->product->databases,
                "allocations" => $this->order->product->allocations,
                "backups" => $this->order->product->backups,
                "node_id" => $this->getRandomNode($this->order->product->nodes),
                "next_billing_date" => $this->getNextBillingDate(
                    $this->order->product->billing_cycle,
                ),
            ]);

            // Получаем информацию о яйце
            $eggInfo = $this->getEggInfo(
                $pterodactyl,
                $server->node_id,
                $this->order->product->pterodactyl_egg_id,
            );

            // Создаём сервер в Pterodactyl
            $pterodactylServer = $pterodactyl->createServer(
                $server,
                $user,
                $eggInfo,
            );

            if (!$pterodactylServer) {
                throw new \Exception("Failed to create server in Pterodactyl");
            }

            // Обновляем заказ
            $this->order->update([
                "status" => Order::STATUS_COMPLETED,
                "pterodactyl_server_id" => $server->pterodactyl_id,
                "pterodactyl_node_id" => $server->node_id,
            ]);

            // Обновляем сервер
            $server->update(["status" => Server::STATUS_ACTIVE]);

            // Отправляем уведомление пользователю
            $this->sendNotification($server);

            Log::info("Pterodactyl server created successfully", [
                "order_id" => $this->order->id,
                "server_id" => $server->id,
                "pterodactyl_id" => $server->pterodactyl_id,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to create Pterodactyl server", [
                "order_id" => $this->order->id,
                "error" => $e->getMessage(),
            ]);

            // Обновляем статус заказа
            $this->order->update(["status" => Order::STATUS_FAILED]);

            // Отменяем платёж если нужно
            throw $e;
        }
    }

    /**
     * Получить или создать пользователя в Pterodactyl
     */
    protected function getOrCreatePterodactylUser(
        User $user,
        PterodactylService $pterodactyl,
    ): User {
        if ($user->pterodactyl_id) {
            // Проверяем существует ли пользователь
            $existingUser = $pterodactyl->getUser($user->pterodactyl_id);

            if ($existingUser) {
                return $user;
            }
        }

        // Ищем пользователя по email
        $existingUser = $pterodactyl->findUserByEmail($user->email);

        if ($existingUser) {
            $user->update(["pterodactyl_id" => $existingUser["id"]]);
            return $user;
        }

        // Создаём нового пользователя
        return $pterodactyl->createUser($user) ? $user : $user;
    }

    /**
     * Получить случайную ноду из доступных
     */
    protected function getRandomNode(?array $nodes): ?int
    {
        if (empty($nodes)) {
            return null;
        }

        return $nodes[array_rand($nodes)];
    }

    /**
     * Получить информацию о яйце
     */
    protected function getEggInfo(
        PterodactylService $pterodactyl,
        int $nodeId,
        int $eggId,
    ): array {
        // Получаем ноду чтобы узнать nest_id
        $node = $pterodactyl->getNode($nodeId);

        if (!$node) {
            throw new \Exception("Node {$nodeId} not found");
        }

        // Получаем яйцо
        return $pterodactyl->getEgg(
            $node["attributes"]["nest_id"] ?? 1,
            $eggId,
        ) ?? [];
    }

    /**
     * Рассчитать следующую дату биллинга
     */
    protected function getNextBillingDate(string $billingCycle): \Carbon\Carbon
    {
        $date = now();

        return match ($billingCycle) {
            "quarterly" => $date->addMonths(3),
            "yearly" => $date->addYear(),
            default => $date->addMonth(),
        };
    }

    /**
     * Отправить уведомление
     */
    protected function sendNotification(Server $server): void
    {
        // TODO: Отправить email уведомление
        Log::info("Server created notification", [
            "server_id" => $server->id,
            "user_id" => $server->user_id,
        ]);
    }
}
