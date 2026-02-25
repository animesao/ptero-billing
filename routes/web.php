<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ServerController;
use App\Http\Controllers\WebhookController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Публичные маршруты
Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/products', [HomeController::class, 'products'])->name('products.index');
Route::get('/products/{product}', [HomeController::class, 'product'])->name('products.show');

// Аутентификация
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/register', [AuthController::class, 'showRegisterForm'])->name('register');
    Route::post('/register', [AuthController::class, 'register']);
});

// Маршруты для авторизованных пользователей
Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    // Дашборд
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Серверы
    Route::prefix('servers')->name('servers.')->group(function () {
        Route::get('/', [ServerController::class, 'index'])->name('index');
        Route::get('/{server}', [ServerController::class, 'show'])->name('show');
        Route::post('/{server}/power', [ServerController::class, 'power'])->name('power');
        Route::post('/{server}/renew', [ServerController::class, 'renew'])->name('renew');
    });

    // Заказы
    Route::prefix('orders')->name('orders.')->group(function () {
        Route::get('/', [OrderController::class, 'index'])->name('index');
        Route::get('/create/{product}', [OrderController::class, 'create'])->name('create');
        Route::post('/create/{product}', [OrderController::class, 'store']);
        Route::get('/{order}', [OrderController::class, 'show'])->name('show');
    });

    // Инвойсы
    Route::prefix('invoices')->name('invoices.')->group(function () {
        Route::get('/', [InvoiceController::class, 'index'])->name('index');
        Route::get('/{invoice}', [InvoiceController::class, 'show'])->name('show');
        Route::post('/{invoice}/pay', [InvoiceController::class, 'pay'])->name('pay');
        Route::get('/{invoice}/stripe/success', [InvoiceController::class, 'stripeSuccess'])->name('stripe.success');
        Route::get('/{invoice}/paypal/success', [InvoiceController::class, 'paypalSuccess'])->name('paypal.success');
    });
});

// Webhooks
Route::post('/webhooks/stripe', [WebhookController::class, 'stripe']);
Route::post('/webhooks/paypal', [WebhookController::class, 'paypal']);
