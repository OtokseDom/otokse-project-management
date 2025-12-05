<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_discussion_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('discussion_id')->constrained('task_discussions')->onDelete('cascade');
            $table->string('file_path');
            $table->string('original_name')->nullable();
            $table->string('file_type')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_discussion_attachments');
    }
};
