<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->foreignId('renter_user_id')->nullable()->after('company_id')
                  ->constrained('users')->nullOnDelete();
            $table->string('renter_pin', 10)->nullable()->after('renter_user_id');
        });
    }

    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->dropForeign(['renter_user_id']);
            $table->dropColumn(['renter_user_id', 'renter_pin']);
        });
    }
};
