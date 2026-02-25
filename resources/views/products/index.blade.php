@extends('layouts.app')

@section('title', 'Продукты - ' . config('app.name'))

@section('content')
<div class="container py-5">
    <h1 class="text-center mb-5">Наши продукты</h1>

    <div class="row g-4">
        @forelse($products as $product)
        <div class="col-md-4">
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">{{ $product->name }}</h5>
                    <p class="card-text text-muted">{{ $product->description }}</p>

                    <div class="mb-3">
                        <ul class="list-unstyled">
                            <li><i class="bi bi-cpu text-primary"></i> CPU: {{ $product->cpu }}%</li>
                            <li><i class="bi bi-memory text-primary"></i> RAM: {{ $product->memory }} MB</li>
                            <li><i class="bi bi-hdd text-primary"></i> Disk: {{ $product->disk }} MB</li>
                            <li><i class="bi bi-database text-primary"></i> Databases: {{ $product->databases }}</li>
                            <li><i class="bi bi-backup text-primary"></i> Backups: {{ $product->backups }}</li>
                        </ul>
                    </div>

                    <h4 class="text-primary">{{ number_format($product->getCycledPrice(), 2) }} ₽</h4>
                    <p class="text-muted small">/{{ $product->getBillingCycleName() }}</p>

                    <a href="{{ route('orders.create', $product) }}" class="btn btn-primary w-100">
                        <i class="bi bi-cart-plus"></i> Заказать
                    </a>
                </div>
            </div>
        </div>
        @empty
        <div class="col-12">
            <div class="alert alert-info text-center">
                Продукты временно недоступны
            </div>
        </div>
        @endforelse
    </div>
</div>
@endsection
