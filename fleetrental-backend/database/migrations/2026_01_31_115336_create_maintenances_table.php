<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained('vehicles')->onDelete('cascade');
            $table->string('type');                        // Type (vidange, freins, pneus...)
            $table->text('description')->nullable();       // Description détaillée
            $table->decimal('cost', 10, 2)->default(0);   // Coût
            $table->date('date');                          // Date de maintenance
            $table->integer('mileage_at_maintenance');     // Kilométrage au moment
            $table->string('invoice_path')->nullable();    // Chemin de la facture/photo
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenances');
    }
};