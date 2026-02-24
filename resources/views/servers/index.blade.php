@extends('layouts.app')

@section('title', 'Серверы - ' . config('app.name'))

@section('content')
<div class="container py-5">
    <h1 class="mb-4">Мои серверы</h1>

    @if($servers->count() > 0)
    <div class="row g-4">
        @foreach($servers as $server)
        <div class="col-md-6">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h5 class="mb-1">{{ $server->name }}</h5>
                            <small class="text-muted">{{ $server->product->name }}</small>
                        </div>
                        <span class="status-badge status-{{ $server->status }}">
                            {{ $server->status }}
                        </span>
                    </div>

                    <div class="row g-2 mb-3">
                        <div class="col-4">
                            <small class="text-muted d-block">CPU</small>
                            <strong>{{ $server->cpu }}%</strong>
                        </div>
                        <div class="col-4">
                            <small class="text-muted d-block">RAM</small>
                            <strong>{{ $server->memory }} MB</strong>
                        </div>
                        <div class="col-4">
                            <small class="text-muted d-block">Disk</small>
                            <strong>{{ $server->disk }} MB</strong>
                        </div>
                    </div>

                    @if($server->ip_address && $server->port)
                    <div class="alert alert-light mb-3">
                        <small class="text-muted d-block">Адрес сервера</small>
                        <code>{{ $server->address }}</code>
                    </div>
                    @endif

                    <div class="d-flex gap-2">
                        <a href="{{ route('servers.show', $server) }}" class="btn btn-primary flex-fill">
                            <i class="bi bi-gear"></i> Управление
                        </a>
                        @if($server->isActive())
                        <form action="{{ route('servers.renew', $server) }}" method="POST" class="flex-fill">
                            @csrf
                            <button type="submit" class="btn btn-success w-100">
                                <i class="bi bi-arrow-repeat"></i> Продлить
                            </button>
                        </form>
                        @endif
                    </div>
                </div>
            </div>
        </div>
        @endforeach
    </div>

    <div class="mt-4">
        {{ $servers->links() }}
    </div>
    @else
    <div class="card">
        <div class="card-body text-center py-5">
            <i class="bi bi-hdd-stack text-muted" style="font-size: 4rem;"></i>
            <h5 class="mt-3">У вас пока нет серверов</h5>
            <p class="text-muted mb-4">Закажите первый сервер чтобы начать</p>
            <a href="{{ route('products.index') }}" class="btn btn-primary">
                <i class="bi bi-cart-plus"></i> Выбрать сервер
            </a>
        </div>
    </div>
    @endif
</div>
@endsection
