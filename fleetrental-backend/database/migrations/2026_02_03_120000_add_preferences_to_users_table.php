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
            $table->string('theme')->default('light')->after('avatar');
            $table->string('language')->default('fr')->after('theme');
            $table->boolean('notifications_email')->default(true)->after('language');
            $table->boolean('notifications_maintenance')->default(true)->after('notifications_email');
            $table->boolean('notifications_rental')->default(true)->after('notifications_maintenance');
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
