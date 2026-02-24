<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'pterodactyl_egg_id',
        'egg_name',
        'price',
        'billing_cycle',
        'cpu',
        'memory',
        'disk',
        'io',
        'databases',
        'allocations',
        'backups',
        'nodes',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'nodes' => 'array',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Типы биллинговых циклов
     */
    const CYCLE_MONTHLY = 'monthly';
    const CYCLE_QUARTERLY = 'quarterly';
    const CYCLE_YEARLY = 'yearly';
    const CYCLE_ONETIME = 'onetime';

    /**
     * Получить множитель цены для цикла
     */
    public function getPriceMultiplier(): float
    {
        return match ($this->billing_cycle) {
            self::CYCLE_QUARTERLY => 3,
            self::CYCLE_YEARLY => 12,
            default => 1,
        };
    }

    /**
     * Получить цену с учётом цикла
     */
    public function getCycledPrice(): float
    {
        return $this->price * $this->getPriceMultiplier();
    }

    /**
     * Связь с заказами
     */
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Связь с серверами
     */
    public function servers()
    {
        return $this->hasMany(Server::class);
    }

    /**
     * Проверка доступности продукта
     */
    public function isAvailable(): bool
    {
        return $this->is_active && !empty($this->nodes);
    }

    /**
     * Получить названия биллингового цикла
     */
    public function getBillingCycleName(): string
    {
        return match ($this->billing_cycle) {
            self::CYCLE_MONTHLY => 'Ежемесячно',
            self::CYCLE_QUARTERLY => 'Ежеквартально',
            self::CYCLE_YEARLY => 'Ежегодно',
            self::CYCLE_ONETIME => 'Одноразово',
            default => $this->billing_cycle,
        };
    }
}
