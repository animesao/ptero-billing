@extends('layouts.app')

@section('title', 'Инвойс #' . $invoice->invoice_number . ' - ' . config('app.name'))

@section('content')
<div class="container py-5">
    <nav aria-label="breadcrumb" class="mb-4">
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="{{ route('dashboard') }}">Дашборд</a></li>
            <li class="breadcrumb-item"><a href="{{ route('invoices.index') }}">Инвойсы</a></li>
            <li class="breadcrumb-item active">{{ $invoice->invoice_number }}</li>
        </ol>
    </nav>

    <div class="row">
        <div class="col-lg-8">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Инвойс #{{ $invoice->invoice_number }}</h5>
                    <span class="badge bg-{{ $invoice->status === 'paid' ? 'success' : ($invoice->status === 'overdue' ? 'danger' : 'warning') }}">
                        {{ $invoice->status }}
                    </span>
                </div>
                <div class="card-body">
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <h6>Счёт выставлен:</h6>
                            <p class="mb-0">
                                <strong>{{ Auth::user()->name }}</strong><br>
                                {{ Auth::user()->email }}
                            </p>
                        </div>
                        <div class="col-md-6 text-md-end">
                            <h6>Дата выставления:</h6>
                            <p class="mb-0">{{ $invoice->created_at->format('d.m.Y') }}</p>
                            <h6>Дата оплаты:</h6>
                            <p class="mb-0">{{ $invoice->due_date->format('d.m.Y') }}</p>
                        </div>
                    </div>

                    @if($invoice->server)
                    <div class="alert alert-light mb-4">
                        <strong>Сервер:</strong> {{ $invoice->server->name }}<br>
                        <small class="text-muted">{{ $invoice->server->product->name }}</small>
                    </div>
                    @endif

                    <table class="table mb-4">
                        <thead>
                            <tr>
                                <th>Описание</th>
                                <th class="text-end">Сумма</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    Продление сервера<br>
                                    <small class="text-muted">Биллинг: {{ $invoice->billing_cycle }}</small>
                                </td>
                                <td class="text-end">{{ number_format($invoice->subtotal, 2) }} ₽</td>
                            </tr>
                            @if($invoice->tax > 0)
                            <tr>
                                <td>Налог</td>
                                <td class="text-end">{{ number_format($invoice->tax, 2) }} ₽</td>
                            </tr>
                            @endif
                            @if($invoice->discount > 0)
                            <tr class="text-success">
                                <td>Скидка</td>
                                <td class="text-end">-{{ number_format($invoice->discount, 2) }} ₽</td>
                            </tr>
                            @endif
                        </tbody>
                        <tfoot>
                            <tr class="fw-bold">
                                <td>Итого</td>
                                <td class="text-end">{{ number_format($invoice->total, 2) }} ₽</td>
                            </tr>
                        </tfoot>
                    </table>

                    @if($invoice->payments->count() > 0)
                    <h6>Платежи</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Дата</th>
                                    <th>Шлюз</th>
                                    <th>Сумма</th>
                                    <th>Статус</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($invoice->payments as $payment)
                                <tr>
                                    <td>{{ $payment->created_at->format('d.m.Y H:i') }}</td>
                                    <td>{{ ucfirst($payment->gateway) }}</td>
                                    <td>{{ number_format($payment->amount, 2) }} {{ $payment->currency }}</td>
                                    <td>
                                        <span class="badge bg-{{ $payment->status === 'completed' ? 'success' : 'warning' }}">
                                            {{ $payment->status }}
                                        </span>
                                    </td>
                                </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                    @endif
                </div>
            </div>
        </div>

        <div class="col-lg-4">
            @if($invoice->isUnpaid())
            <div class="card mb-4">
                <div class="card-body">
                    <h6 class="card-title mb-3">Оплата инвойса</h6>

                    <form action="{{ route('invoices.pay', $invoice) }}" method="POST" class="mb-3">
                        @csrf
                        <input type="hidden" name="gateway" value="stripe">
                        <button type="submit" class="btn btn-primary w-100 mb-2">
                            <i class="bi bi-credit-card"></i> Оплатить картой (Stripe)
                        </button>
                    </form>

                    <form action="{{ route('invoices.pay', $invoice) }}" method="POST" class="mb-3">
                        @csrf
                        <input type="hidden" name="gateway" value="paypal">
                        <button type="submit" class="btn btn-warning w-100 mb-2">
                            <i class="bi bi-paypal"></i> Оплатить через PayPal
                        </button>
                    </form>

                    <form action="{{ route('invoices.pay', $invoice) }}" method="POST">
                        @csrf
                        <input type="hidden" name="gateway" value="balance">
                        <button type="submit" class="btn btn-success w-100"
                                {{ Auth::user()->balance < $invoice->total ? 'disabled' : '' }}>
                            <i class="bi bi-wallet2"></i> Оплатить с баланса
                            <small class="d-block">({{ number_format(Auth::user()->balance, 2) }} ₽)</small>
                        </button>
                    </form>
                </div>
            </div>
            @endif

            <div class="card">
                <div class="card-body">
                    <h6 class="card-title">Информация</h6>
                    <ul class="list-unstyled mb-0">
                        <li class="mb-2">
                            <small class="text-muted">Статус:</small><br>
                            <strong>{{ $invoice->status }}</strong>
                        </li>
                        <li class="mb-2">
                            <small class="text-muted">Создан:</small><br>
                            <strong>{{ $invoice->created_at->format('d.m.Y H:i') }}</strong>
                        </li>
                        @if($invoice->paid_at)
                        <li class="mb-2">
                            <small class="text-muted">Оплачен:</small><br>
                            <strong>{{ $invoice->paid_at->format('d.m.Y H:i') }}</strong>
                        </li>
                        @endif
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
