<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ServerResource\Pages;
use App\Models\Server;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class ServerResource extends Resource
{
    protected static ?string $model = Server::class;

    protected static ?string $navigationIcon = 'heroicon-o-server';

    protected static ?string $navigationGroup = 'Серверы';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Основная информация')
                    ->schema([
                        Forms\Components\Select::make('user_id')
                            ->relationship('user', 'name')
                            ->required()
                            ->searchable(),
                        Forms\Components\Select::make('order_id')
                            ->relationship('order', 'id')
                            ->searchable(),
                        Forms\Components\Select::make('product_id')
                            ->relationship('product', 'name')
                            ->required()
                            ->searchable(),
                        Forms\Components\TextInput::make('name')
                            ->required()
                            ->maxLength(255),
                    ])->columns(2),

                Forms\Components\Section::make('Pterodactyl')
                    ->schema([
                        Forms\Components\TextInput::make('pterodactyl_id')
                            ->label('ID сервера')
                            ->numeric(),
                        Forms\Components\TextInput::make('identifier')
                            ->label('Идентификатор'),
                        Forms\Components\TextInput::make('node_id')
                            ->label('ID ноды')
                            ->numeric(),
                        Forms\Components\TextInput::make('ip_address')
                            ->label('IP адрес'),
                        Forms\Components\TextInput::make('port')
                            ->label('Порт')
                            ->numeric(),
                    ])->columns(2),

                Forms\Components\Section::make('Характеристики')
                    ->schema([
                        Forms\Components\TextInput::make('cpu')
                            ->required()
                            ->numeric()
                            ->suffix('%'),
                        Forms\Components\TextInput::make('memory')
                            ->required()
                            ->numeric()
                            ->suffix('MB'),
                        Forms\Components\TextInput::make('disk')
                            ->required()
                            ->numeric()
                            ->suffix('MB'),
                        Forms\Components\TextInput::make('io')
                            ->numeric()
                            ->default(500),
                        Forms\Components\TextInput::make('databases')
                            ->numeric()
                            ->default(1),
                        Forms\Components\TextInput::make('allocations')
                            ->numeric()
                            ->default(1),
                        Forms\Components\TextInput::make('backups')
                            ->numeric()
                            ->default(0),
                    ])->columns(3),

                Forms\Components\Section::make('Статус')
                    ->schema([
                        Forms\Components\Select::make('status')
                            ->options([
                                'pending' => 'Ожидает',
                                'active' => 'Активен',
                                'suspended' => 'Приостановлен',
                                'terminated' => 'Удалён',
                            ])
                            ->default('pending')
                            ->required(),
                        Forms\Components\DateTimePicker::make('next_billing_date'),
                        Forms\Components\DateTimePicker::make('suspended_at'),
                        Forms\Components\DateTimePicker::make('terminated_at'),
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
                Tables\Columns\TextColumn::make('user.name')
                    ->searchable(),
                Tables\Columns\TextColumn::make('product.name')
                    ->searchable(),
                Tables\Columns\BadgeColumn::make('status')
                    ->colors([
                        'warning' => 'pending',
                        'success' => 'active',
                        'danger' => 'suspended',
                        'secondary' => 'terminated',
                    ]),
                Tables\Columns\TextColumn::make('cpu')
                    ->formatStateUsing(fn ($state) => "{$state}%"),
                Tables\Columns\TextColumn::make('memory')
                    ->formatStateUsing(fn ($state) => "{$state} MB"),
                Tables\Columns\TextColumn::make('next_billing_date')
                    ->date()
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
            'index' => Pages\ListServers::route('/'),
            'create' => Pages\CreateServer::route('/create'),
            'edit' => Pages\EditServer::route('/{record}/edit'),
            'view' => Pages\ViewServer::route('/{record}'),
        ];
    }
}
