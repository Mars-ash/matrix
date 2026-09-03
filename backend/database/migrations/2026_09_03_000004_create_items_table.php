<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('category_id')->constrained('categories')->cascadeOnDelete();
            $table->string('no')->default('-');
            $table->string('description');
            $table->string('dimension')->default('');
            $table->string('material')->default('');
            $table->integer('qty')->default(1);
            $table->string('hrc')->default('');
            
            // Subcont tracking fields
            $table->boolean('is_subcont')->default(false);
            $table->text('subcont_notes')->nullable();
            $table->string('subcont_supplier')->nullable();
            $table->string('subcont_status')->nullable(); // In Progress, Done
            $table->string('subcont_process')->nullable();
            $table->timestamp('subcont_dispatch_date')->nullable();
            $table->timestamp('subcont_done_at')->nullable();
            $table->date('arrival_target_date')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('category_id');
            $table->index('no');
            $table->index('description');
            $table->index('is_subcont');
            $table->index('subcont_status');
            $table->index('subcont_supplier');
            $table->index('arrival_target_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
