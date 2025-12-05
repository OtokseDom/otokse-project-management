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
        Schema::table('projects', function (Blueprint $table) {
            // Add new fields
            $table->date('start_date')->nullable()->after('description');
            $table->date('end_date')->nullable()->after('start_date');
            $table->date('actual_date')->nullable()->after('end_date');
            $table->double('days_estimate')->nullable()->after('actual_date');
            $table->double('days_taken')->nullable()->after('days_estimate');
            $table->double('delay_days')->nullable()->after('days_taken');
            $table->text('delay_reason')->nullable()->after('delay_days');

            // If you’re *sure* you want to remove old columns:
            $table->dropColumn(['target_date', 'estimated_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn([
                'start_date',
                'end_date',
                'actual_date',
                'days_estimate',
                'days_taken',
                'delay_days',
                'delay_reason',
            ]);
        });
    }
};