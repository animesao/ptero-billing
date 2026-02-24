<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Server extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'order_id',
        'product_id',
        'name',
        'pterodactyl_id',
        'identifier',
        'node_id',
        'status',
        'cpu',
        'memory',
        'disk',
        'io',
        'databases',
        'allocations',
        'backups',
        'ip_address',
        'port',
        'next_billing_date',
        'suspended_at',
        'terminated_at',
    ];

    protected $casts = [
        'next_billing_date' => 'datetime',
        'suspended_at' => 'datetime',
        'terminated_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Статусы сервера
     */
    const STATUS_PENDING = 'pending';
    const STATUS_ACTIVE = 'active';
    const STATUS_SUSPENDED = 'suspended';
    const STATUS_TERMINATED = 'terminated';

    /**
     * Связь с пользователем
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Связь с заказом
     */
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Связь с продуктом
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Связь с инвойсами
     */
    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * Проверка статуса
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isSuspended(): bool
    {
        return $this->status === self::STATUS_SUSPENDED;
    }

    public function isTerminated(): bool
    {
        return $this->status === self::STATUS_TERMINATED;
    }

    /**
     * Получить адрес сервера
     */
    public function getAddressAttribute(): string
    {
        return "{$this->ip_address}:{$this->port}";
    }
}
