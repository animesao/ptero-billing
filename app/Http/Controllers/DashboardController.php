<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Order;
use App\Models\Server;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index()
    {
        $user = Auth::user();

        $servers = Server::where('user_id', $user->id)
            ->latest()
            ->take(5)
            ->get();

        $invoices = Invoice::where('user_id', $user->id)
            ->latest()
            ->take(5)
            ->get();

        $orders = Order::where('user_id', $user->id)
            ->latest()
            ->take(5)
            ->get();

        return view('dashboard', compact('servers', 'invoices', 'orders'));
    }
}
