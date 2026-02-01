<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'make',
        'model',
        'year',
        'color',
        'license_plate',
        'mileage',
        'status',
    ];

    // Un véhicule appartient à une entreprise
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    // Un véhicule a plusieurs maintenances
    public function maintenances()
    {
        return $this->hasMany(Maintenance::class);
    }

    // Un véhicule a plusieurs rappels
    public function reminders()
    {
        return $this->hasMany(MaintenanceReminder::class);
    }
}