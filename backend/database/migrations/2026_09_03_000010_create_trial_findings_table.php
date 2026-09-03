<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trial_findings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('trial_session_id')->constrained('trial_sessions')->cascadeOnDelete();
            $table->integer('order')->default(0);
            $table->timestamps();

            $table->index('trial_session_id');
            $table->index('order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trial_findings');
    }
};
