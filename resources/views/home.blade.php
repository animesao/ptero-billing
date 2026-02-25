@extends('layouts.app')

@section('title', 'Главная - ' . config('app.name'))

@section('content')
<!-- Hero Section -->
<section class="hero-section">
    <div class="container">
        <div class="row align-items-center">
            <div class="col-lg-6">
                <h1 class="display-4 fw-bold mb-4">Игровые серверы нового поколения</h1>
                <p class="lead mb-4">Разместите свой игровой сервер на нашей платформе за считанные минуты. Мощное оборудование, низкие цены и поддержка 24/7.</p>
                <a href="{{ route('products.index') }}" class="btn btn-light btn-lg me-2">
                    <i class="bi bi-cart"></i> Выбрать сервер
                </a>
                <a href="{{ route('register') }}" class="btn btn-outline-light btn-lg">
                    <i class="bi bi-person-plus"></i> Регистрация
                </a>
            </div>
            <div class="col-lg-6 text-center d-none d-lg-block">
                <i class="bi bi-hdd-stack" style="font-size: 15rem; opacity: 0.3;"></i>
            </div>
        </div>
    </div>
</section>

<!-- Features -->
<section class="py-5">
    <div class="container">
        <h2 class="text-center mb-5">Почему выбирают нас</h2>
        <div class="row g-4">
            <div class="col-md-4">
                <div class="card h-100 text-center p-4">
                    <div class="card-body">
                        <i class="bi bi-lightning-charge text-primary" style="font-size: 3rem;"></i>
                        <h5 class="mt-3">Мгновенная активация</h5>
                        <p class="text-muted">Сервер активируется автоматически сразу после оплаты</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card h-100 text-center p-4">
                    <div class="card-body">
                        <i class="bi bi-shield-check text-primary" style="font-size: 3rem;"></i>
                        <h5 class="mt-3">DDoS защита</h5>
                        <p class="text-muted">Все серверы защищены от DDoS атак</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card h-100 text-center p-4">
                    <div class="card-body">
                        <i class="bi bi-headset text-primary" style="font-size: 3rem;"></i>
                        <h5 class="mt-3">Поддержка 24/7</h5>
                        <p class="text-muted">Наша команда всегда готова помочь вам</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Products Preview -->
<section class="py-5 bg-light">
    <div class="container">
        <h2 class="text-center mb-5">Популярные продукты</h2>
        <div class="row g-4">
            @foreach($products->take(3) as $product)
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">{{ $product->name }}</h5>
                        <p class="card-text text-muted">{{ Str::limit($product->description, 100) }}</p>
                        <div class="mb-3">
                            <span class="badge bg-primary">{{ $product->memory }} MB RAM</span>
                            <span class="badge bg-secondary">{{ $product->cpu }}% CPU</span>
                            <span class="badge bg-info">{{ $product->disk }} MB Disk</span>
                        </div>
                        <h4 class="text-primary">{{ number_format($product->getCycledPrice(), 2) }} ₽</h4>
                        <p class="text-muted small">/{{ $product->getBillingCycleName() }}</p>
                        <a href="{{ route('products.show', $product) }}" class="btn btn-primary w-100">
                            Подробнее
                        </a>
                    </div>
                </div>
            </div>
            @endforeach
        </div>
        <div class="text-center mt-4">
            <a href="{{ route('products.index') }}" class="btn btn-outline-primary btn-lg">
                Смотреть все продукты <i class="bi bi-arrow-right"></i>
            </a>
        </div>
    </div>
</section>
@endsection
