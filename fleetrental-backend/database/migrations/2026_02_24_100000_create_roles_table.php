<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();         // fleet_manager, rental_agent, etc.
            $table->string('display_name');           // "Fleet Manager"
            $table->string('description')->nullable();
            $table->boolean('is_system')->default(false); // true = ne peut pas être supprimé
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
