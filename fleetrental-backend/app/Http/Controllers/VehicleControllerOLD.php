<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    // Liste tous les véhicules
    public function index(Request $request)
    {
        $vehicles = Vehicle::where('company_id', $request->user()->company_id)
                           ->orderBy('created_at', 'desc')
                           ->get();

        return response()->json($vehicles);
    }

    // Créer un véhicule
    public function store(Request $request)
    {
        $data = $request->validate([
            'make'          => ['required', 'string'],
            'model'         => ['required', 'string'],
            'year'          => ['required', 'integer', 'min:1900'],
            'color'         => ['required', 'string'],
            'license_plate' => ['required', 'string', 'unique:vehicles'],
            'mileage'       => ['required', 'integer', 'min:0'],
            'status'        => ['required', 'in:available,rented,maintenance,out_of_service'],
        ]);

        $vehicle = Vehicle::create([
            ...$data,
            'company_id' => $request->user()->company_id,
        ]);

        return response()->json($vehicle, 201);
    }

    // Modifier un véhicule
    public function update(Request $request, Vehicle $vehicle)
    {
        $data = $request->validate([
            'make'          => ['required', 'string'],
            'model'         => ['required', 'string'],
            'year'          => ['required', 'integer', 'min:1900'],
            'color'         => ['required', 'string'],
            'license_plate' => ['required', 'string', 'unique:vehicles,license_plate,' . $vehicle->id],
            'mileage'       => ['required', 'integer', 'min:0'],
            'status'        => ['required', 'in:available,rented,maintenance,out_of_service'],
        ]);

        $vehicle->update($data);

        return response()->json($vehicle);
    }

    // Supprimer un véhicule
    public function destroy(Vehicle $vehicle)
    {
        $vehicle->delete();

        return response()->json(['message' => 'Véhicule supprimé avec succès']);
    }
}