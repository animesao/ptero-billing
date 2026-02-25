<?php

namespace App\Filament\Resources;

use App\Filament\Resources\InvoiceResource\Pages;
use App\Models\Invoice;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class InvoiceResource extends Resource
{
    protected static ?string $model = Invoice::class;

    protected static ?string $navigationIcon = 'heroicon-o-document-text';

    protected static ?string $navigationGroup = 'Финансы';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Основная информация')
                    ->schema([
                        Forms\Components\TextInput::make('invoice_number')
                            ->required()
                            ->unique(ignoreRecord: true),
                        Forms\Components\Select::make('user_id')
                            ->relationship('user', 'name')
                            ->required()
                            ->searchable(),
                        Forms\Components\Select::make('server_id')
                            ->relationship('server', 'name')
                            ->searchable(),
                        Forms\Components\Select::make('status')
                            ->options([
                                'unpaid' => 'Не оплачен',
                                'paid' => 'Оплачен',
                                'cancelled' => 'Отменён',
                                'overdue' => 'Просрочен',
                            ])
                            ->default('unpaid')
                            ->required(),
                    ])->columns(2),

                Forms\Components\Section::make('Детали')
                    ->schema([
                        Forms\Components\TextInput::make('subtotal')
                            ->required()
                            ->numeric()
                            ->prefix('₽'),
                        Forms\Components\TextInput::make('tax')
                            ->numeric()
                            ->prefix('₽')
                            ->default(0),
                        Forms\Components\TextInput::make('discount')
                            ->numeric()
                            ->prefix('₽')
                            ->default(0),
                        Forms\Components\TextInput::make('total')
                            ->required()
                            ->numeric()
                            ->prefix('₽'),
                    ])->columns(2),

                Forms\Components\Section::make('Биллинг')
                    ->schema([
                        Forms\Components\Select::make('billing_cycle')
                            ->options([
                                'monthly' => 'Ежемесячно',
                                'quarterly' => 'Ежеквартально',
                                'yearly' => 'Ежегодно',
                                'onetime' => 'Одноразово',
                            ])
                            ->required(),
                        Forms\Components\DatePicker::make('due_date')
                            ->required(),
                        Forms\Components\DateTimePicker::make('paid_at'),
                    ])->columns(2),

                Forms\Components\Section::make('Дополнительно')
                    ->schema([
                        Forms\Components\Textarea::make('notes')
                            ->rows(3),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->sortable(),
                Tables\Columns\TextColumn::make('invoice_number')
                    ->searchable(),
                Tables\Columns\TextColumn::make('user.name')
                    ->searchable(),
                Tables\Columns\TextColumn::make('server.name')
                    ->searchable(),
                Tables\Columns\BadgeColumn::make('status')
                    ->colors([
                        'warning' => 'unpaid',
                        'success' => 'paid',
                        'secondary' => 'cancelled',
                        'danger' => 'overdue',
                    ]),
                Tables\Columns\TextColumn::make('total')
                    ->money('RUB')
                    ->sortable(),
                Tables\Columns\TextColumn::make('due_date')
                    ->date()
                    ->sortable(),
                Tables\Columns\TextColumn::make('paid_at')
                    ->dateTime()
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status'),
                Tables\Filters\SelectFilter::make('billing_cycle'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\ViewAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListInvoices::route('/'),
            'create' => Pages\CreateInvoice::route('/create'),
            'edit' => Pages\EditInvoice::route('/{record}/edit'),
            'view' => Pages\ViewInvoice::route('/{record}'),
        ];
    }
}
