<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('vehicle_id')->constrained()->onDelete('cascade');

            // Infos client (pas de compte nécessaire)
            $table->string('customer_name');
            $table->string('customer_phone');
            $table->string('customer_email')->nullable();
            $table->string('customer_id_number')->nullable(); // CIN ou passeport

            // Période souhaitée
            $table->date('start_date');
            $table->date('end_date');

            // Notes du client
            $table->text('notes')->nullable();

            // Statut : pending | confirmed | rejected | cancelled
            $table->enum('status', ['pending', 'confirmed', 'rejected', 'cancelled'])->default('pending');

            // Raison du rejet (renseignée par l'admin)
            $table->string('rejection_reason')->nullable();

            // Référence unique pour le suivi client (ex: FLT-2026-00042)
            $table->string('reference')->unique();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
