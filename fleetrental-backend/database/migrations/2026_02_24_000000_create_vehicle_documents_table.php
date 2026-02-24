<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // carte_grise, assurance, controle_technique, vignette, autre
            $table->string('name');
            $table->longText('file_data')->nullable(); // base64 data URL
            $table->string('file_name')->nullable();   // nom du fichier original
            $table->string('mime_type')->nullable();   // type MIME
            $table->date('expiry_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_documents');
    }
};
