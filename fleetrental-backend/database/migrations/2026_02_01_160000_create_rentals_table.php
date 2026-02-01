<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rentals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('vehicle_id')->constrained()->onDelete('cascade');
            
            // Informations client
            $table->string('customer_name');
            $table->string('customer_phone');
            $table->string('customer_email')->nullable();
            $table->text('customer_address')->nullable();
            $table->string('customer_id_card')->nullable(); // Numéro CIN/Passeport
            
            // Dates et kilométrage
            $table->date('start_date');
            $table->date('end_date');
            $table->integer('start_mileage');
            $table->integer('end_mileage')->nullable();
            
            // Prix
            $table->decimal('daily_rate', 10, 2); // Tarif par jour
            $table->decimal('total_price', 10, 2); // Prix total calculé
            $table->decimal('deposit_amount', 10, 2); // Caution
            $table->decimal('paid_amount', 10, 2)->default(0); // Montant payé
            
            // Statut
            $table->enum('status', ['ongoing', 'completed', 'cancelled'])->default('ongoing');
            
            // Notes
            $table->text('notes')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rentals');
    }
};