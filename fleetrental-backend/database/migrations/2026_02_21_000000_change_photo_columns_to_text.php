<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Changer photo des véhicules en LONGTEXT pour stocker le base64 (images jusqu'à 4GB)
        Schema::getConnection()->statement('ALTER TABLE vehicles MODIFY COLUMN photo LONGTEXT NULL');

        // Changer avatar des utilisateurs en LONGTEXT pour stocker le base64
        Schema::getConnection()->statement('ALTER TABLE users MODIFY COLUMN avatar LONGTEXT NULL');
    }

    public function down(): void
    {
        Schema::getConnection()->statement('ALTER TABLE vehicles MODIFY COLUMN photo VARCHAR(500) NULL');
        Schema::getConnection()->statement('ALTER TABLE users MODIFY COLUMN avatar VARCHAR(255) NULL');
    }
};
