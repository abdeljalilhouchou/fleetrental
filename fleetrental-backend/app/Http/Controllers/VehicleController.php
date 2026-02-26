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
        if (!$request->user()->hasPermission('create_vehicles')) {
            return response()->json(['message' => 'Permission refusée : create_vehicles'], 403);
        }

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
        if (!$request->user()->hasPermission('edit_vehicles')) {
            return response()->json(['message' => 'Permission refusée : edit_vehicles'], 403);
        }

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
        if (!request()->user()->hasPermission('delete_vehicles')) {
            return response()->json(['message' => 'Permission refusée : delete_vehicles'], 403);
        }

        if ($vehicle->company_id !== request()->user()->company_id) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $vehicle->delete();

        return response()->json(['message' => 'Véhicule supprimé']);
    }

    public function uploadPhoto(Request $request, Vehicle $vehicle)
    {
        if (!$request->user()->hasPermission('edit_vehicles')) {
            return response()->json(['message' => 'Permission refusée : edit_vehicles'], 403);
        }

        if ($vehicle->company_id !== $request->user()->company_id) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        $file     = $request->file('photo');
        $mimeType = $file->getMimeType();
        $base64   = base64_encode(file_get_contents($file->getRealPath()));
        $dataUrl  = "data:{$mimeType};base64,{$base64}";

        $vehicle->update(['photo' => $dataUrl]);

        return response()->json($vehicle);
    }

    public function updateStatus(Request $request, Vehicle $vehicle)
    {
        if (!$request->user()->hasPermission('change_vehicle_status')) {
            return response()->json(['message' => 'Permission refusée : change_vehicle_status'], 403);
        }

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
