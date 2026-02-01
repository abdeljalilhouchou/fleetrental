<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VehicleController extends Controller
{
    public function index(Request $request)
    {
        $companyId = $request->user()->company_id;

        $vehicles = Vehicle::where('company_id', $companyId)
            ->with([
                'maintenances' => function ($query) {
                    $query->latest()->take(1);
                }
            ])
            ->get();

        return response()->json($vehicles);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'brand' => 'required|string|max:100',
            'model' => 'required|string|max:100',
            'year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
            'registration_number' => 'required|string|max:50',
            'vin' => 'nullable|string|max:50',
            'current_mileage' => 'required|integer|min:0',
            'purchase_date' => 'nullable|date',
            'status' => 'required|in:available,rented,maintenance,out_of_service',
            'vehicle_type' => 'nullable|string|max:100',
            'daily_rate' => 'nullable|numeric|min:0',
            'photo' => 'nullable|string|max:500',
        ]);

        $validated['company_id'] = $request->user()->company_id;

        $vehicle = Vehicle::create($validated);

        return response()->json($vehicle->load('company'), 201);
    }

    public function update(Request $request, Vehicle $vehicle)
    {
        // Vérifier que le véhicule appartient à la même entreprise
        if ($vehicle->company_id !== $request->user()->company_id) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $data = $request->validate([
            'brand' => ['required', 'string', 'max:255'],
            'model' => ['required', 'string', 'max:255'],
            'year' => ['required', 'integer', 'min:1900', 'max:' . (date('Y') + 1)],
            'registration_number' => ['required', 'string', 'max:255'],
            'vin' => ['nullable', 'string', 'max:255'],
            'current_mileage' => ['required', 'integer', 'min:0'],
            'purchase_date' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['available', 'rented', 'maintenance', 'out_of_service', 'reserved'])],
            'vehicle_type' => ['required', 'string', 'max:255'],
            'daily_rate' => ['nullable', 'numeric', 'min:0'],
            'photo' => ['nullable', 'string'],
        ]);

        $vehicle->update($data);

        return response()->json($vehicle);
    }

    public function destroy(Vehicle $vehicle)
    {
        // Vérifier que le véhicule appartient à la même entreprise
        if ($vehicle->company_id !== request()->user()->company_id) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $vehicle->delete();

        return response()->json(['message' => 'Véhicule supprimé']);
    }

    /**
     * NOUVELLE MÉTHODE : Change uniquement le statut (accessible aux employés)
     */
    public function updateStatus(Request $request, Vehicle $vehicle)
    {
        // Vérifier que le véhicule appartient à la même entreprise
        if ($vehicle->company_id !== $request->user()->company_id) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in(['available', 'rented', 'maintenance', 'out_of_service', 'reserved'])],
        ]);

        $vehicle->update(['status' => $data['status']]);

        return response()->json($vehicle);
    }
}
