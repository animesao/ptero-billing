<?php

namespace App\Console\Commands;

use App\Jobs\SuspendPterodactylServer;
use App\Jobs\TerminatePterodactylServer;
use App\Models\Invoice;
use App\Models\Server;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckInvoices extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'billing:check-invoices';

    /**
     * The console command description.
     */
    protected $description = 'Проверка просроченных инвойсов и суспенд серверов';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        Log::info('Starting invoice check');
        $this->info('Проверка просроченных инвойсов...');

        $gracePeriod = config('billing.grace_period', 3);
        $terminationPeriod = config('billing.termination_period', 7);

        // Находим просроченные неоплаченные инвойсы
        $overdueInvoices = Invoice::where('status', Invoice::STATUS_UNPAID)
            ->where('due_date', '<', now())
            ->get();

        foreach ($overdueInvoices as $invoice) {
            $daysOverdue = now()->diffInDays($invoice->due_date, false);

            // Проверяем нужно ли_suspend
            if ($daysOverdue >= $gracePeriod) {
                $this->processOverdueInvoice($invoice, $daysOverdue, $terminationPeriod);
            }
        }

        // Проверяем инвойсы со статусом overdue для удаления
        $this->checkForTermination($terminationPeriod);

        $this->info('Проверка завершена');
        Log::info('Invoice check completed');

        return Command::SUCCESS;
    }

    /**
     * Обработать просроченный инвойс
     */
    protected function processOverdueInvoice(Invoice $invoice, int $daysOverdue, int $terminationPeriod): void
    {
        // Обновляем статус инвойса
        if ($invoice->status === Invoice::STATUS_UNPAID) {
            $invoice->update(['status' => Invoice::STATUS_OVERDUE]);
        }

        $server = $invoice->server;

        if (!$server) {
            return;
        }

        // Если ещё не приостановлен
        if (!$server->isSuspended()) {
            // Проверяем не истёк ли период до удаления
            if ($daysOverdue >= $terminationPeriod) {
                $this->terminateServer($server);
            } else {
                $this->suspendServer($server);
            }
        } elseif ($server->isSuspended() && $daysOverdue >= $terminationPeriod) {
            // Если уже приостановлен, но прошло достаточно времени для удаления
            $this->terminateServer($server);
        }
    }

    /**
     * Приостановить сервер
     */
    protected function suspendServer(Server $server): void
    {
        $this->info("Приостановка сервера #{$server->id}");
        Log::info('Dispatching suspend job', ['server_id' => $server->id]);

        dispatch(new SuspendPterodactylServer($server));
    }

    /**
     * Удалить сервер
     */
    protected function terminateServer(Server $server): void
    {
        $this->info("Удаление сервера #{$server->id}");
        Log::info('Dispatching terminate job', ['server_id' => $server->id]);

        dispatch(new TerminatePterodactylServer($server));
    }

    /**
     * Проверить серверы для удаления
     */
    protected function checkForTermination(int $terminationPeriod): void
    {
        $suspendedServers = Server::where('status', Server::STATUS_SUSPENDED)
            ->whereNotNull('suspended_at')
            ->get();

        foreach ($suspendedServers as $server) {
            $daysSuspended = now()->diffInDays($server->suspended_at);

            if ($daysSuspended >= $terminationPeriod) {
                $this->terminateServer($server);
            }
        }
    }
}
