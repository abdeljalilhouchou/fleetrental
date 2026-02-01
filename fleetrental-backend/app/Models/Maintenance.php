<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Maintenance extends Model
{
    use HasFactory;

    protected $fillable = [
        'vehicle_id',
        'type',
        'description',
        'cost',
        'date',
        'mileage_at_maintenance',
        'invoice_path',
        'status',
    ];

    // Une maintenance appartient à un véhicule
    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }
    public function files()
    {
        return $this->hasMany(MaintenanceFile::class);
    }
}