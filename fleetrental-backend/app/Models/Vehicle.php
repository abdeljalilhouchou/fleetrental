<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vehicle extends Model
{
    protected $fillable = [
        'company_id',
        'brand',              // ← Doit être là
        'model',
        'year',
        'registration_number', // ← Doit être là
        'vin',                // ← Doit être là
        'current_mileage',
        'purchase_date',
        'status',
        'vehicle_type',       // ← Doit être là
        'daily_rate',         // ← Doit être là
        'photo',
    ];

    protected $casts = [
        'year' => 'integer',
        'current_mileage' => 'integer',
        'daily_rate' => 'decimal:2',
        'purchase_date' => 'date',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function maintenances()
    {
        return $this->hasMany(Maintenance::class);
    }

    public function reminders()
    {
        return $this->hasMany(MaintenanceReminder::class);
    }

    public function rentals()
    {
        return $this->hasMany(Rental::class);
    }

    public function documents()
    {
        return $this->hasMany(VehicleDocument::class);
    }
}