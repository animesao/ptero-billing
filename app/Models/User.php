<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'pterodactyl_id',
        'pterodactyl_api_key',
        'balance',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'pterodactyl_api_key',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'balance' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Роли пользователей
     */
    const ROLE_ADMIN = 'admin';
    const ROLE_USER = 'user';

    /**
     * Статусы пользователя
     */
    const STATUS_ACTIVE = 'active';
    const STATUS_SUSPENDED = 'suspended';
    const STATUS_BANNED = 'banned';

    /**
     * Проверка на администратора
     */
    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    /**
     * Связь с серверами
     */
    public function servers()
    {
        return $this->hasMany(Server::class);
    }

    /**
     * Связь с заказами
     */
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Связь с инвойсами
     */
    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * Связь с платежами
     */
    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Связь с купонами (использованные)
     */
    public function usedCoupons()
    {
        return $this->belongsToMany(Coupon::class, 'coupon_user')
            ->withTimestamps();
    }
}
