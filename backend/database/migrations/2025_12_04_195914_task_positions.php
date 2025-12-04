<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_positions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->onDelete('cascade')->onUpdate('cascade');
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade')->onUpdate('cascade');
            $table->string('context');
            $table->integer('context_id')->nullable();
            $table->integer('position');
            $table->timestamps();
            $table->unique(['organization_id', 'task_id', 'context', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_positions');
    }
};