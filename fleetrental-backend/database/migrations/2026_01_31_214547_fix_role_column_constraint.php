<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Supprime l'ancienne contrainte
        DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
        
        // Change le default
        DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'employee'");
        
        // Ajoute la nouvelle contrainte avec les bonnes valeurs
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'company_admin', 'employee'))");
        
        // Met à jour les anciennes valeurs si elles existent
        DB::statement("UPDATE users SET role = 'company_admin' WHERE role = 'company_user'");
    }

    public function down(): void
    {
    }
};