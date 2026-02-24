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
        Schema::create('servers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->unsignedBigInteger('pterodactyl_id')->nullable();
            $table->string('identifier')->nullable(); // short identifier from Pterodactyl
            $table->unsignedBigInteger('node_id')->nullable();
            $table->string('status')->default('pending'); // pending, active, suspended, terminated
            $table->integer('cpu');
            $table->integer('memory');
            $table->integer('disk');
            $table->integer('io')->default(500);
            $table->integer('databases')->default(1);
            $table->integer('allocations')->default(1);
            $table->integer('backups')->default(0);
            $table->string('ip_address')->nullable();
            $table->integer('port')->nullable();
            $table->timestamp('next_billing_date')->nullable();
            $table->timestamp('suspended_at')->nullable();
            $table->timestamp('terminated_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('user_id');
            $table->index('pterodactyl_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('servers');
    }
};
