<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ============ FIX VEHICLES TABLE ============
        Schema::table('vehicles', function (Blueprint $table) {
            // Rename columns: make → brand, license_plate → registration_number, mileage → current_mileage
            $table->renameColumn('make', 'brand');
            $table->renameColumn('license_plate', 'registration_number');
            $table->renameColumn('mileage', 'current_mileage');
        });

        Schema::table('vehicles', function (Blueprint $table) {
            // Make color nullable
            $table->string('color')->nullable()->change();

            // Change status from enum to varchar for flexibility
            $table->string('status')->default('available')->change();

            // Add missing columns
            $table->string('vin', 255)->nullable();
            $table->date('purchase_date')->nullable();
            $table->string('vehicle_type', 100)->nullable();
            $table->decimal('daily_rate', 10, 2)->default(0)->nullable();
            $table->string('photo', 500)->nullable();
        });

        // ============ FIX COMPANIES TABLE ============
        Schema::table('companies', function (Blueprint $table) {
            if (!Schema::hasColumn('companies', 'logo')) {
                $table->string('logo')->nullable();
            }
            if (!Schema::hasColumn('companies', 'city')) {
                $table->string('city')->nullable();
            }
            if (!Schema::hasColumn('companies', 'postal_code')) {
                $table->string('postal_code')->nullable();
            }
            if (!Schema::hasColumn('companies', 'country')) {
                $table->string('country')->nullable();
            }
        });

        // ============ FIX RENTALS STATUS ============
        Schema::table('rentals', function (Blueprint $table) {
            $table->string('status')->default('ongoing')->change();
        });

        // ============ FIX MAINTENANCES STATUS ============
        Schema::table('maintenances', function (Blueprint $table) {
            $table->string('status')->default('in_progress')->change();
        });
    }

    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn(['vin', 'purchase_date', 'vehicle_type', 'daily_rate', 'photo']);
        });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->renameColumn('brand', 'make');
            $table->renameColumn('registration_number', 'license_plate');
            $table->renameColumn('current_mileage', 'mileage');
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['logo', 'city', 'postal_code', 'country']);
        });
    }
};
