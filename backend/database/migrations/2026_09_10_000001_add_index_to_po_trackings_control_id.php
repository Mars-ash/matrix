<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('po_trackings', function (Blueprint $table) {
            $table->unique('control_id', 'po_trackings_control_id_unique');
        });
    }

    public function down(): void
    {
        Schema::table('po_trackings', function (Blueprint $table) {
            $table->dropUnique('po_trackings_control_id_unique');
        });
    }
};
