<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VehicleLocation extends Model
{
    protected $fillable = [
        'vehicle_id',
        'latitude',
        'longitude',
        'speed',
        'driver_name',
        'is_active',
        'last_seen_at',
    ];

    protected $casts = [
        'latitude'     => 'float',
        'longitude'    => 'float',
        'speed'        => 'float',
        'is_active'    => 'boolean',
        'last_seen_at' => 'datetime',
    ];

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }
}
