<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use App\Models\Rental;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class RentalController extends Controller
{
    // Lister toutes les locations
    public function index(Request $request)
    {
        $companyId = $request->user()->role === 'super_admin'
            ? null
            : $request->user()->company_id;

        $query = Rental::with(['vehicle', 'company', 'files']);

        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        $rentals = $query->latest()->get();

        return response()->json($rentals);
    }

    // Créer une location
    public function store(Request $request)
    {
        if (!$request->user()->hasPermission('create_rentals')) {
            return response()->json(['message' => 'Permission refus�e : create_rentals'], 403);
        }

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
            // Générer les identifiants locataire si email fourni
            $pin = null;
            $renterUserId = null;
            if (!empty($validated['customer_email'])) {
                $pin = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
                $renterUser = User::firstOrCreate(
                    ['email' => $validated['customer_email']],
                    [
                        'name'       => $validated['customer_name'],
                        'password'   => bcrypt($pin),
                        'role'       => 'renter',
                        'company_id' => $vehicle->company_id,
                        'is_active'  => true,
                    ]
                );
                // Si l'utilisateur existait déjà, mettre à jour le mot de passe
                if (!$renterUser->wasRecentlyCreated) {
                    $renterUser->update(['password' => bcrypt($pin)]);
                }
                $renterUserId = $renterUser->id;
            }

            // Créer la location
            $rental = Rental::create([
                'company_id'      => $vehicle->company_id,
                'vehicle_id'      => $validated['vehicle_id'],
                'renter_user_id'  => $renterUserId,
                'renter_pin'      => $pin,
                'customer_name'   => $validated['customer_name'],
                'customer_phone'  => $validated['customer_phone'],
                'customer_email'  => $validated['customer_email'] ?? null,
                'customer_address'=> $validated['customer_address'] ?? null,
                'customer_id_card'=> $validated['customer_id_card'] ?? null,
                'start_date'      => $validated['start_date'],
                'end_date'        => $validated['end_date'],
                'start_mileage'   => $validated['start_mileage'],
                'daily_rate'      => $validated['daily_rate'],
                'total_price'     => $totalPrice,
                'deposit_amount'  => $validated['deposit_amount'],
                'paid_amount'     => $validated['paid_amount'] ?? 0,
                'notes'           => $validated['notes'] ?? null,
                'status'          => 'ongoing',
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

            // Notification in-app aux admins
            AppNotification::notifyCompanyAdmins(
                $vehicle->company_id,
                'rental_created',
                'Nouvelle location créée',
                "Location de {$vehicle->brand} {$vehicle->model} pour {$rental->customer_name}",
                ['rental_id' => $rental->id, 'vehicle_id' => $vehicle->id]
            );

            // Recharger les relations
            $rental->load(['vehicle', 'company']);
            $accessCredentials = $pin ? ['email' => $validated['customer_email'], 'pin' => $pin] : null;

            // Email aux admins de l'entreprise
            $startDate = \Carbon\Carbon::parse($rental->start_date)->format('d/m/Y');
            $endDate   = \Carbon\Carbon::parse($rental->end_date)->format('d/m/Y');
            $days      = \Carbon\Carbon::parse($rental->start_date)->diffInDays(\Carbon\Carbon::parse($rental->end_date)) + 1;

            $rentalData = [
                'vehicle'         => "{$vehicle->brand} {$vehicle->model} {$vehicle->year}",
                'registration'    => $vehicle->registration_number,
                'customer_name'   => $rental->customer_name,
                'customer_phone'  => $rental->customer_phone,
                'customer_email'  => $rental->customer_email,
                'start_date'      => $startDate,
                'end_date'        => $endDate,
                'days'            => $days,
                'start_mileage'   => $rental->start_mileage,
                'daily_rate'      => $rental->daily_rate,
                'total'           => $rental->total_price,
                'deposit'         => $rental->deposit_amount,
                'paid'            => $rental->paid_amount,
                'notes'           => $rental->notes,
                'company'         => $rental->company->name ?? '',
                'created_at'      => now()->format('d/m/Y à H:i'),
            ];

            $admins = User::where('company_id', $vehicle->company_id)
                ->where('role', 'company_admin')
                ->get();

            $apiKey = env('BREVO_API_KEY');
            if ($apiKey) {
                foreach ($admins as $admin) {
                    if (!$admin->notifications_email || !$admin->notifications_rental) {
                        continue;
                    }
                    try {
                        $htmlContent = view('emails.rental_created', ['rentalData' => $rentalData])->render();
                        Http::withHeaders([
                            'api-key'      => $apiKey,
                            'Content-Type' => 'application/json',
                        ])->post('https://api.brevo.com/v3/smtp/email', [
                            'sender'      => ['name' => 'FleetRental', 'email' => env('BREVO_SENDER_EMAIL', 'a2fd67001@smtp-brevo.com')],
                            'to'          => [['email' => $admin->email, 'name' => $admin->name]],
                            'subject'     => '🚗 Nouvelle location créée — ' . $rentalData['vehicle'],
                            'htmlContent' => $htmlContent,
                        ]);
                        \Log::info("Email envoyé à {$admin->email}");
                    } catch (\Exception $e) {
                        \Log::warning("Email non envoyé à {$admin->email}: " . $e->getMessage());
                    }
                }
            }

            $response = $rental->toArray();
            if ($accessCredentials) {
                $response['access_credentials'] = $accessCredentials;
            }
            return response()->json($response, 201);

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
        if (!$request->user()->hasPermission('edit_rentals')) {
            return response()->json(['message' => 'Permission refus�e : edit_rentals'], 403);
        }

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
        if (!$request->user()->hasPermission('complete_rentals')) {
            return response()->json(['message' => 'Permission refus�e : complete_rentals'], 403);
        }

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

            // Notification aux admins
            AppNotification::notifyCompanyAdmins(
                $rental->company_id,
                'rental_completed',
                'Location terminée',
                "Retour de {$rental->vehicle->brand} {$rental->vehicle->model} — {$rental->customer_name}",
                ['rental_id' => $rental->id, 'vehicle_id' => $rental->vehicle_id]
            );

            return response()->json($rental->load(['vehicle', 'company']));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la complétion'], 500);
        }
    }

    // Annuler une location
    public function cancel(Request $request, Rental $rental)
    {
        if (!$request->user()->hasPermission('cancel_rentals')) {
            return response()->json(['message' => 'Permission refus�e : cancel_rentals'], 403);
        }

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

            // Notification aux admins
            AppNotification::notifyCompanyAdmins(
                $rental->company_id,
                'rental_cancelled',
                'Location annulée',
                "Annulation location de {$rental->vehicle->brand} {$rental->vehicle->model} — {$rental->customer_name}",
                ['rental_id' => $rental->id, 'vehicle_id' => $rental->vehicle_id]
            );

            return response()->json($rental->load(['vehicle', 'company']));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de l\'annulation'], 500);
        }
    }

    // Supprimer une location (seulement si annulée)
    public function destroy(Request $request, Rental $rental)
    {
        if (!$request->user()->hasPermission('delete_rentals')) {
            return response()->json(['message' => 'Permission refus�e : delete_rentals'], 403);
        }

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

    // Générer le contrat PDF d'une location
    public function contract(Request $request, Rental $rental)
    {
        if (!$request->user()->hasPermission('view_rentals')) {
            return response()->json(['message' => 'Permission refusée : view_rentals'], 403);
        }

        if ($request->user()->role !== 'super_admin' && $rental->company_id !== $request->user()->company_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $rental->load(['vehicle', 'company']);

        $pdf = app('dompdf.wrapper');
        $pdf->loadView('pdf.rental_contract', ['rental' => $rental]);
        $pdf->setPaper('A4', 'portrait');

        $filename = 'contrat-location-' . str_pad($rental->id, 6, '0', STR_PAD_LEFT) . '.pdf';

        return $pdf->download($filename);
    }

    // Exporter les locations en CSV
    public function exportCsv(Request $request)
    {
        if (!$request->user()->hasPermission('view_rentals')) {
            return response()->json(['message' => 'Permission refusée : view_rentals'], 403);
        }

        $companyId = $request->user()->role === 'super_admin'
            ? null
            : $request->user()->company_id;

        $query = Rental::with(['vehicle', 'company']);

        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $rentals = $query->latest()->get();

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="locations-' . now()->format('Y-m-d') . '.csv"',
            'Cache-Control'       => 'no-cache, no-store, must-revalidate',
            'Pragma'              => 'no-cache',
        ];

        $callback = function () use ($rentals) {
            $file = fopen('php://output', 'w');
            // BOM UTF-8 pour Excel
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($file, [
                'ID', 'Client', 'Téléphone', 'Email', 'CIN/Passeport',
                'Véhicule', 'Immatriculation',
                'Date début', 'Date fin', 'Jours',
                'Tarif/jour (MAD)', 'Total (MAD)', 'Caution (MAD)', 'Payé (MAD)', 'Reste (MAD)',
                'Km départ', 'Km retour',
                'Statut', 'Créé le', 'Notes',
            ], ';');

            $statusLabels = ['ongoing' => 'En cours', 'completed' => 'Terminée', 'cancelled' => 'Annulée'];

            foreach ($rentals as $r) {
                $start     = \Carbon\Carbon::parse($r->start_date);
                $end       = \Carbon\Carbon::parse($r->end_date);
                $days      = $start->diffInDays($end) + 1;
                $remaining = max(0, $r->total_price - $r->paid_amount);

                fputcsv($file, [
                    $r->id,
                    $r->customer_name,
                    $r->customer_phone,
                    $r->customer_email ?? '',
                    $r->customer_id_card ?? '',
                    $r->vehicle ? "{$r->vehicle->brand} {$r->vehicle->model} {$r->vehicle->year}" : '',
                    $r->vehicle?->registration_number ?? '',
                    $start->format('d/m/Y'),
                    $end->format('d/m/Y'),
                    $days,
                    number_format($r->daily_rate, 2, '.', ''),
                    number_format($r->total_price, 2, '.', ''),
                    number_format($r->deposit_amount, 2, '.', ''),
                    number_format($r->paid_amount, 2, '.', ''),
                    number_format($remaining, 2, '.', ''),
                    $r->start_mileage ?? '',
                    $r->end_mileage ?? '',
                    $statusLabels[$r->status] ?? $r->status,
                    $r->created_at->format('d/m/Y H:i'),
                    $r->notes ?? '',
                ], ';');
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
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