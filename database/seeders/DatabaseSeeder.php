<?php

namespace Database\Seeders;

use App\Models\Coupon;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Создание администратора
        User::create([
            'name' => 'Администратор',
            'email' => 'admin@example.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        // Создание тестового пользователя
        User::create([
            'name' => 'Тестовый пользователь',
            'email' => 'user@example.com',
            'password' => Hash::make('user123'),
            'role' => 'user',
            'status' => 'active',
            'balance' => 1000,
        ]);

        // Создание продуктов
        Product::create([
            'name' => 'Minecraft Starter',
            'description' => 'Идеально для начала игры с друзьями. Подходит для небольших серверов с плагинами.',
            'pterodactyl_egg_id' => 1, // Замените на актуальный ID
            'egg_name' => 'Minecraft',
            'price' => 299,
            'billing_cycle' => 'monthly',
            'cpu' => 100,
            'memory' => 1024,
            'disk' => 5120,
            'io' => 500,
            'databases' => 1,
            'allocations' => 1,
            'backups' => 2,
            'nodes' => [1],
            'is_active' => true,
            'sort_order' => 1,
        ]);

        Product::create([
            'name' => 'Minecraft Standard',
            'description' => 'Оптимальный выбор для сервера с модами и большим количеством игроков.',
            'pterodactyl_egg_id' => 1,
            'egg_name' => 'Minecraft',
            'price' => 599,
            'billing_cycle' => 'monthly',
            'cpu' => 200,
            'memory' => 2048,
            'disk' => 10240,
            'io' => 500,
            'databases' => 2,
            'allocations' => 2,
            'backups' => 5,
            'nodes' => [1],
            'is_active' => true,
            'sort_order' => 2,
        ]);

        Product::create([
            'name' => 'Minecraft Premium',
            'description' => 'Максимальная производительность для больших проектов с онлайном 100+.',
            'pterodactyl_egg_id' => 1,
            'egg_name' => 'Minecraft',
            'price' => 999,
            'billing_cycle' => 'monthly',
            'cpu' => 400,
            'memory' => 4096,
            'disk' => 20480,
            'io' => 1000,
            'databases' => 4,
            'allocations' => 4,
            'backups' => 10,
            'nodes' => [1],
            'is_active' => true,
            'sort_order' => 3,
        ]);

        Product::create([
            'name' => 'CS:GO Server',
            'description' => 'Сервер для Counter-Strike: Global Offensive. Поддержка плагинов и модов.',
            'pterodactyl_egg_id' => 2, // Замените на актуальный ID
            'egg_name' => 'CS:GO',
            'price' => 399,
            'billing_cycle' => 'monthly',
            'cpu' => 150,
            'memory' => 1536,
            'disk' => 5120,
            'io' => 500,
            'databases' => 2,
            'allocations' => 2,
            'backups' => 3,
            'nodes' => [1],
            'is_active' => true,
            'sort_order' => 4,
        ]);

        Product::create([
            'name' => 'Rust Server',
            'description' => 'Высокопроизводительный сервер для Rust. Поддержка модов и плагинов.',
            'pterodactyl_egg_id' => 3, // Замените на актуальный ID
            'egg_name' => 'Rust',
            'price' => 799,
            'billing_cycle' => 'monthly',
            'cpu' => 300,
            'memory' => 3072,
            'disk' => 15360,
            'io' => 1000,
            'databases' => 2,
            'allocations' => 2,
            'backups' => 5,
            'nodes' => [1],
            'is_active' => true,
            'sort_order' => 5,
        ]);

        // Создание купонов
        Coupon::create([
            'code' => 'WELCOME10',
            'description' => 'Скидка 10% на первый заказ',
            'type' => 'percent',
            'value' => 10,
            'min_order' => 0,
            'max_uses' => 0,
            'uses_count' => 0,
            'is_active' => true,
        ]);

        Coupon::create([
            'code' => 'SUMMER2024',
            'description' => 'Летняя скидка 500₽',
            'type' => 'fixed',
            'value' => 500,
            'min_order' => 1000,
            'max_uses' => 100,
            'uses_count' => 0,
            'is_active' => true,
            'expires_at' => now()->addMonths(3),
        ]);

        // Настройки
        Setting::create([
            'key' => 'invoice_prefix',
            'value' => 'INV',
            'type' => 'string',
            'group' => 'general',
        ]);

        Setting::create([
            'key' => 'tax_rate',
            'value' => '0',
            'type' => 'number',
            'group' => 'billing',
        ]);
    }
}
