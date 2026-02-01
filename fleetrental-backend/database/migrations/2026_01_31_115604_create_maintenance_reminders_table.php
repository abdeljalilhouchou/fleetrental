<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained('vehicles')->onDelete('cascade');
            $table->string('type');                              // Type (vidange, freins...)
            $table->text('description')->nullable();             // Description
            $table->integer('next_due_mileage')->nullable();     // Prochain kilométrage
            $table->date('next_due_date')->nullable();           // Prochaine date
            $table->boolean('is_active')->default(true);         // Actif ou non
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_reminders');
    }
};