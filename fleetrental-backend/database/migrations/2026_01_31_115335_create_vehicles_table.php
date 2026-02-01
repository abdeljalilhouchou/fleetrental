<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->string('make');           // Marque (ex: Toyota)
            $table->string('model');          // Modèle (ex: Corolla)
            $table->year('year');             // Année
            $table->string('color');          // Couleur
            $table->string('license_plate');  // Immatriculation
            $table->integer('mileage')->default(0); // Kilométrage
            $table->enum('status', ['available', 'rented', 'maintenance', 'out_of_service'])->default('available');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};