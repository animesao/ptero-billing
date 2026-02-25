<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'invoice_id',
        'order_id',
        'gateway',
        'transaction_id',
        'status',
        'amount',
        'currency',
        'payload',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payload' => 'array',
        'paid_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Статусы платежа
     */
    const STATUS_PENDING = 'pending';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';
    const STATUS_REFUNDED = 'refunded';

    /**
     * Платёжные шлюзы
     */
    const GATEWAY_STRIPE = 'stripe';
    const GATEWAY_PAYPAL = 'paypal';
    const GATEWAY_BALANCE = 'balance';

    /**
     * Связь с пользователем
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Связь с инвойсом
     */
    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Связь с заказом
     */
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Проверка статуса
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }
}
