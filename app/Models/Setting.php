<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
    ];

    /**
     * Получить значение настройки
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();

        if (!$setting) {
            return $default;
        }

        return match ($setting->type) {
            'boolean' => (bool) $setting->value,
            'number' => (float) $setting->value,
            'json' => json_decode($setting->value, true),
            default => $setting->value,
        };
    }

    /**
     * Установить значение настройки
     */
    public static function set(string $key, mixed $value, string $type = 'string', string $group = 'general'): void
    {
        $setting = static::firstOrNew(['key' => $key]);

        $setting->value = match ($type) {
            'json' => json_encode($value),
            default => (string) $value,
        };

        $setting->type = $type;
        $setting->group = $group;
        $setting->save();
    }
}
