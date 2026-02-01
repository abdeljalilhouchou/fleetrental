<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaintenanceReminder extends Model
{
    use HasFactory;

    protected $fillable = [
        'vehicle_id',
        'type',
        'description',
        'next_due_mileage',
        'next_due_date',
        'is_active',
    ];

    // Un rappel appartient à un véhicule
    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }
}