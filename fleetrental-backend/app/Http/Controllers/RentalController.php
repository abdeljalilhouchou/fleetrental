<?php

namespace App\Http\Controllers;

use App\Models\Rental;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RentalController extends Controller
{
    // Lister toutes les locations
    public function index(Request $request)
    {
        $companyId = $request->user()->role === 'super_admin'
            ? null
            : $request->user()->company_id;

        $query = Rental::with(['vehicle', 'company']);

        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        $rentals = $query->latest()->get();

        return response()->json($rentals);
    }

    // Créer une location
    public function store(Request $request)
    {
        $validated = $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:20',
            'customer_email' => 'nullable|email',
            'customer_address' => 'nullable|string',
            'customer_id_card' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'start_mileage' => 'required|integer|min:0',
            'daily_rate' => 'required|numeric|min:0',
            'deposit_amount' => 'required|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        // Récupérer le véhicule
        $vehicle = Vehicle::findOrFail($validated['vehicle_id']);

        // Vérifier que le véhicule appartient à la même company
        if ($request->user()->role !== 'super_admin' && $vehicle->company_id !== $request->user()->company_id) {
            return response()->json(['message' => 'Véhicule non trouvé'], 404);
        }

        // Vérifier que le véhicule est disponible
        if ($vehicle->status !== 'available') {
            return response()->json(['message' => 'Le véhicule n\'est pas disponible pour la location'], 400);
        }

        // Calculer le prix total
        $startDate = new \DateTime($validated['start_date']);
        $endDate = new \DateTime($validated['end_date']);
        $days = $startDate->diff($endDate)->days + 1;
        $totalPrice = $days * $validated['daily_rate'];

        DB::beginTransaction();
        try {
            // Créer la location
            $rental = Rental::create([
                'company_id' => $vehicle->company_id,
                'vehicle_id' => $validated['vehicle_id'],
                'customer_name' => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'],
                'customer_email' => $validated['customer_email'] ?? null,
                'customer_address' => $validated['customer_address'] ?? null,
                'customer_id_card' => $validated['customer_id_card'] ?? null,
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'start_mileage' => $validated['start_mileage'],
                'daily_rate' => $validated['daily_rate'],
                'total_price' => $totalPrice,
                'deposit_amount' => $validated['deposit_amount'],
                'paid_amount' => $validated['paid_amount'] ?? 0,
                'notes' => $validated['notes'] ?? null,
                'status' => 'ongoing',
            ]);

            // IMPORTANT : Changer le statut du véhicule en "rented"
            $vehicle->status = 'rented';
            $vehicle->save();

            // Vérifier que ça a bien été sauvegardé
            $vehicle->refresh();

            \Log::info('Location créée', [
                'rental_id' => $rental->id,
                'vehicle_id' => $vehicle->id,
                'new_vehicle_status' => $vehicle->status
            ]);

            DB::commit();

            // Recharger les relations
            $rental->load(['vehicle', 'company']);

            return response()->json($rental, 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur création location: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la création: ' . $e->getMessage()], 500);
        }
    }

    // Voir une location
    public function show(Request $request, Rental $rental)
    {
        // Vérifier que la location appartient à la company
        if ($request->user()->role !== 'super_admin' && $rental->company_id !== $request->user()->company_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        return response()->json($rental->load(['vehicle', 'company']));
    }

    // Modifier une location
    public function update(Request $request, Rental $rental)
    {
        // Vérifier que la location appartient à la company
        if ($request->user()->role !== 'super_admin' && $rental->company_id !== $request->user()->company_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        // On ne peut modifier que les locations en cours
        if ($rental->status !== 'ongoing') {
            return response()->json(['message' => 'Cette location ne peut pas être modifiée'], 400);
        }

        $validated = $request->validate([
            'customer_name' => 'string|max:255',
            'customer_phone' => 'string|max:20',
            'customer_email' => 'nullable|email',
            'customer_address' => 'nullable|string',
            'customer_id_card' => 'nullable|string',
            'end_date' => 'date|after_or_equal:start_date',
            'paid_amount' => 'numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        // Recalculer le prix si la date de fin change
        if (isset($validated['end_date'])) {
            $startDate = new \DateTime($rental->start_date);
            $endDate = new \DateTime($validated['end_date']);
            $days = $startDate->diff($endDate)->days + 1;
            $validated['total_price'] = $days * $rental->daily_rate;
        }

        $rental->update($validated);

        return response()->json($rental->load(['vehicle', 'company']));
    }

    // Compléter une location (retour du véhicule)
    public function complete(Request $request, Rental $rental)
    {
        // Vérifier que la location appartient à la company
        if ($request->user()->role !== 'super_admin' && $rental->company_id !== $request->user()->company_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if ($rental->status !== 'ongoing') {
            return response()->json(['message' => 'Cette location est déjà terminée'], 400);
        }

        $validated = $request->validate([
            'end_mileage' => 'required|integer|min:' . $rental->start_mileage,
            'paid_amount' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            // Mettre à jour la location
            $rental->update([
                'end_mileage' => $validated['end_mileage'],
                'paid_amount' => $validated['paid_amount'] ?? $rental->paid_amount,
                'status' => 'completed',
            ]);

            // Remettre le véhicule en disponible et mettre à jour le kilométrage
            $rental->vehicle->update([
                'status' => 'available',
                'current_mileage' => $validated['end_mileage'],
            ]);

            DB::commit();

            return response()->json($rental->load(['vehicle', 'company']));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la complétion'], 500);
        }
    }

    // Annuler une location
    public function cancel(Request $request, Rental $rental)
    {
        // Vérifier que la location appartient à la company
        if ($request->user()->role !== 'super_admin' && $rental->company_id !== $request->user()->company_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if ($rental->status !== 'ongoing') {
            return response()->json(['message' => 'Cette location ne peut pas être annulée'], 400);
        }

        DB::beginTransaction();
        try {
            // Annuler la location
            $rental->update(['status' => 'cancelled']);

            // Remettre le véhicule en disponible
            $rental->vehicle->update(['status' => 'available']);

            DB::commit();

            return response()->json($rental->load(['vehicle', 'company']));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de l\'annulation'], 500);
        }
    }

    // Supprimer une location (seulement si annulée)
    public function destroy(Request $request, Rental $rental)
    {
        // Vérifier que la location appartient à la company
        if ($request->user()->role !== 'super_admin' && $rental->company_id !== $request->user()->company_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        // On ne peut supprimer que les locations annulées
        if ($rental->status !== 'cancelled') {
            return response()->json(['message' => 'Seules les locations annulées peuvent être supprimées'], 400);
        }

        $rental->delete();

        return response()->json(['message' => 'Location supprimée']);
    }

    // Historique des locations d'un véhicule
    public function vehicleHistory(Request $request, Vehicle $vehicle)
    {
        // Vérifier que le véhicule appartient à la company
        if ($request->user()->role !== 'super_admin' && $vehicle->company_id !== $request->user()->company_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $rentals = Rental::where('vehicle_id', $vehicle->id)
            ->with('vehicle')
            ->latest()
            ->get();

        // Calculer les statistiques
        $totalRevenue = $rentals->where('status', 'completed')->sum('total_price');
        $totalDistance = $rentals->where('status', 'completed')->sum(function ($rental) {
            return $rental->distance ?? 0;
        });
        $totalRentals = $rentals->where('status', 'completed')->count();

        return response()->json([
            'rentals' => $rentals,
            'stats' => [
                'total_revenue' => $totalRevenue,
                'total_distance' => $totalDistance,
                'total_rentals' => $totalRentals,
            ],
        ]);
    }
}