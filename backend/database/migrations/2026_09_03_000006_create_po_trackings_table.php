<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('po_trackings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('control_id')->constrained('controls')->cascadeOnDelete()->unique();
            $table->string('supplier')->nullable();
            $table->string('po_no')->nullable();
            $table->date('po_date')->nullable();
            $table->date('target_arrival')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('supplier');
            $table->index('po_no');
            $table->index('target_arrival');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('po_trackings');
    }
};
