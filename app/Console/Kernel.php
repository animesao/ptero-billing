<?php

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Проверка инвойсов каждый день в 00:00
        $schedule->command('billing:check-invoices')
            ->daily()
            ->at('00:00')
            ->withoutOverlapping();

        // Генерация инвойсов каждый день в 01:00
        $schedule->command('billing:generate-invoices')
            ->daily()
            ->at('01:00')
            ->withoutOverlapping();

        // Запуск воркера очередей
        $schedule->command('queue:work --stop-when-empty')
            ->everyMinute()
            ->withoutOverlapping();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
