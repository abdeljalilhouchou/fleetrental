<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use App\Models\Maintenance;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

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
        $vehicle = Vehicle::with('company')->find($data['vehicle_id']);
        $vehicle->update(['status' => 'maintenance']);

        // Notification aux admins
        AppNotification::notifyCompanyAdmins(
            $vehicle->company_id,
            'maintenance_created',
            'Nouvelle maintenance',
            "Maintenance {$maintenance->type} sur {$vehicle->brand} {$vehicle->model}",
            ['maintenance_id' => $maintenance->id, 'vehicle_id' => $vehicle->id]
        );

        // Email aux admins
        $apiKey = env('BREVO_API_KEY');
        if ($apiKey) {
            $emailData = [
                'vehicle'     => "{$vehicle->brand} {$vehicle->model} {$vehicle->year}",
                'registration'=> $vehicle->registration_number,
                'type'        => $maintenance->type,
                'date'        => \Carbon\Carbon::parse($maintenance->date)->format('d/m/Y'),
                'mileage'     => $maintenance->mileage_at_maintenance,
                'cost'        => $maintenance->cost,
                'description' => $maintenance->description,
                'company'     => $vehicle->company->name ?? '',
                'created_at'  => now()->format('d/m/Y à H:i'),
            ];

            $admins = User::where('company_id', $vehicle->company_id)
                ->where('role', 'company_admin')
                ->get();

            foreach ($admins as $admin) {
                if (!$admin->notifications_email || !$admin->notifications_maintenance) {
                    continue;
                }
                try {
                    $htmlContent = view('emails.maintenance_created', ['data' => $emailData])->render();
                    Http::withHeaders([
                        'api-key'      => $apiKey,
                        'Content-Type' => 'application/json',
                    ])->post('https://api.brevo.com/v3/smtp/email', [
                        'sender'      => ['name' => 'FleetRental', 'email' => env('BREVO_SENDER_EMAIL', 'houchouabdeljalil501@gmail.com')],
                        'to'          => [['email' => $admin->email, 'name' => $admin->name]],
                        'subject'     => '🔧 Nouvelle maintenance — ' . $emailData['vehicle'],
                        'htmlContent' => $htmlContent,
                    ]);
                    \Log::info("Email maintenance envoyé à {$admin->email}");
                } catch (\Exception $e) {
                    \Log::warning("Email maintenance non envoyé à {$admin->email}: " . $e->getMessage());
                }
            }
        }

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

        // Notification aux admins
        $vehicle = Vehicle::find($maintenance->vehicle_id);
        AppNotification::notifyCompanyAdmins(
            $vehicle->company_id,
            'maintenance_completed',
            'Maintenance terminée',
            "Maintenance {$maintenance->type} terminée sur {$vehicle->brand} {$vehicle->model}",
            ['maintenance_id' => $maintenance->id, 'vehicle_id' => $vehicle->id]
        );

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