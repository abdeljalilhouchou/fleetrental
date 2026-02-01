<?php

namespace App\Http\Controllers;

use App\Models\Maintenance;
use App\Models\Vehicle;
use Illuminate\Http\Request;

class MaintenanceController extends Controller
{
    public function index(Request $request)
    {
        $maintenances = Maintenance::with('vehicle', 'files')
            ->whereHas('vehicle', fn($q) => $q->where('company_id', $request->user()->company_id))
            ->orderBy('date', 'desc')
            ->get();

        return response()->json($maintenances);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'vehicle_id'             => ['required', 'integer', 'exists:vehicles,id'],
            'type'                   => ['required', 'string'],
            'description'            => ['nullable', 'string'],
            'cost'                   => ['required', 'numeric', 'min:0'],
            'date'                   => ['required', 'date'],
            'mileage_at_maintenance' => ['required', 'integer', 'min:0'],
        ]);

        $maintenance = Maintenance::create($data);

        // Le véhicule passe automatiquement en maintenance
        Vehicle::find($data['vehicle_id'])->update(['status' => 'maintenance']);

        return response()->json($maintenance->load('vehicle'), 201);
    }

    public function update(Request $request, Maintenance $maintenance)
    {
        $data = $request->validate([
            'vehicle_id'             => ['required', 'integer', 'exists:vehicles,id'],
            'type'                   => ['required', 'string'],
            'description'            => ['nullable', 'string'],
            'cost'                   => ['required', 'numeric', 'min:0'],
            'date'                   => ['required', 'date'],
            'mileage_at_maintenance' => ['required', 'integer', 'min:0'],
        ]);

        $maintenance->update($data);

        return response()->json($maintenance->load('vehicle'));
    }

    // Marquer une maintenance comme terminée
    public function complete(Maintenance $maintenance)
    {
        $maintenance->update(['status' => 'completed']);

        // Vérifie si le véhicule a d'autres maintenances en cours
        $hasOtherInProgress = Maintenance::where('vehicle_id', $maintenance->vehicle_id)
            ->where('status', 'in_progress')
            ->exists();

        // Si plus de maintenance en cours → le véhicule revient en available
        if (!$hasOtherInProgress) {
            Vehicle::find($maintenance->vehicle_id)->update(['status' => 'available']);
        }

        return response()->json($maintenance->load('vehicle'));
    }

    public function destroy(Maintenance $maintenance)
    {
        $vehicleId = $maintenance->vehicle_id;
        $maintenance->delete();

        // Si plus de maintenance en cours après suppression → revient en available
        $hasOtherInProgress = Maintenance::where('vehicle_id', $vehicleId)
            ->where('status', 'in_progress')
            ->exists();

        if (!$hasOtherInProgress) {
            Vehicle::find($vehicleId)->update(['status' => 'available']);
        }

        return response()->json(['message' => 'Maintenance supprimée avec succès']);
    }
}