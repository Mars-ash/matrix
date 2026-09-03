<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('controls', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('item_id')->constrained('items')->cascadeOnDelete();
            $table->string('process'); // Material, Arrival, Machining, Hardening, Grinding, Wirecut, Assembly, PO
            $table->string('status')->default('-'); // -, Not Started, In Progress, In Progress SC, Done, Problem
            $table->text('notes')->default('');
            $table->timestamp('in_progress_at')->nullable();
            $table->date('target_date')->nullable();
            $table->timestamps();

            $table->index('item_id');
            $table->index('process');
            $table->index('status');
            $table->index('target_date');
            $table->unique(['item_id', 'process']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('controls');
    }
};
