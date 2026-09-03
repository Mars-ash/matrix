<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trial_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('jo_id')->constrained('jos')->cascadeOnDelete();
            $table->string('name');
            $table->date('trial_date');
            $table->date('update_date');
            $table->string('customer');
            $table->string('job_no');
            $table->string('pic_name');
            $table->string('approved_by_name');
            $table->timestamps();

            $table->index('jo_id');
            $table->index('trial_date');
            $table->index('job_no');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trial_sessions');
    }
};
