<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'product_id',
        'status',
        'total',
        'discount',
        'coupon_id',
        'server_name',
        'cpu',
        'memory',
        'disk',
        'pterodactyl_server_id',
        'pterodactyl_node_id',
        'notes',
        'paid_at',
    ];

    protected $casts = [
        'total' => 'decimal:2',
        'discount' => 'decimal:2',
        'paid_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Статусы заказа
     */
    const STATUS_PENDING = 'pending';
    const STATUS_PAID = 'paid';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_FAILED = 'failed';
    const STATUS_COMPLETED = 'completed';

    /**
     * Связь с пользователем
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Связь с продуктом
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Связь с купоном
     */
    public function coupon()
    {
        return $this->belongsTo(Coupon::class);
    }

    /**
     * Связь с сервером
     */
    public function server()
    {
        return $this->hasOne(Server::class);
    }

    /**
     * Связь с платежами
     */
    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Проверка статуса
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Получить цену с учётом цикла продукта
     */
    public function getCycledTotal(): float
    {
        $basePrice = $this->product->getCycledPrice();
        return $basePrice - $this->discount;
    }
}
