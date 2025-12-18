<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {

            // Add epic relation
            $table->foreignId('epic_id')
                ->nullable()
                ->after('id')
                ->constrained()
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {

        Schema::table('projects', function (Blueprint $table) {

            // Drop new columns
            $table->dropForeign(['epic_id']);
            $table->dropColumn(['epic_id']);
        });
    }
};