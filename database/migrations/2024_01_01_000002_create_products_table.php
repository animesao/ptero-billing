<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('pterodactyl_egg_id');
            $table->string('egg_name')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('billing_cycle'); // monthly, quarterly, yearly, onetime
            $table->integer('cpu')->default(100); // в процентах
            $table->integer('memory')->default(512); // в MB
            $table->integer('disk')->default(1024); // в MB
            $table->integer('io')->default(500); // IO priority
            $table->integer('databases')->default(1);
            $table->integer('allocations')->default(1);
            $table->integer('backups')->default(0);
            $table->json('nodes')->nullable(); // доступные ноды [1, 2, 3]
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('is_active');
            $table->index('billing_cycle');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
