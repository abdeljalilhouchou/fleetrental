<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rental extends Model
{
    protected $fillable = [
        'company_id',
        'vehicle_id',
        'customer_name',
        'customer_phone',
        'customer_email',
        'customer_address',
        'customer_id_card',
        'start_date',
        'end_date',
        'start_mileage',
        'end_mileage',
        'daily_rate',
        'total_price',
        'deposit_amount',
        'paid_amount',
        'status',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'daily_rate' => 'decimal:2',
        'total_price' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(RentalFile::class);
    }

    // Calculer le nombre de jours
    public function getDaysAttribute(): int
    {
        return $this->start_date->diffInDays($this->end_date) + 1;
    }

    // Calculer les km parcourus
    public function getDistanceAttribute(): ?int
    {
        if ($this->end_mileage === null) {
            return null;
        }
        return $this->end_mileage - $this->start_mileage;
    }

    // Calculer le montant restant à payer
    public function getRemainingAmountAttribute(): float
    {
        return $this->total_price - $this->paid_amount;
    }
}