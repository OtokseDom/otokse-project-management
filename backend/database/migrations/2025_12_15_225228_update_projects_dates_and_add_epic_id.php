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

            // New date fields
            $table->date('start_date')->nullable()->after('description');
            $table->date('end_date')->nullable()->after('start_date');
        });

        // Migrate existing data
        DB::table('projects')->update([
            'start_date' => DB::raw('estimated_date'),
            'end_date'   => DB::raw('target_date'),
        ]);

        // Drop old columns AFTER data migration
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['estimated_date', 'target_date']);
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {

            // Restore old columns
            $table->date('estimated_date')->nullable();
            $table->date('target_date')->nullable();
        });

        // Restore data back
        DB::table('projects')->update([
            'estimated_date' => DB::raw('start_date'),
            'target_date'    => DB::raw('end_date'),
        ]);

        Schema::table('projects', function (Blueprint $table) {

            // Drop new columns
            $table->dropForeign(['epic_id']);
            $table->dropColumn(['epic_id', 'start_date', 'end_date']);
        });
    }
};
