<?php

namespace App\Services;

use App\Models\Server;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PterodactylService
{
    protected string $url;
    protected string $apiKey;
    protected int $timeout;

    public function __construct()
    {
        $this->url = config('pterodactyl.url');
        $this->apiKey = config('pterodactyl.api_key');
        $this->timeout = config('pterodactyl.timeout', 30);
    }

    /**
     * Получить базовые заголовки для API запросов
     */
    protected function getHeaders(): array
    {
        return [
            'Authorization' => "Bearer {$this->apiKey}",
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ];
    }

    /**
     * Выполнить GET запрос
     */
    protected function get(string $endpoint, array $query = [])
    {
        $response = Http::withHeaders($this->getHeaders())
            ->timeout($this->timeout)
            ->get("{$this->url}/api/application/{$endpoint}", $query);

        return $this->handleResponse($response);
    }

    /**
     * Выполнить POST запрос
     */
    protected function post(string $endpoint, array $data)
    {
        $response = Http::withHeaders($this->getHeaders())
            ->timeout($this->timeout)
            ->post("{$this->url}/api/application/{$endpoint}", $data);

        return $this->handleResponse($response);
    }

    /**
     * Выполнить DELETE запрос
     */
    protected function delete(string $endpoint)
    {
        $response = Http::withHeaders($this->getHeaders())
            ->timeout($this->timeout)
            ->delete("{$this->url}/api/application/{$endpoint}");

        return $this->handleResponse($response);
    }

    /**
     * Обработка ответа от API
     */
    protected function handleResponse($response)
    {
        if ($response->failed()) {
            Log::error('Pterodactyl API Error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new \Exception(
                "Pterodactyl API Error: {$response->status()}",
                $response->status()
            );
        }

        return $response->json();
    }

    /**
     * Проверить соединение с API
     */
    public function testConnection(): bool
    {
        try {
            $this->get('users?page=1');
            return true;
        } catch (\Exception $e) {
            Log::error('Pterodactyl connection test failed', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Получить всех пользователей
     */
    public function getUsers(int $page = 1, int $perPage = 50): array
    {
        $response = $this->get("users", ['page' => $page, 'per_page' => $perPage]);
        return $response['data'] ?? [];
    }

    /**
     * Получить пользователя по ID
     */
    public function getUser(int $userId): ?array
    {
        try {
            $response = $this->get("users/{$userId}");
            return $response['attributes'] ?? null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Найти пользователя по email
     */
    public function findUserByEmail(string $email): ?array
    {
        $response = $this->get("users", ['filter[email]' => $email]);

        foreach ($response['data'] ?? [] as $user) {
            if ($user['attributes']['email'] === $email) {
                return $user['attributes'];
            }
        }

        return null;
    }

    /**
     * Создать пользователя в Pterodactyl
     */
    public function createUser(User $user): ?array
    {
        $data = [
            'email' => $user->email,
            'username' => $this->generateUsername($user),
            'first_name' => explode(' ', $user->name)[0],
            'last_name' => implode(' ', array_slice(explode(' ', $user->name), 1)) ?: $user->name,
            'password' => bin2hex(random_bytes(16)),
        ];

        $response = $this->post('users', $data);

        if (isset($response['attributes']['id'])) {
            $user->update(['pterodactyl_id' => $response['attributes']['id']]);
        }

        return $response['attributes'] ?? null;
    }

    /**
     * Сгенерировать имя пользователя
     */
    protected function generateUsername(User $user): string
    {
        $base = preg_replace('/[^a-zA-Z0-9]/', '', explode('@', $user->email)[0]);
        $base = substr($base, 0, 20);

        $attempt = 0;
        $username = $base;

        while ($this->findUserByUsername($username)) {
            $attempt++;
            $username = substr($base, 0, 20 - strlen((string) $attempt)) . $attempt;
        }

        return $username;
    }

    /**
     * Найти пользователя по имени
     */
    protected function findUserByUsername(string $username): ?array
    {
        $response = $this->get("users", ['filter[username]' => $username]);
        return !empty($response['data']) ? $response['data'][0]['attributes'] : null;
    }

    /**
     * Получить все ноды
     */
    public function getNodes(): array
    {
        $response = $this->get('nodes');
        return $response['data'] ?? [];
    }

    /**
     * Получить ноду по ID
     */
    public function getNode(int $nodeId): ?array
    {
        try {
            $response = $this->get("nodes/{$nodeId}");
            return $response['attributes'] ?? null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Получить все локации
     */
    public function getLocations(): array
    {
        $response = $this->get('locations');
        return $response['data'] ?? [];
    }

    /**
     * Получить все яйца (eggs)
     */
    public function getEggs(int $nestId = null): array
    {
        $endpoint = $nestId ? "nests/{$nestId}/eggs" : 'nests';
        $response = $this->get($endpoint);

        if ($nestId) {
            return $response['data'] ?? [];
        }

        // Если получаем все nests, собираем яйца из всех
        $eggs = [];
        foreach ($response['data'] ?? [] as $nest) {
            if (isset($nest['attributes']['eggs'])) {
                $eggs = array_merge($eggs, $nest['attributes']['eggs']);
            }
        }

        return $eggs;
    }

    /**
     * Получить яйцо по ID
     */
    public function getEgg(int $nestId, int $eggId): ?array
    {
        try {
            $response = $this->get("nests/{$nestId}/eggs/{$eggId}", ['include' => 'variables']);
            return $response['attributes'] ?? null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Получить все серверы
     */
    public function getServers(int $page = 1, int $perPage = 50): array
    {
        $response = $this->get("servers", ['page' => $page, 'per_page' => $perPage]);
        return $response['data'] ?? [];
    }

    /**
     * Создать сервер в Pterodactyl
     */
    public function createServer(Server $server, User $user, array $eggVariables = []): ?array
    {
        // Получаем информацию о ноде
        $node = $this->getNode($server->node_id);
        if (!$node) {
            throw new \Exception("Node {$server->node_id} not found");
        }

        // Получаем свободную аллокацию
        $allocation = $this->getAvailableAllocation($server->node_id);
        if (!$allocation) {
            throw new \Exception("No available allocations on node {$server->node_id}");
        }

        // Формируем данные для создания сервера
        $data = [
            'name' => $server->name,
            'user' => $user->pterodactyl_id,
            'node' => $server->node_id,
            'egg' => $server->product->pterodactyl_egg_id,
            'docker_image' => $eggVariables['docker_image'] ?? 'ghcr.io/pterodactyl/yolks:latest',
            'startup' => $eggVariables['startup'] ?? '',
            'environment' => $this->prepareEnvironment($eggVariables, $server),
            'limits' => [
                'memory' => $server->memory,
                'swap' => 0,
                'disk' => $server->disk,
                'io' => $server->io,
                'cpu' => $server->cpu,
                'threads' => null,
            ],
            'feature_limits' => [
                'databases' => $server->databases,
                'allocations' => $server->allocations,
                'backups' => $server->backups,
            ],
            'allocation' => [
                'default' => $allocation['id'],
                'additional' => [],
            ],
        ];

        $response = $this->post('servers', $data);

        if (isset($response['attributes']['id'])) {
            $attrs = $response['attributes'];
            $server->update([
                'pterodactyl_id' => $attrs['id'],
                'identifier' => $attrs['identifier'],
            ]);
        }

        return $response['attributes'] ?? null;
    }

    /**
     * Подготовить переменные окружения для сервера
     */
    protected function prepareEnvironment(array $eggVariables, Server $server): array
    {
        $environment = [];

        foreach ($eggVariables['variables'] ?? [] as $variable) {
            $envName = $variable['env_variable'] ?? '';
            $defaultValue = $variable['default_value'] ?? '';

            if ($envName) {
                $environment[$envName] = $defaultValue;
            }
        }

        return $environment;
    }

    /**
     * Получить свободную аллокацию на ноде
     */
    protected function getAvailableAllocation(int $nodeId): ?array
    {
        $response = $this->get("nodes/{$nodeId}/allocations");

        foreach ($response['data'] ?? [] as $allocation) {
            if (!$allocation['attributes']['assigned']) {
                return $allocation['attributes'];
            }
        }

        return null;
    }

    /**
     * Получить сервер по ID
     */
    public function getServer(int $serverId): ?array
    {
        try {
            $response = $this->get("servers/{$serverId}");
            return $response['attributes'] ?? null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Обновить билд сервера
     */
    public function updateServerBuild(int $serverId, array $data): ?array
    {
        $response = Http::withHeaders($this->getHeaders())
            ->timeout($this->timeout)
            ->patch("{$this->url}/api/application/servers/{$serverId}/build", $data);

        return $this->handleResponse($response);
    }

    /**
     * Приостановить сервер
     */
    public function suspendServer(int $serverId): bool
    {
        try {
            $this->post("servers/{$serverId}/suspend");
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to suspend server', [
                'server_id' => $serverId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Разблокировать сервер
     */
    public function unsuspendServer(int $serverId): bool
    {
        try {
            $this->post("servers/{$serverId}/unsuspend");
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to unsuspend server', [
                'server_id' => $serverId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Удалить сервер
     */
    public function deleteServer(int $serverId): bool
    {
        try {
            $this->delete("servers/{$serverId}");
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to delete server', [
                'server_id' => $serverId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Получить Client API токен для пользователя
     */
    public function getClientApiKey(User $user): ?string
    {
        // Если у пользователя уже есть API ключ, возвращаем его
        if ($user->pterodactyl_api_key) {
            return $user->pterodactyl_api_key;
        }

        // Создаём новый токен через API Pterodactyl
        try {
            $response = Http::withHeaders($this->getHeaders())
                ->timeout($this->timeout)
                ->post("{$this->url}/api/application/users/{$user->pterodactyl_id}/api-keys", [
                    'description' => 'Billing System Token',
                    'allowed_ips' => [],
                ]);

            if ($response->successful()) {
                $data = $response->json();
                $token = $data['attributes']['identifier'] . $data['attributes']['token'];
                $user->update(['pterodactyl_api_key' => $token]);
                return $token;
            }
        } catch (\Exception $e) {
            Log::error('Failed to create client API key', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }

        return null;
    }

    /**
     * Отправить команду серверу (старт, стоп, рестарт)
     */
    public function sendPowerAction(Server $server, string $action): bool
    {
        $action = match ($action) {
            'start' => 'start',
            'stop' => 'stop',
            'restart' => 'restart',
            'kill' => 'kill',
            default => null,
        };

        if (!$action) {
            return false;
        }

        try {
            Http::withHeaders([
                'Authorization' => "Bearer " . $this->getClientApiKey($server->user),
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])
            ->timeout(30)
            ->post("{$this->url}/api/client/servers/{$server->identifier}/power", [
                'signal' => $action,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send power action', [
                'server_id' => $server->id,
                'action' => $action,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Получить статус сервера
     */
    public function getServerStatus(Server $server): ?string
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer " . $this->getClientApiKey($server->user),
                'Accept' => 'application/json',
            ])
            ->timeout(30)
            ->get("{$this->url}/api/client/servers/{$server->identifier}");

            if ($response->successful()) {
                $data = $response->json();
                return $data['attributes']['status'] ?? null;
            }
        } catch (\Exception $e) {
            Log::error('Failed to get server status', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
        }

        return null;
    }

    /**
     * Получить ресурсы сервера
     */
    public function getServerResources(Server $server): ?array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer " . $this->getClientApiKey($server->user),
                'Accept' => 'application/json',
            ])
            ->timeout(30)
            ->get("{$this->url}/api/client/servers/{$server->identifier}/resources");

            if ($response->successful()) {
                $data = $response->json();
                return $data['attributes'] ?? null;
            }
        } catch (\Exception $e) {
            Log::error('Failed to get server resources', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
        }

        return null;
    }
}
