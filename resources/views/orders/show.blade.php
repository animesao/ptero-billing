@extends('layouts.app')

@section('title', 'Заказ #' . $order->id . ' - ' . config('app.name'))

@section('content')
<div class="container py-5">
    <nav aria-label="breadcrumb" class="mb-4">
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="{{ route('dashboard') }}">Дашборд</a></li>
            <li class="breadcrumb-item"><a href="{{ route('orders.index') }}">Заказы</a></li>
            <li class="breadcrumb-item active">Заказ #{{ $order->id }}</li>
        </ol>
    </nav>

    <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Заказ #{{ $order->id }}</h5>
            <span class="badge bg-{{ $order->status === 'completed' ? 'success' : ($order->status === 'pending' ? 'warning' : 'secondary') }}">
                {{ $order->status }}
            </span>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-md-6">
                    <h6>Информация о заказе</h6>
                    <table class="table table-sm">
                        <tr>
                            <td class="text-muted">Продукт</td>
                            <td>{{ $order->product->name }}</td>
                        </tr>
                        <tr>
                            <td class="text-muted">Название сервера</td>
                            <td>{{ $order->server_name }}</td>
                        </tr>
                        <tr>
                            <td class="text-muted">Дата заказа</td>
                            <td>{{ $order->created_at->format('d.m.Y H:i') }}</td>
                        </tr>
                        <tr>
                            <td class="text-muted">Оплачен</td>
                            <td>{{ $order->paid_at?->format('d.m.Y H:i') ?? 'Нет' }}</td>
                        </tr>
                    </table>
                </div>

                <div class="col-md-6">
                    <h6>Характеристики</h6>
                    <table class="table table-sm">
                        <tr>
                            <td class="text-muted">CPU</td>
                            <td>{{ $order->cpu }}%</td>
                        </tr>
                        <tr>
                            <td class="text-muted">RAM</td>
                            <td>{{ $order->memory }} MB</td>
                        </tr>
                        <tr>
                            <td class="text-muted">Disk</td>
                            <td>{{ $order->disk }} MB</td>
                        </tr>
                        <tr>
                            <td class="text-muted">Биллинг</td>
                            <td>{{ $order->product->getBillingCycleName() }}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <hr>

            <div class="row">
                <div class="col-md-6">
                    <h6>Финансы</h6>
                    <table class="table table-sm">
                        <tr>
                            <td class="text-muted">Подытог:</td>
                            <td>{{ number_format($order->product->getCycledPrice(), 2) }} ₽</td>
                        </tr>
                        @if($order->discount > 0)
                        <tr class="text-success">
                            <td class="text-muted">Скидка:</td>
                            <td>-{{ number_format($order->discount, 2) }} ₽</td>
                        </tr>
                        @endif
                        <tr class="fw-bold">
                            <td>Итого:</td>
                            <td>{{ number_format($order->total, 2) }} ₽</td>
                        </tr>
                    </table>
                </div>
            </div>

            @if($order->server)
            <hr>
            <div class="alert alert-success">
                <h6><i class="bi bi-check-circle"></i> Сервер создан</h6>
                <p class="mb-2">Ваш сервер успешно создан и готов к использованию.</p>
                <a href="{{ route('servers.show', $order->server) }}" class="btn btn-success btn-sm">
                    <i class="bi bi-gear"></i> Перейти к серверу
                </a>
            </div>
            @endif
        </div>
    </div>
</div>
@endsection
