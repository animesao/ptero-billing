@extends('layouts.app')

@section('title', 'Дашборд - ' . config('app.name'))

@section('content')
<div class="container py-5">
    <h1 class="mb-4">Дашборд</h1>

    <!-- Stats -->
    <div class="row g-4 mb-4">
        <div class="col-md-3">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-hdd-stack text-primary" style="font-size: 2.5rem;"></i>
                        <div class="ms-3">
                            <h6 class="text-muted mb-0">Серверы</h6>
                            <h3 class="mb-0">{{ Auth::user()->servers->count() }}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-cart3 text-success" style="font-size: 2.5rem;"></i>
                        <div class="ms-3">
                            <h6 class="text-muted mb-0">Заказы</h6>
                            <h3 class="mb-0">{{ Auth::user()->orders->count() }}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-receipt text-warning" style="font-size: 2.5rem;"></i>
                        <div class="ms-3">
                            <h6 class="text-muted mb-0">Инвойсы</h6>
                            <h3 class="mb-0">{{ Auth::user()->invoices->count() }}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-wallet2 text-info" style="font-size: 2.5rem;"></i>
                        <div class="ms-3">
                            <h6 class="text-muted mb-0">Баланс</h6>
                            <h3 class="mb-0">{{ number_format(Auth::user()->balance, 2) }} ₽</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="row g-4">
        <!-- Recent Servers -->
        <div class="col-md-6">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Мои серверы</h5>
                    <a href="{{ route('servers.index') }}" class="btn btn-sm btn-primary">Все</a>
                </div>
                <div class="card-body">
                    @if($servers->count() > 0)
                    <div class="list-group list-group-flush">
                        @foreach($servers as $server)
                        <a href="{{ route('servers.show', $server) }}" class="list-group-item list-group-item-action">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-0">{{ $server->name }}</h6>
                                    <small class="text-muted">{{ $server->product->name }}</small>
                                </div>
                                <span class="status-badge status-{{ $server->status }}">
                                    {{ $server->status }}
                                </span>
                            </div>
                        </a>
                        @endforeach
                    </div>
                    @else
                    <p class="text-muted text-center mb-0">У вас пока нет серверов</p>
                    @endif
                </div>
            </div>
        </div>

        <!-- Recent Invoices -->
        <div class="col-md-6">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Инвойсы</h5>
                    <a href="{{ route('invoices.index') }}" class="btn btn-sm btn-primary">Все</a>
                </div>
                <div class="card-body">
                    @if($invoices->count() > 0)
                    <div class="list-group list-group-flush">
                        @foreach($invoices as $invoice)
                        <a href="{{ route('invoices.show', $invoice) }}" class="list-group-item list-group-item-action">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-0">{{ $invoice->invoice_number }}</h6>
                                    <small class="text-muted">До: {{ $invoice->due_date->format('d.m.Y') }}</small>
                                </div>
                                <div class="text-end">
                                    <span class="badge bg-{{ $invoice->status === 'paid' ? 'success' : ($invoice->status === 'overdue' ? 'danger' : 'warning') }}">
                                        {{ $invoice->status }}
                                    </span>
                                    <div class="small">{{ number_format($invoice->total, 2) }} ₽</div>
                                </div>
                            </div>
                        </a>
                        @endforeach
                    </div>
                    @else
                    <p class="text-muted text-center mb-0">Нет инвойсов</p>
                    @endif
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
