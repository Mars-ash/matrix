<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trial_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('trial_finding_id')->constrained('trial_findings')->cascadeOnDelete();
            $table->string('section'); // problems, causes, correctiveActions
            $table->integer('order')->default(0);
            $table->text('text')->default('');
            $table->date('target_date')->nullable(); // correctiveActions only
            $table->string('pic')->nullable(); // correctiveActions only
            $table->string('status')->nullable(); // correctiveActions only: On Process, Close
            $table->timestamps();

            $table->index('trial_finding_id');
            $table->index('section');
            $table->index('order');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trial_entries');
    }
};
