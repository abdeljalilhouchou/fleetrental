<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceReminder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class MaintenanceReminderController extends Controller
{
    public function index(Request $request)
    {
        $reminders = MaintenanceReminder::with('vehicle')
            ->whereHas('vehicle', fn($q) => $q->where('company_id', $request->user()->company_id))
            ->where('is_active', true)
            ->get();

        // Calcule le statut de chaque rappel en temps réel
        $reminders = $reminders->map(function ($reminder) {
            $vehicle = $reminder->vehicle;
            $status = 'ok';

            $mileageOverdue = $reminder->next_due_mileage && $vehicle->current_mileage >= $reminder->next_due_mileage;
            $dateOverdue = $reminder->next_due_date && Carbon::parse($reminder->next_due_date)->isPast();

            if ($mileageOverdue || $dateOverdue) {
                $status = 'overdue';
            } else {
                $mileageUpcoming = $reminder->next_due_mileage && ($reminder->next_due_mileage - $vehicle->current_mileage) <= 500;
                $dateUpcoming = $reminder->next_due_date && Carbon::parse($reminder->next_due_date)->diffInDays(Carbon::now()) <= 7;

                if ($mileageUpcoming || $dateUpcoming) {
                    $status = 'upcoming';
                }
            }

            $reminder->computed_status = $status;
            return $reminder;
        });

        return response()->json($reminders);
    }

    public function store(Request $request)
    {
        if (!$request->user()->hasPermission('manage_reminders')) {
            return response()->json(['message' => 'Permission refus�e : manage_reminders'], 403);
        }

        $data = $request->validate([
            'vehicle_id' => ['required', 'integer', 'exists:vehicles,id'],
            'type' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'next_due_mileage' => ['nullable', 'integer', 'min:0'],
            'next_due_date' => ['nullable', 'date'],
        ]);

        $reminder = MaintenanceReminder::create($data);

        return response()->json($reminder->load('vehicle'), 201);
    }

    public function update(Request $request, MaintenanceReminder $reminder)
    {
        if (!$request->user()->hasPermission('manage_reminders')) {
            return response()->json(['message' => 'Permission refus�e : manage_reminders'], 403);
        }

        $data = $request->validate([
            'vehicle_id' => ['required', 'integer', 'exists:vehicles,id'],
            'type' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'next_due_mileage' => ['nullable', 'integer', 'min:0'],
            'next_due_date' => ['nullable', 'date'],
            'is_active' => ['boolean'],
        ]);

        $reminder->update($data);

        return response()->json($reminder->load('vehicle'));
    }
    // Renouveler un rappel après maintenance effectuée
    public function renew(Request $request, MaintenanceReminder $reminder)
    {
        if (!$request->user()->hasPermission('manage_reminders')) {
            return response()->json(['message' => 'Permission refus�e : manage_reminders'], 403);
        }

        $data = $request->validate([
            'mileage_interval' => ['nullable', 'integer', 'min:1'],
            'date_months' => ['nullable', 'integer', 'min:1'],
        ]);

        $vehicle = $reminder->vehicle;

        // Nouveau kilométrage = kilométrage actuel du véhicule + intervalle
        if (!empty($data['mileage_interval'])) {
            $reminder->next_due_mileage = $vehicle->current_mileage + $data['mileage_interval'];
        }

        // Nouvelle date = aujourd'hui + nombre de mois
        if (!empty($data['date_months'])) {
            $reminder->next_due_date = Carbon::now()->addMonths($data['date_months'])->format('Y-m-d');
        }

        $reminder->save();

        return response()->json($reminder->load('vehicle'));
    }

    public function destroy(MaintenanceReminder $reminder)
    {
        if (!request()->user()->hasPermission('manage_reminders')) {
            return response()->json(['message' => 'Permission refus�e : manage_reminders'], 403);
        }

        $reminder->delete();

        return response()->json(['message' => 'Rappel supprimé avec succès']);
    }
}
