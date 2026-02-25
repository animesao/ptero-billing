<?php

namespace App\Console\Commands;

use App\Models\Invoice;
use App\Models\Product;
use App\Models\Server;
use App\Models\Setting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class GenerateInvoices extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'billing:generate-invoices';

    /**
     * The console command description.
     */
    protected $description = 'Генерация инвойсов для продления серверов';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        Log::info('Starting invoice generation');
        $this->info('Генерация инвойсов для продления...');

        $taxRate = config('billing.tax_rate', 0) / 100;

        // Находим серверы у которых скоро дата продления
        $servers = Server::where('status', Server::STATUS_ACTIVE)
            ->whereNotNull('next_billing_date')
            ->where('next_billing_date', '<=', now()->addDays(7))
            ->get();

        foreach ($servers as $server) {
            // Проверяем не создан ли уже инвойс
            $existingInvoice = Invoice::where('server_id', $server->id)
                ->where('status', Invoice::STATUS_UNPAID)
                ->first();

            if ($existingInvoice) {
                continue;
            }

            $this->createInvoice($server, $taxRate);
        }

        $this->info('Генерация инвойсов завершена');
        Log::info('Invoice generation completed');

        return Command::SUCCESS;
    }

    /**
     * Создать инвойс для сервера
     */
    protected function createInvoice(Server $server, float $taxRate): void
    {
        $product = $server->product;
        $basePrice = $product->getCycledPrice();
        $tax = $basePrice * $taxRate;
        $total = $basePrice + $tax;

        $invoiceNumber = $this->generateInvoiceNumber();

        $invoice = Invoice::create([
            'user_id' => $server->user_id,
            'server_id' => $server->id,
            'invoice_number' => $invoiceNumber,
            'status' => Invoice::STATUS_UNPAID,
            'subtotal' => $basePrice,
            'tax' => $tax,
            'discount' => 0,
            'total' => $total,
            'billing_cycle' => $product->billing_cycle,
            'due_date' => $server->next_billing_date,
        ]);

        $this->info("Создан инвойс #{$invoiceNumber} для сервера #{$server->id}");
        Log::info('Invoice created', [
            'invoice_id' => $invoice->id,
            'server_id' => $server->id,
        ]);

        // TODO: Отправить email уведомление пользователю
    }

    /**
     * Сгенерировать уникальный номер инвойса
     */
    protected function generateInvoiceNumber(): string
    {
        $prefix = Setting::get('invoice_prefix', 'INV');
        $date = now()->format('Ymd');
        $random = strtoupper(substr(uniqid(), -6));

        return "{$prefix}-{$date}-{$random}";
    }
}
