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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->string('status')->default('pending'); // pending, paid, cancelled, failed, completed
            $table->decimal('total', 10, 2);
            $table->decimal('discount', 10, 2)->default(0);
            $table->foreignId('coupon_id')->nullable()->constrained()->onDelete('set null');
            $table->string('server_name')->nullable();
            $table->integer('cpu')->nullable();
            $table->integer('memory')->nullable();
            $table->integer('disk')->nullable();
            $table->unsignedBigInteger('pterodactyl_server_id')->nullable();
            $table->unsignedBigInteger('pterodactyl_node_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
