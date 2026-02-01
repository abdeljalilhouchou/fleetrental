<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaintenanceFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'maintenance_id',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
    ];

    public function maintenance()
    {
        return $this->belongsTo(Maintenance::class);
    }
}