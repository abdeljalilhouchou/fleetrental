<?php

namespace App\Http\Controllers;

use App\Models\Rental;
use App\Models\VehicleLocation;
use Illuminate\Http\Request;

class RenterController extends Controller
{
    // ── GET /api/renter/my-rental ─────────────────────────────────────────────
    public function myRental()
    {
        $user   = auth()->user();
        $rental = Rental::where('renter_user_id', $user->id)
            ->where('status', 'ongoing')
            ->with('vehicle')
            ->first();

        if (! $rental) {
            return response()->json(['error' => 'Aucune location active'], 404);
        }

        $v = $rental->vehicle;

        return response()->json([
            'rental_id'   => $rental->id,
            'start_date'  => $rental->start_date,
            'end_date'    => $rental->end_date,
            'vehicle'     => $v ? [
                'id'                  => $v->id,
                'brand'               => $v->brand,
                'model'               => $v->model,
                'year'                => $v->year,
                'registration_number' => $v->registration_number,
                'photo'               => $v->photo_url ?? null,
            ] : null,
        ]);
    }

    // ── POST /api/renter/location ─────────────────────────────────────────────
    public function updateLocation(Request $request)
    {
        $request->validate([
            'latitude'  => 'required|numeric',
            'longitude' => 'required|numeric',
            'speed'     => 'nullable|numeric',
        ]);

        $user   = auth()->user();
        $rental = Rental::where('renter_user_id', $user->id)
            ->where('status', 'ongoing')
            ->first();

        if (! $rental) {
            return response()->json(['error' => 'Aucune location active'], 404);
        }

        VehicleLocation::updateOrCreate(
            ['vehicle_id' => $rental->vehicle_id],
            [
                'latitude'     => $request->latitude,
                'longitude'    => $request->longitude,
                'speed'        => $request->speed ?? 0,
                'driver_name'  => $user->name,
                'is_active'    => true,
                'last_seen_at' => now(),
            ]
        );

        return response()->json(['success' => true]);
    }

    // ── POST /api/renter/location/stop ────────────────────────────────────────
    public function stopTracking()
    {
        $user   = auth()->user();
        $rental = Rental::where('renter_user_id', $user->id)
            ->where('status', 'ongoing')
            ->first();

        if ($rental) {
            VehicleLocation::where('vehicle_id', $rental->vehicle_id)
                ->update(['is_active' => false]);
        }

        return response()->json(['success' => true]);
    }
}
