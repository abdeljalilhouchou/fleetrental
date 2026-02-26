<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    protected $fillable = [
        'company_id',
        'vehicle_id',
        'customer_name',
        'customer_phone',
        'customer_email',
        'customer_id_number',
        'start_date',
        'end_date',
        'notes',
        'status',
        'rejection_reason',
        'reference',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
    ];

    // ─── Relations ──────────────────────────────────────────────
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    // ─── Générer une référence unique ────────────────────────────
    public static function generateReference(): string
    {
        do {
            $ref = 'FLT-' . now()->year . '-' . str_pad(random_int(1, 99999), 5, '0', STR_PAD_LEFT);
        } while (self::where('reference', $ref)->exists());

        return $ref;
    }

    // ─── Accesseurs ──────────────────────────────────────────────
    public function getDaysAttribute(): int
    {
        return $this->start_date->diffInDays($this->end_date) + 1;
    }
}
