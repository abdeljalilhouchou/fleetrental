<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Changer photo des véhicules en TEXT pour stocker le base64
        Schema::table('vehicles', function (Blueprint $table) {
            $table->text('photo')->nullable()->change();
        });

        // Changer avatar des utilisateurs en TEXT pour stocker le base64
        Schema::table('users', function (Blueprint $table) {
            $table->text('avatar')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->string('photo', 500)->nullable()->change();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar')->nullable()->change();
        });
    }
};
