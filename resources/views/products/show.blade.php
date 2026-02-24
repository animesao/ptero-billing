@extends('layouts.app')

@section('title', $product->name . ' - ' . config('app.name'))

@section('content')
<div class="container py-5">
    <div class="row">
        <div class="col-lg-8">
            <nav aria-label="breadcrumb" class="mb-4">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="{{ route('home') }}">Главная</a></li>
                    <li class="breadcrumb-item"><a href="{{ route('products.index') }}">Продукты</a></li>
                    <li class="breadcrumb-item active">{{ $product->name }}</li>
                </ol>
            </nav>

            <div class="card">
                <div class="card-body">
                    <h1 class="mb-3">{{ $product->name }}</h1>
                    <p class="text-muted lead">{{ $product->description }}</p>

                    <hr>

                    <h4>Характеристики</h4>
                    <div class="row g-3 mt-2">
                        <div class="col-md-4">
                            <div class="card bg-light">
                                <div class="card-body text-center">
                                    <i class="bi bi-cpu text-primary" style="font-size: 2rem;"></i>
                                    <h5 class="mt-2 mb-0">{{ $product->cpu }}%</h5>
                                    <small class="text-muted">CPU</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card bg-light">
                                <div class="card-body text-center">
                                    <i class="bi bi-memory text-primary" style="font-size: 2rem;"></i>
                                    <h5 class="mt-2 mb-0">{{ $product->memory }} MB</h5>
                                    <small class="text-muted">RAM</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card bg-light">
                                <div class="card-body text-center">
                                    <i class="bi bi-hdd text-primary" style="font-size: 2rem;"></i>
                                    <h5 class="mt-2 mb-0">{{ $product->disk }} MB</h5>
                                    <small class="text-muted">Disk</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card bg-light">
                                <div class="card-body text-center">
                                    <i class="bi bi-database text-primary" style="font-size: 2rem;"></i>
                                    <h5 class="mt-2 mb-0">{{ $product->databases }}</h5>
                                    <small class="text-muted">Databases</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card bg-light">
                                <div class="card-body text-center">
                                    <i class="bi bi-backup text-primary" style="font-size: 2rem;"></i>
                                    <h5 class="mt-2 mb-0">{{ $product->backups }}</h5>
                                    <small class="text-muted">Backups</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card bg-light">
                                <div class="card-body text-center">
                                    <i class="bi bi-hdd-network text-primary" style="font-size: 2rem;"></i>
                                    <h5 class="mt-2 mb-0">{{ $product->allocations }}</h5>
                                    <small class="text-muted">Ports</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-4">
            <div class="card sticky-top" style="top: 20px;">
                <div class="card-body">
                    <h3 class="text-primary text-center mb-3">
                        {{ number_format($product->getCycledPrice(), 2) }} ₽
                    </h3>
                    <p class="text-muted text-center mb-4">/{{ $product->getBillingCycleName() }}</p>

                    <form action="{{ route('orders.create', $product) }}" method="GET">
                        <button type="submit" class="btn btn-primary btn-lg w-100 mb-3">
                            <i class="bi bi-cart-plus"></i> Заказать сейчас
                        </button>
                    </form>

                    <hr>

                    <ul class="list-unstyled mb-0">
                        <li class="mb-2"><i class="bi bi-check-circle text-success"></i> Мгновенная активация</li>
                        <li class="mb-2"><i class="bi bi-check-circle text-success"></i> DDoS защита</li>
                        <li class="mb-2"><i class="bi bi-check-circle text-success"></i> Поддержка 24/7</li>
                        <li class="mb-2"><i class="bi bi-check-circle text-success"></i> 99.9% Uptime</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
