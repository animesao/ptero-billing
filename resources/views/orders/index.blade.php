@extends('layouts.app')

@section('title', 'Заказы - ' . config('app.name'))

@section('content')
<div class="container py-5">
    <h1 class="mb-4">Мои заказы</h1>

    @if($orders->count() > 0)
    <div class="card">
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>№</th>
                            <th>Продукт</th>
                            <th>Сумма</th>
                            <th>Статус</th>
                            <th>Дата</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($orders as $order)
                        <tr>
                            <td>#{{ $order->id }}</td>
                            <td>{{ $order->product->name }}</td>
                            <td>{{ number_format($order->total, 2) }} ₽</td>
                            <td>
                                <span class="badge bg-{{ $order->status === 'completed' ? 'success' : ($order->status === 'pending' ? 'warning' : 'secondary') }}">
                                    {{ $order->status }}
                                </span>
                            </td>
                            <td>{{ $order->created_at->format('d.m.Y') }}</td>
                            <td>
                                <a href="{{ route('orders.show', $order) }}" class="btn btn-sm btn-primary">
                                    <i class="bi bi-eye"></i>
                                </a>
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="mt-4">
        {{ $orders->links() }}
    </div>
    @else
    <div class="card">
        <div class="card-body text-center py-5">
            <i class="bi bi-cart3 text-muted" style="font-size: 4rem;"></i>
            <h5 class="mt-3">У вас пока нет заказов</h5>
            <p class="text-muted mb-4">Оформите первый заказ чтобы начать</p>
            <a href="{{ route('products.index') }}" class="btn btn-primary">
                <i class="bi bi-cart-plus"></i> Выбрать продукт
            </a>
        </div>
    </div>
    @endif
</div>
@endsection
