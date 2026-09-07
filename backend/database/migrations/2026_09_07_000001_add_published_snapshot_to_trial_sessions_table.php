<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trial_sessions', function (Blueprint $table) {
            $table->jsonb('published_snapshot')->nullable()->after('approved_by_name');
            $table->timestamp('last_published_at')->nullable()->after('published_snapshot');
        });
    }

    public function down(): void
    {
        Schema::table('trial_sessions', function (Blueprint $table) {
            $table->dropColumn(['published_snapshot', 'last_published_at']);
        });
    }
};
