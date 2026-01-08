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
        Schema::create('delay_reasons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->onDelete('cascade')->onUpdate('cascade');
            $table->string('name');
            $table->string('code')->unique();
            /*
             * Category helps grouping and reporting
             * Examples:
             * - delay
             * - dependency
             * - scope
             * - resource
             * - external
             */
            $table->string('category');
            $table->enum('impact_level', [
                'positive',
                'neutral',
                'negative'
            ])->default('negative');
            /*
             * Severity is numeric for comparisons
             * 1 = minor
             * 5 = critical
             */
            $table->unsignedTinyInteger('severity')->default(3);
            $table->boolean('is_valid')->default(true);
            $table->text('description')->nullable();
            /*
             * For soft deprecation instead of deleting
             */
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            // Indexes for reports
            $table->index(['category']);
            $table->index(['impact_level']);
            $table->index(['severity']);
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('delay_reasons');
    }
};
