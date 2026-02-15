<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RentalFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'rental_id',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
    ];

    public function rental()
    {
        return $this->belongsTo(Rental::class);
    }
}
