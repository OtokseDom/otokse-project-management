<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('delay_reasons', function (Blueprint $table) {
            // drop FK that depends on the composite index
            $table->dropForeign(['organization_id']);

            // drop the composite unique index
            $table->dropIndex('delay_reasons_organization_id_code_unique');

            // now the column can be removed
            $table->dropColumn('code');

            // re-add the FK (with its own index)
            $table->foreign('organization_id')
                ->references('id')
                ->on('organizations')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('delay_reasons', function (Blueprint $table) {
            $table->string('code');

            $table->unique(
                ['organization_id', 'code'],
                'delay_reasons_organization_id_code_unique'
            );
        });
    }
};