<?php

namespace App\Http\Controllers;

use App\Models\VehicleLocation;
use App\Models\Vehicle;
use Illuminate\Http\Request;

class GpsController extends Controller
{
    private const GPS_KEY = 'fleetrental_gps_2026';

    // ── Public: app mobile chauffeur envoie sa position ──────────────────────
    public function updateLocation(Request $request, $vehicleId)
    {
        $request->validate([
            'latitude'    => 'required|numeric',
            'longitude'   => 'required|numeric',
            'speed'       => 'nullable|numeric',
            'driver_name' => 'nullable|string|max:100',
            'api_key'     => 'required|string',
        ]);

        if ($request->api_key !== self::GPS_KEY) {
            return response()->json(['error' => 'Clé API invalide'], 401);
        }

        if (!Vehicle::find($vehicleId)) {
            return response()->json(['error' => 'Véhicule introuvable'], 404);
        }

        VehicleLocation::updateOrCreate(
            ['vehicle_id' => $vehicleId],
            [
                'latitude'     => $request->latitude,
                'longitude'    => $request->longitude,
                'speed'        => $request->speed ?? 0,
                'driver_name'  => $request->driver_name,
                'is_active'    => true,
                'last_seen_at' => now(),
            ]
        );

        return response()->json(['success' => true]);
    }

    // ── Public: arrêter le tracking ───────────────────────────────────────────
    public function stopTracking(Request $request, $vehicleId)
    {
        $request->validate(['api_key' => 'required|string']);

        if ($request->api_key !== self::GPS_KEY) {
            return response()->json(['error' => 'Clé API invalide'], 401);
        }

        VehicleLocation::where('vehicle_id', $vehicleId)->update(['is_active' => false]);

        return response()->json(['success' => true]);
    }

    // ── Authentifié: dashboard web récupère toutes les positions actives ──────
    public function getActiveLocations()
    {
        $locations = VehicleLocation::with('vehicle')
            ->where('is_active', true)
            ->where('last_seen_at', '>=', now()->subMinutes(3))
            ->get()
            ->map(function ($loc) {
                $v = $loc->vehicle;
                return [
                    'vehicle_id'   => $loc->vehicle_id,
                    'vehicle_name' => $v ? "{$v->brand} {$v->model}" : 'Inconnu',
                    'plate'        => $v?->registration_number ?? '',
                    'latitude'     => $loc->latitude,
                    'longitude'    => $loc->longitude,
                    'speed'        => $loc->speed,
                    'driver_name'  => $loc->driver_name ?? 'Chauffeur',
                    'last_seen_at' => $loc->last_seen_at?->diffForHumans(),
                ];
            });

        return response()->json($locations);
    }
}
