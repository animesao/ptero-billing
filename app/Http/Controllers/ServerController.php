<?php

namespace App\Http\Controllers;

use App\Jobs\SuspendPterodactylServer;
use App\Jobs\TerminatePterodactylServer;
use App\Jobs\UnsuspendPterodactylServer;
use App\Models\Server;
use App\Services\PterodactylService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ServerController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index()
    {
        $servers = Server::where('user_id', Auth::id())
            ->with('product')
            ->latest()
            ->paginate(10);

        return view('servers.index', compact('servers'));
    }

    public function show(Server $server)
    {
        if ($server->user_id !== Auth::id()) {
            abort(403);
        }

        $server->load('product', 'invoices');

        return view('servers.show', compact('server'));
    }

    public function power(Server $server, Request $request, PterodactylService $pterodactyl)
    {
        if ($server->user_id !== Auth::id()) {
            abort(403);
        }

        $action = $request->input('action');

        if (!in_array($action, ['start', 'stop', 'restart', 'kill'])) {
            return back()->with('error', 'Недопустимое действие');
        }

        $success = $pterodactyl->sendPowerAction($server, $action);

        if ($success) {
            return back()->with('success', "Команда '{$action}' отправлена");
        }

        return back()->with('error', 'Не удалось отправить команду');
    }

    public function renew(Server $server)
    {
        if ($server->user_id !== Auth::id()) {
            abort(403);
        }

        // Создаём инвойс для продления
        $invoice = $server->invoices()->create([
            'invoice_number' => 'INV-' . now()->format('Ymd') . '-' . uniqid(),
            'status' => 'unpaid',
            'subtotal' => $server->product->getCycledPrice(),
            'tax' => 0,
            'discount' => 0,
            'total' => $server->product->getCycledPrice(),
            'billing_cycle' => $server->product->billing_cycle,
            'due_date' => $server->next_billing_date ?? now()->addMonth(),
        ]);

        return redirect()->route('invoices.show', $invoice)
            ->with('success', 'Инвойс на продление создан');
    }
}
