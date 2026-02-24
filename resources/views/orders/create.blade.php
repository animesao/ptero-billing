@extends('layouts.app')

@section('title', 'Оформление заказа - ' . config('app.name'))

@section('content')
<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-lg-6">
            <nav aria-label="breadcrumb" class="mb-4">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="{{ route('products.index') }}">Продукты</a></li>
                    <li class="breadcrumb-item"><a href="{{ route('products.show', $product) }}">{{ $product->name }}</a></li>
                    <li class="breadcrumb-item active">Оформление</li>
                </ol>
            </nav>

            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Оформление заказа</h5>
                </div>
                <div class="card-body">
                    <form method="POST" action="{{ route('orders.store', $product) }}">
                        @csrf

                        <!-- Продукт -->
                        <div class="mb-4">
                            <h6>{{ $product->name }}</h6>
                            <p class="text-muted small mb-0">{{ $product->description }}</p>
                        </div>

                        <!-- Характеристики -->
                        <div class="card bg-light mb-4">
                            <div class="card-body">
                                <div class="row g-2">
                                    <div class="col-4 text-center">
                                        <small class="text-muted d-block">CPU</small>
                                        <strong>{{ $product->cpu }}%</strong>
                                    </div>
                                    <div class="col-4 text-center">
                                        <small class="text-muted d-block">RAM</small>
                                        <strong>{{ $product->memory }} MB</strong>
                                    </div>
                                    <div class="col-4 text-center">
                                        <small class="text-muted d-block">Disk</small>
                                        <strong>{{ $product->disk }} MB</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Название сервера -->
                        <div class="mb-3">
                            <label for="server_name" class="form-label">Название сервера</label>
                            <input type="text" class="form-control @error('server_name') is-invalid @enderror"
                                   id="server_name" name="server_name" value="{{ old('server_name', $product->name) }}" required>
                            @error('server_name')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>

                        <!-- Купон -->
                        <div class="mb-4">
                            <label for="coupon_code" class="form-label">Код купона (необязательно)</label>
                            <input type="text" class="form-control @error('coupon_code') is-invalid @enderror"
                                   id="coupon_code" name="coupon_code" value="{{ old('coupon_code') }}" placeholder="Введите код купона">
                            @error('coupon_code')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>

                        <!-- Итого -->
                        <div class="card bg-light mb-4">
                            <div class="card-body">
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Базовая цена:</span>
                                    <strong>{{ number_format($product->getCycledPrice(), 2) }} ₽</strong>
                                </div>
                                <div class="d-flex justify-content-between text-success">
                                    <span>Скидка:</span>
                                    <strong>-0.00 ₽</span>
                                </div>
                                <hr>
                                <div class="d-flex justify-content-between">
                                    <strong>Итого:</strong>
                                    <strong class="text-primary">{{ number_format($product->getCycledPrice(), 2) }} ₽</strong>
                                </div>
                                <small class="text-muted d-block mt-2">
                                    Биллинг: {{ $product->getBillingCycleName() }}
                                </small>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary btn-lg w-100">
                            <i class="bi bi-cart-check"></i> Создать заказ
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
