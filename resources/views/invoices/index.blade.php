@extends('layouts.app')

@section('title', 'Инвойсы - ' . config('app.name'))

@section('content')
<div class="container py-5">
    <h1 class="mb-4">Мои инвойсы</h1>

    @if($invoices->count() > 0)
    <div class="card">
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Номер</th>
                            <th>Сервер</th>
                            <th>Сумма</th>
                            <th>Статус</th>
                            <th>Дата оплаты</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($invoices as $invoice)
                        <tr>
                            <td>{{ $invoice->invoice_number }}</td>
                            <td>{{ $invoice->server?->name ?? '-' }}</td>
                            <td>{{ number_format($invoice->total, 2) }} ₽</td>
                            <td>
                                <span class="badge bg-{{ $invoice->status === 'paid' ? 'success' : ($invoice->status === 'overdue' ? 'danger' : 'warning') }}">
                                    {{ $invoice->status }}
                                </span>
                            </td>
                            <td>{{ $invoice->paid_at?->format('d.m.Y') ?? '-' }}</td>
                            <td>
                                <a href="{{ route('invoices.show', $invoice) }}" class="btn btn-sm btn-primary">
                                    <i class="bi bi-eye"></i>
                                </a>
                                @if($invoice->isUnpaid())
                                <a href="{{ route('invoices.show', $invoice) }}" class="btn btn-sm btn-success">
                                    <i class="bi bi-credit-card"></i> Оплатить
                                </a>
                                @endif
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="mt-4">
        {{ $invoices->links() }}
    </div>
    @else
    <div class="card">
        <div class="card-body text-center py-5">
            <i class="bi bi-receipt text-muted" style="font-size: 4rem;"></i>
            <h5 class="mt-3">Нет инвойсов</h5>
            <p class="text-muted mb-0">У вас пока нет инвойсов</p>
        </div>
    </div>
    @endif
</div>
@endsection
