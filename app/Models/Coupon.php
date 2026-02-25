<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'description',
        'type',
        'value',
        'min_order',
        'max_uses',
        'uses_count',
        'expires_at',
        'is_active',
        'applicable_products',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'min_order' => 'decimal:2',
        'applicable_products' => 'array',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Типы купонов
     */
    const TYPE_PERCENT = 'percent';
    const TYPE_FIXED = 'fixed';

    /**
     * Связь с пользователями (кто использовал)
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'coupon_user')
            ->withTimestamps();
    }

    /**
     * Связь с заказами
     */
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Проверка валидности купона
     */
    public function isValid(?User $user = null, ?float $orderTotal = null): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        if ($this->max_uses > 0 && $this->uses_count >= $this->max_uses) {
            return false;
        }

        if ($orderTotal !== null && $orderTotal < $this->min_order) {
            return false;
        }

        if ($user && $this->users()->where('user_id', $user->id)->exists()) {
            return false; // Уже использован пользователем
        }

        return true;
    }

    /**
     * Рассчитать скидку
     */
    public function calculateDiscount(float $total): float
    {
        if ($this->type === self::TYPE_PERCENT) {
            return min($total * ($this->value / 100), $total);
        }

        return min($this->value, $total);
    }

    /**
     * Применить купон к пользователю
     */
    public function applyToUser(User $user): void
    {
        if (!$this->users()->where('user_id', $user->id)->exists()) {
            $this->users()->attach($user->id);
            $this->increment('uses_count');
        }
    }

    /**
     * Проверка применимости к продукту
     */
    public function isApplicableToProduct(int $productId): bool
    {
        if (empty($this->applicable_products)) {
            return true; // Применяется ко всем продуктам
        }

        return in_array($productId, $this->applicable_products);
    }
}
