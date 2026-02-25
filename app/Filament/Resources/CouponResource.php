<?php

namespace App\Filament\Resources;

use App\Filament\Resources\CouponResource\Pages;
use App\Models\Coupon;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class CouponResource extends Resource
{
    protected static ?string $model = Coupon::class;

    protected static ?string $navigationIcon = 'heroicon-o-ticket';

    protected static ?string $navigationGroup = 'Маркетинг';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Основная информация')
                    ->schema([
                        Forms\Components\TextInput::make('code')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(50),
                        Forms\Components\Textarea::make('description')
                            ->rows(2),
                        Forms\Components\Toggle::make('is_active')
                            ->default(true),
                    ])->columns(2),

                Forms\Components\Section::make('Параметры скидки')
                    ->schema([
                        Forms\Components\Select::make('type')
                            ->options([
                                'percent' => 'Процент',
                                'fixed' => 'Фиксированная',
                            ])
                            ->default('percent')
                            ->required(),
                        Forms\Components\TextInput::make('value')
                            ->required()
                            ->numeric()
                            ->suffix(fn (Forms\Get $get) => $get('type') === 'percent' ? '%' : '₽'),
                        Forms\Components\TextInput::make('min_order')
                            ->label('Минимальная сумма заказа')
                            ->numeric()
                            ->prefix('₽')
                            ->default(0),
                    ])->columns(2),

                Forms\Components\Section::make('Ограничения')
                    ->schema([
                        Forms\Components\TextInput::make('max_uses')
                            ->label('Максимальное использование (0 = безлимит)')
                            ->numeric()
                            ->default(0),
                        Forms\Components\DateTimePicker::make('expires_at')
                            ->label('Срок действия'),
                    ])->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->sortable(),
                Tables\Columns\TextColumn::make('code')
                    ->searchable(),
                Tables\Columns\TextColumn::make('description')
                    ->limit(30),
                Tables\Columns\BadgeColumn::make('type')
                    ->colors([
                        'primary' => 'percent',
                        'success' => 'fixed',
                    ]),
                Tables\Columns\TextColumn::make('value')
                    ->formatStateUsing(fn ($record) =>
                        $record->type === 'percent' ? "{$record->value}%" : "{$record->value} ₽"
                    ),
                Tables\Columns\TextColumn::make('uses_count')
                    ->label('Использовано')
                    ->sortable(),
                Tables\Columns\IconColumn::make('is_active')
                    ->boolean()
                    ->label('Активен'),
                Tables\Columns\TextColumn::make('expires_at')
                    ->date()
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('type'),
                Tables\Filters\TernaryFilter::make('is_active'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
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
            'index' => Pages\ListCoupons::route('/'),
            'create' => Pages\CreateCoupon::route('/create'),
            'edit' => Pages\EditCoupon::route('/{record}/edit'),
        ];
    }
}
