<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'server_id',
        'invoice_number',
        'status',
        'subtotal',
        'tax',
        'discount',
        'total',
        'billing_cycle',
        'due_date',
        'paid_at',
        'notes',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'discount' => 'decimal:2',
        'total' => 'decimal:2',
        'due_date' => 'date',
        'paid_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Статусы инвойса
     */
    const STATUS_UNPAID = 'unpaid';
    const STATUS_PAID = 'paid';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_OVERDUE = 'overdue';

    /**
     * Связь с пользователем
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Связь с сервером
     */
    public function server()
    {
        return $this->belongsTo(Server::class);
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
    public function isUnpaid(): bool
    {
        return $this->status === self::STATUS_UNPAID;
    }

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    public function isOverdue(): bool
    {
        return $this->status === self::STATUS_OVERDUE;
    }

    /**
     * Проверка просрочки
     */
    public function checkOverdue(): bool
    {
        if ($this->isUnpaid() && $this->due_date->isPast()) {
            $this->update(['status' => self::STATUS_OVERDUE]);
            return true;
        }
        return false;
    }

    /**
     * Получить дату следующего биллинга
     */
    public function getNextBillingDate(): \Carbon\Carbon
    {
        return match ($this->billing_cycle) {
            Product::CYCLE_QUARTERLY => $this->due_date->copy()->addMonths(3),
            Product::CYCLE_YEARLY => $this->due_date->copy()->addYear(),
            default => $this->due_date->copy()->addMonth(),
        };
    }
}
