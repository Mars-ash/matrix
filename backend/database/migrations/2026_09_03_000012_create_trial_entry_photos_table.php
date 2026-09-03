<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trial_entry_photos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('trial_entry_id')->constrained('trial_entries')->cascadeOnDelete();
            $table->string('name');
            $table->string('path');
            $table->timestamp('added_at')->useCurrent();
            $table->timestamps();

            $table->index('trial_entry_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trial_entry_photos');
    }
};
