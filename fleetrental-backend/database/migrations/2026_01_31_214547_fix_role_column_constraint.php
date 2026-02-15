<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Met à jour les anciennes valeurs si elles existent
        DB::table('users')->where('role', 'company_user')->update(['role' => 'company_admin']);

        // Change l'enum pour inclure les bons rôles
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['super_admin', 'company_admin', 'employee'])->default('employee')->change();
        });
    }

    public function down(): void
    {
    }
};
