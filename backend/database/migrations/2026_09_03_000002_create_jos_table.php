<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('jo_number')->unique();
            $table->string('product');
            $table->string('type'); // PROGRESSIVE, TANDEM, JIG, WIRECUT SERVICE, MACHINING SERVICE
            $table->date('target_date')->nullable();
            $table->date('finish_date')->nullable();
            $table->timestamps();

            $table->index('project_id');
            $table->index('product');
            $table->index('type');
            $table->index('finish_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jos');
    }
};
