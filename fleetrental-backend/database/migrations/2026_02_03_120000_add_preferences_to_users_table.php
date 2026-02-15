<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // avatar existe déjà, on ajoute uniquement les préférences
            if (!Schema::hasColumn('users', 'avatar')) {
                $table->string('avatar')->nullable();
            }
            $table->string('theme')->default('light');
            $table->string('language')->default('fr');
            $table->boolean('notifications_email')->default(true);
            $table->boolean('notifications_maintenance')->default(true);
            $table->boolean('notifications_rental')->default(true);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'theme',
                'language',
                'notifications_email',
                'notifications_maintenance',
                'notifications_rental',
            ]);
        });
    }
};
