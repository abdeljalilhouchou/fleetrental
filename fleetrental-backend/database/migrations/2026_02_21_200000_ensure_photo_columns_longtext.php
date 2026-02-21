<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Force LONGTEXT pour stocker les images base64 (peuvent dépasser 1MB)
        Schema::getConnection()->statement('ALTER TABLE vehicles MODIFY COLUMN photo LONGTEXT NULL');
        Schema::getConnection()->statement('ALTER TABLE users MODIFY COLUMN avatar LONGTEXT NULL');
    }

    public function down(): void
    {
        Schema::getConnection()->statement('ALTER TABLE vehicles MODIFY COLUMN photo VARCHAR(500) NULL');
        Schema::getConnection()->statement('ALTER TABLE users MODIFY COLUMN avatar VARCHAR(255) NULL');
    }
};
