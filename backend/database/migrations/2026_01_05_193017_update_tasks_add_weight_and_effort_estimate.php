<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Add new fields
            $table->integer('weight')->nullable()->after('expected_output');
            $table->integer('effort_estimate')->nullable()->after('weight');
            $table->integer('effort_taken')->nullable()->after('effort_estimate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn([
                'weight',
                'effort_estimate',
                'effort_taken',
            ]);
        });
    }
};