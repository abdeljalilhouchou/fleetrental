<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Vehicle;
use App\Models\Reservation;
use Illuminate\Http\Request;

/**
 * PublicController — endpoints accessibles SANS authentification
 * Utilisés par l'application mobile cliente
 */
class PublicController extends Controller
{
    // ─── Liste des entreprises actives ──────────────────────────
    public function companies()
    {
        $companies = Company::withCount([
            'vehicles as available_vehicles_count' => function ($q) {
                $q->where('status', 'available');
            },
            'vehicles as total_vehicles_count',
        ])->get()->map(function ($company) {
            return [
                'id'                      => $company->id,
                'name'                    => $company->name,
                'address'                 => $company->address,
                'phone'                   => $company->phone,
                'email'                   => $company->email,
                'available_vehicles'      => $company->available_vehicles_count,
                'total_vehicles'          => $company->total_vehicles_count,
            ];
        });

        return response()->json($companies);
    }

    // ─── Véhicules disponibles d'une entreprise ─────────────────
    public function companyVehicles(Company $company)
    {
        $vehicles = Vehicle::where('company_id', $company->id)
            ->where('status', 'available')
            ->get()
            ->map(function ($v) {
                return [
                    'id'                  => $v->id,
                    'brand'               => $v->brand,
                    'model'               => $v->model,
                    'year'                => $v->year,
                    'color'               => $v->color,
                    'registration_number' => $v->registration_number,
                    'daily_rate'          => $v->daily_rate,
                    'fuel_type'           => $v->fuel_type,
                    'transmission'        => $v->transmission,
                    'seats'               => $v->seats,
                    'photo'               => $v->photo_url ?? null,
                    'status'              => $v->status,
                ];
            });

        return response()->json([
            'company'  => [
                'id'      => $company->id,
                'name'    => $company->name,
                'address' => $company->address,
                'phone'   => $company->phone,
                'email'   => $company->email,
            ],
            'vehicles' => $vehicles,
        ]);
    }

    // ─── Détail d'un véhicule ────────────────────────────────────
    public function vehicleDetail(Vehicle $vehicle)
    {
        return response()->json([
            'id'                  => $vehicle->id,
            'brand'               => $vehicle->brand,
            'model'               => $vehicle->model,
            'year'                => $vehicle->year,
            'color'               => $vehicle->color,
            'registration_number' => $vehicle->registration_number,
            'daily_rate'          => $vehicle->daily_rate,
            'fuel_type'           => $vehicle->fuel_type,
            'transmission'        => $vehicle->transmission,
            'seats'               => $vehicle->seats,
            'photo'               => $vehicle->photo_url ?? null,
            'status'              => $vehicle->status,
            'company'             => [
                'id'      => $vehicle->company->id,
                'name'    => $vehicle->company->name,
                'phone'   => $vehicle->company->phone,
                'email'   => $vehicle->company->email,
                'address' => $vehicle->company->address,
            ],
        ]);
    }

    // ─── Créer une réservation ───────────────────────────────────
    public function createReservation(Request $request)
    {
        $validated = $request->validate([
            'vehicle_id'         => 'required|exists:vehicles,id',
            'customer_name'      => 'required|string|max:255',
            'customer_phone'     => 'required|string|max:30',
            'customer_email'     => 'nullable|email|max:255',
            'customer_id_number' => 'nullable|string|max:50',
            'start_date'         => 'required|date|after_or_equal:today',
            'end_date'           => 'required|date|after_or_equal:start_date',
            'notes'              => 'nullable|string|max:1000',
        ]);

        $vehicle = Vehicle::with('company')->findOrFail($validated['vehicle_id']);

        // Vérifier que le véhicule est disponible
        if ($vehicle->status !== 'available') {
            return response()->json([
                'message' => 'Ce véhicule n\'est pas disponible pour la période demandée.',
            ], 422);
        }

        // Vérifier que le véhicule n'a pas déjà une réservation confirmée sur ces dates
        $conflict = Reservation::where('vehicle_id', $vehicle->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->where(function ($q) use ($validated) {
                $q->whereBetween('start_date', [$validated['start_date'], $validated['end_date']])
                  ->orWhereBetween('end_date', [$validated['start_date'], $validated['end_date']])
                  ->orWhere(function ($q2) use ($validated) {
                      $q2->where('start_date', '<=', $validated['start_date'])
                         ->where('end_date', '>=', $validated['end_date']);
                  });
            })->exists();

        if ($conflict) {
            return response()->json([
                'message' => 'Ce véhicule est déjà réservé pour cette période.',
            ], 422);
        }

        $reservation = Reservation::create([
            'company_id'         => $vehicle->company_id,
            'vehicle_id'         => $vehicle->id,
            'customer_name'      => $validated['customer_name'],
            'customer_phone'     => $validated['customer_phone'],
            'customer_email'     => $validated['customer_email'] ?? null,
            'customer_id_number' => $validated['customer_id_number'] ?? null,
            'start_date'         => $validated['start_date'],
            'end_date'           => $validated['end_date'],
            'notes'              => $validated['notes'] ?? null,
            'status'             => 'pending',
            'reference'          => Reservation::generateReference(),
        ]);

        // Notifier les admins de l'entreprise
        \App\Models\AppNotification::notifyCompanyAdmins(
            $vehicle->company_id,
            'reservation_created',
            'Nouvelle demande de réservation',
            "{$validated['customer_name']} souhaite réserver {$vehicle->brand} {$vehicle->model} du "
                . \Carbon\Carbon::parse($validated['start_date'])->format('d/m/Y')
                . ' au '
                . \Carbon\Carbon::parse($validated['end_date'])->format('d/m/Y'),
            ['reservation_id' => $reservation->id, 'vehicle_id' => $vehicle->id]
        );

        return response()->json([
            'message'   => 'Votre demande de réservation a été envoyée avec succès.',
            'reference' => $reservation->reference,
            'status'    => $reservation->status,
            'vehicle'   => "{$vehicle->brand} {$vehicle->model}",
            'company'   => $vehicle->company->name,
            'start_date'=> $reservation->start_date->format('d/m/Y'),
            'end_date'  => $reservation->end_date->format('d/m/Y'),
        ], 201);
    }

    // ─── Suivre une réservation par référence ─────────────────────
    public function trackReservation(string $reference)
    {
        $reservation = Reservation::with(['vehicle', 'company'])
            ->where('reference', $reference)
            ->firstOrFail();

        $statusLabels = [
            'pending'   => 'En attente de confirmation',
            'confirmed' => 'Confirmée',
            'rejected'  => 'Refusée',
            'cancelled' => 'Annulée',
        ];

        $days = $reservation->start_date->diffInDays($reservation->end_date) + 1;

        return response()->json([
            'reference'        => $reservation->reference,
            'status'           => $reservation->status,
            'status_label'     => $statusLabels[$reservation->status] ?? $reservation->status,
            'rejection_reason' => $reservation->rejection_reason,
            'customer_name'    => $reservation->customer_name,
            'vehicle'          => [
                'brand' => $reservation->vehicle->brand,
                'model' => $reservation->vehicle->model,
                'year'  => $reservation->vehicle->year,
                'photo' => $reservation->vehicle->photo_url ?? null,
            ],
            'company' => [
                'name'    => $reservation->company->name,
                'phone'   => $reservation->company->phone,
                'address' => $reservation->company->address,
            ],
            'start_date'  => $reservation->start_date->format('d/m/Y'),
            'end_date'    => $reservation->end_date->format('d/m/Y'),
            'days'        => $days,
            'daily_rate'  => $reservation->vehicle->daily_rate,
            'total_price' => $days * $reservation->vehicle->daily_rate,
            'notes'       => $reservation->notes,
            'created_at'  => $reservation->created_at->format('d/m/Y à H:i'),
        ]);
    }
}
