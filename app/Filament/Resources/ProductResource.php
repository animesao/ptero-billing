<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ProductResource\Pages;
use App\Models\Product;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class ProductResource extends Resource
{
    protected static ?string $model = Product::class;

    protected static ?string $navigationIcon = 'heroicon-o-shopping-bag';

    protected static ?string $navigationGroup = 'Продукты';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Основная информация')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->required()
                            ->maxLength(255),
                        Forms\Components\Textarea::make('description')
                            ->rows(3),
                        Forms\Components\TextInput::make('pterodactyl_egg_id')
                            ->label('ID яйца Pterodactyl')
                            ->required()
                            ->numeric(),
                        Forms\Components\TextInput::make('egg_name')
                            ->label('Название яйца'),
                    ])->columns(2),

                Forms\Components\Section::make('Ценообразование')
                    ->schema([
                        Forms\Components\TextInput::make('price')
                            ->required()
                            ->numeric()
                            ->prefix('₽'),
                        Forms\Components\Select::make('billing_cycle')
                            ->options([
                                'monthly' => 'Ежемесячно',
                                'quarterly' => 'Ежеквартально',
                                'yearly' => 'Ежегодно',
                                'onetime' => 'Одноразово',
                            ])
                            ->default('monthly')
                            ->required(),
                    ])->columns(2),

                Forms\Components\Section::make('Характеристики сервера')
                    ->schema([
                        Forms\Components\TextInput::make('cpu')
                            ->required()
                            ->numeric()
                            ->suffix('%')
                            ->default(100),
                        Forms\Components\TextInput::make('memory')
                            ->required()
                            ->numeric()
                            ->suffix('MB')
                            ->default(512),
                        Forms\Components\TextInput::make('disk')
                            ->required()
                            ->numeric()
                            ->suffix('MB')
                            ->default(1024),
                        Forms\Components\TextInput::make('io')
                            ->numeric()
                            ->default(500),
                        Forms\Components\TextInput::make('databases')
                            ->numeric()
                            ->default(1),
                        Forms\Components\TextInput::make('allocations')
                            ->label('Порты')
                            ->numeric()
                            ->default(1),
                        Forms\Components\TextInput::make('backups')
                            ->numeric()
                            ->default(0),
                    ])->columns(3),

                Forms\Components\Section::make('Настройки')
                    ->schema([
                        Forms\Components\TagsInput::make('nodes')
                            ->label('Доступные ноды (ID)')
                            ->placeholder('Добавить ID ноды'),
                        Forms\Components\Toggle::make('is_active')
                            ->label('Активен')
                            ->default(true),
                        Forms\Components\TextInput::make('sort_order')
                            ->numeric()
                            ->default(0),
                    ])->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->sortable(),
                Tables\Columns\TextColumn::make('name')
                    ->searchable(),
                Tables\Columns\TextColumn::make('price')
                    ->money('RUB')
                    ->sortable(),
                Tables\Columns\BadgeColumn::make('billing_cycle')
                    ->formatStateUsing(fn ($state) => match ($state) {
                        'monthly' => 'Ежемесячно',
                        'quarterly' => 'Ежеквартально',
                        'yearly' => 'Ежегодно',
                        'onetime' => 'Одноразово',
                        default => $state,
                    }),
                Tables\Columns\TextColumn::make('memory')
                    ->formatStateUsing(fn ($state) => "{$state} MB")
                    ->sortable(),
                Tables\Columns\TextColumn::make('cpu')
                    ->formatStateUsing(fn ($state) => "{$state}%")
                    ->sortable(),
                Tables\Columns\IconColumn::make('is_active')
                    ->boolean()
                    ->label('Активен'),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('billing_cycle'),
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
            'index' => Pages\ListProducts::route('/'),
            'create' => Pages\CreateProduct::route('/create'),
            'edit' => Pages\EditProduct::route('/{record}/edit'),
        ];
    }
}
