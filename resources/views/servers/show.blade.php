@extends('layouts.app')

@section('title', $server->name . ' - ' . config('app.name'))

@section('content')
<div class="container py-5">
    <nav aria-label="breadcrumb" class="mb-4">
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="{{ route('dashboard') }}">Дашборд</a></li>
            <li class="breadcrumb-item"><a href="{{ route('servers.index') }}">Серверы</a></li>
            <li class="breadcrumb-item active">{{ $server->name }}</li>
        </ol>
    </nav>

    <div class="row">
        <div class="col-lg-8">
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">{{ $server->name }}</h5>
                    <span class="status-badge status-{{ $server->status }}">
                        {{ $server->status }}
                    </span>
                </div>
                <div class="card-body">
                    <div class="row g-3 mb-4">
                        <div class="col-md-4">
                            <div class="text-center">
                                <i class="bi bi-cpu text-primary" style="font-size: 2rem;"></i>
                                <div class="mt-2"><strong>{{ $server->cpu }}%</strong></div>
                                <small class="text-muted">CPU</small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-center">
                                <i class="bi bi-memory text-primary" style="font-size: 2rem;"></i>
                                <div class="mt-2"><strong>{{ $server->memory }} MB</strong></div>
                                <small class="text-muted">RAM</small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-center">
                                <i class="bi bi-hdd text-primary" style="font-size: 2rem;"></i>
                                <div class="mt-2"><strong>{{ $server->disk }} MB</strong></div>
                                <small class="text-muted">Disk</small>
                            </div>
                        </div>
                    </div>

                    @if($server->ip_address && $server->port)
                    <div class="alert alert-light">
                        <h6 class="mb-2">Подключение</h6>
                        <p class="mb-1"><strong>Адрес:</strong> <code>{{ $server->address }}</code></p>
                    </div>
                    @endif

                    @if($server->status === 'active')
                    <h6 class="mb-3">Управление питанием</h6>
                    <div class="btn-group w-100 mb-4" role="group">
                        <form action="{{ route('servers.power', $server) }}" method="POST" class="d-inline">
                            @csrf
                            <input type="hidden" name="action" value="start">
                            <button type="submit" class="btn btn-success">
                                <i class="bi bi-play"></i> Старт
                            </button>
                        </form>
                        <form action="{{ route('servers.power', $server) }}" method="POST" class="d-inline">
                            @csrf
                            <input type="hidden" name="action" value="stop">
                            <button type="submit" class="btn btn-danger">
                                <i class="bi bi-stop"></i> Стоп
                            </button>
                        </form>
                        <form action="{{ route('servers.power', $server) }}" method="POST" class="d-inline">
                            @csrf
                            <input type="hidden" name="action" value="restart">
                            <button type="submit" class="btn btn-warning">
                                <i class="bi bi-arrow-repeat"></i> Рестарт
                            </button>
                        </form>
                    </div>
                    @endif

                    <h6 class="mb-3">Информация</h6>
                    <table class="table table-sm">
                        <tr>
                            <td class="text-muted">Продукт</td>
                            <td>{{ $server->product->name }}</td>
                        </tr>
                        <tr>
                            <td class="text-muted">Дата создания</td>
                            <td>{{ $server->created_at->format('d.m.Y H:i') }}</td>
                        </tr>
                        <tr>
                            <td class="text-muted">Следующая оплата</td>
                            <td>{{ $server->next_billing_date?->format('d.m.Y') ?? 'Никогда' }}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- Recent Invoices -->
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Инвойсы</h5>
                </div>
                <div class="card-body">
                    @if($server->invoices->count() > 0)
                    <div class="list-group list-group-flush">
                        @foreach($server->invoices->take(5) as $invoice)
                        <a href="{{ route('invoices.show', $invoice) }}" class="list-group-item list-group-item-action">
                            <div class="d-flex justify-content-between">
                                <span>{{ $invoice->invoice_number }}</span>
                                <span class="badge bg-{{ $invoice->status === 'paid' ? 'success' : 'warning' }}">
                                    {{ $invoice->status }}
                                </span>
                            </div>
                        </a>
                        @endforeach
                    </div>
                    @else
                    <p class="text-muted mb-0">Нет инвойсов</p>
                    @endif
                </div>
            </div>
        </div>

        <div class="col-lg-4">
            <div class="card">
                <div class="card-body">
                    <h6 class="card-title">Действия</h6>
                    @if($server->isActive())
                    <form action="{{ route('servers.renew', $server) }}" method="POST" class="mb-3">
                        @csrf
                        <button type="submit" class="btn btn-success w-100">
                            <i class="bi bi-arrow-repeat"></i> Продлить
                        </button>
                    </form>
                    @endif
                    <a href="{{ route('products.show', $server->product) }}" class="btn btn-outline-primary w-100">
                        <i class="bi bi-box"></i> Информация о продукте
                    </a>
                </div>
            </div>

            @if($server->isSuspended())
            <div class="alert alert-warning mt-3">
                <h6><i class="bi bi-exclamation-triangle"></i> Сервер приостановлен</h6>
                <p class="mb-0 small">Оплатите задолженность для разблокировки</p>
            </div>
            @endif
        </div>
    </div>
</div>
@endsection
