<?php

namespace App\Http\Controllers;

use App\Jobs\CreatePterodactylServer;
use App\Models\Coupon;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Product;
use App\Models\Server;
use App\Services\PterodactylService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function __construct()
    {
        $this->middleware("auth");
    }

    public function index()
    {
        $orders = Order::where("user_id", Auth::id())
            ->with("product")
            ->latest()
            ->paginate(10);

        return view("orders.index", compact("orders"));
    }

    public function create(Product $product)
    {
        if (!$product->is_active) {
            abort(404);
        }

        return view("orders.create", compact("product"));
    }

    public function store(Request $request, Product $product)
    {
        if (!$product->is_active) {
            abort(404);
        }

        $validated = $request->validate([
            "server_name" => "required|string|max:255",
            "coupon_code" => "nullable|string|max:50",
        ]);

        $discount = 0;
        $coupon = null;

        // Применяем купон если есть
        if (!empty($validated["coupon_code"])) {
            $coupon = Coupon::where("code", $validated["coupon_code"])->first();

            if (
                $coupon &&
                $coupon->isValid(Auth::user(), $product->getCycledPrice())
            ) {
                $discount = $coupon->calculateDiscount(
                    $product->getCycledPrice(),
                );
            }
        }

        $total = $product->getCycledPrice() - $discount;

        DB::beginTransaction();

        try {
            // Создаём заказ
            $order = Order::create([
                "user_id" => Auth::id(),
                "product_id" => $product->id,
                "status" => Order::STATUS_PENDING,
                "total" => $total,
                "discount" => $discount,
                "coupon_id" => $coupon?->id,
                "server_name" => $validated["server_name"],
                "cpu" => $product->cpu,
                "memory" => $product->memory,
                "disk" => $product->disk,
            ]);

            // Применяем купон к пользователю
            if ($coupon) {
                $coupon->applyToUser(Auth::user());
            }

            // Создаём инвойс для оплаты
            $invoice = $order->invoices()->create([
                "invoice_number" =>
                    "INV-" . now()->format("Ymd") . "-" . strtoupper(uniqid()),
                "status" => Invoice::STATUS_UNPAID,
                "subtotal" => $product->getCycledPrice(),
                "tax" => 0,
                "discount" => $discount,
                "total" => $total,
                "billing_cycle" => $product->billing_cycle,
                "due_date" => now()->addDays(3),
            ]);

            DB::commit();

            return redirect()
                ->route("invoices.show", $invoice)
                ->with("success", "Заказ создан. Пожалуйста, оплатите инвойс.");
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with(
                "error",
                "Ошибка при создании заказа: " . $e->getMessage(),
            );
        }
    }

    public function show(Order $order)
    {
        if ($order->user_id !== Auth::id()) {
            abort(403);
        }

        $order->load("product", "coupon", "server", "invoices");

        return view("orders.show", compact("order"));
    }
}
