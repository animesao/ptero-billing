<?php

namespace App\Filament\Resources;

use App\Filament\Resources\OrderResource\Pages;
use App\Models\Order;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class OrderResource extends Resource
{
    protected static ?string $model = Order::class;

    protected static ?string $navigationIcon = 'heroicon-o-shopping-cart';

    protected static ?string $navigationGroup = 'Заказы';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Информация о заказе')
                    ->schema([
                        Forms\Components\Select::make('user_id')
                            ->relationship('user', 'name')
                            ->required()
                            ->searchable(),
                        Forms\Components\Select::make('product_id')
                            ->relationship('product', 'name')
                            ->required()
                            ->searchable(),
                        Forms\Components\Select::make('status')
                            ->options([
                                'pending' => 'Ожидает',
                                'paid' => 'Оплачен',
                                'cancelled' => 'Отменён',
                                'failed' => 'Ошибка',
                                'completed' => 'Завершён',
                            ])
                            ->default('pending')
                            ->required(),
                        Forms\Components\DateTimePicker::make('paid_at'),
                    ])->columns(2),

                Forms\Components\Section::make('Детали сервера')
                    ->schema([
                        Forms\Components\TextInput::make('server_name')
                            ->maxLength(255),
                        Forms\Components\TextInput::make('cpu')
                            ->numeric(),
                        Forms\Components\TextInput::make('memory')
                            ->numeric()
                            ->suffix('MB'),
                        Forms\Components\TextInput::make('disk')
                            ->numeric()
                            ->suffix('MB'),
                        Forms\Components\TextInput::make('pterodactyl_server_id')
                            ->label('ID сервера Pterodactyl')
                            ->numeric(),
                        Forms\Components\TextInput::make('pterodactyl_node_id')
                            ->label('ID ноды Pterodactyl')
                            ->numeric(),
                    ])->columns(2),

                Forms\Components\Section::make('Финансы')
                    ->schema([
                        Forms\Components\TextInput::make('total')
                            ->required()
                            ->numeric()
                            ->prefix('₽'),
                        Forms\Components\TextInput::make('discount')
                            ->numeric()
                            ->prefix('₽')
                            ->default(0),
                        Forms\Components\Select::make('coupon_id')
                            ->relationship('coupon', 'code')
                            ->searchable(),
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
                Tables\Columns\TextColumn::make('user.name')
                    ->searchable(),
                Tables\Columns\TextColumn::make('product.name')
                    ->searchable(),
                Tables\Columns\BadgeColumn::make('status')
                    ->colors([
                        'warning' => 'pending',
                        'success' => 'paid',
                        'secondary' => 'cancelled',
                        'danger' => 'failed',
                        'primary' => 'completed',
                    ]),
                Tables\Columns\TextColumn::make('total')
                    ->money('RUB')
                    ->sortable(),
                Tables\Columns\TextColumn::make('paid_at')
                    ->dateTime()
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status'),
                Tables\Filters\SelectFilter::make('product'),
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
            'index' => Pages\ListOrders::route('/'),
            'create' => Pages\CreateOrder::route('/create'),
            'edit' => Pages\EditOrder::route('/{record}/edit'),
            'view' => Pages\ViewOrder::route('/{record}'),
        ];
    }
}
