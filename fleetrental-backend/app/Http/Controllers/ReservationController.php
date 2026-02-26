<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

/**
 * ReservationController — gestion des réservations côté admin
 * Accessible aux rôles company_admin, fleet_manager, rental_agent
 */
class ReservationController extends Controller
{
    // ─── Lister les réservations de l'entreprise ─────────────────
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Reservation::with(['vehicle', 'company'])
            ->orderBy('created_at', 'desc');

        if ($user->role !== 'super_admin') {
            $query->where('company_id', $user->company_id);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $reservations = $query->get();

        return response()->json($reservations);
    }

    // ─── Détail d'une réservation ────────────────────────────────
    public function show(Request $request, Reservation $reservation)
    {
        if ($request->user()->role !== 'super_admin'
            && $reservation->company_id !== $request->user()->company_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        return response()->json($reservation->load(['vehicle', 'company']));
    }

    // ─── Confirmer une réservation ───────────────────────────────
    public function confirm(Request $request, Reservation $reservation)
    {
        if ($request->user()->role !== 'super_admin'
            && $reservation->company_id !== $request->user()->company_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if ($reservation->status !== 'pending') {
            return response()->json(['message' => 'Seules les réservations en attente peuvent être confirmées'], 400);
        }

        $reservation->update(['status' => 'confirmed']);

        // Envoyer un email de confirmation au client si email fourni
        $this->sendStatusEmail($reservation, 'confirmed');

        return response()->json($reservation->load(['vehicle', 'company']));
    }

    // ─── Rejeter une réservation ─────────────────────────────────
    public function reject(Request $request, Reservation $reservation)
    {
        if ($request->user()->role !== 'super_admin'
            && $reservation->company_id !== $request->user()->company_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if ($reservation->status !== 'pending') {
            return response()->json(['message' => 'Seules les réservations en attente peuvent être refusées'], 400);
        }

        $validated = $request->validate([
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        $reservation->update([
            'status'           => 'rejected',
            'rejection_reason' => $validated['rejection_reason'] ?? null,
        ]);

        // Envoyer un email de rejet au client si email fourni
        $this->sendStatusEmail($reservation, 'rejected');

        return response()->json($reservation->load(['vehicle', 'company']));
    }

    // ─── Annuler une réservation confirmée ───────────────────────
    public function cancel(Request $request, Reservation $reservation)
    {
        if ($request->user()->role !== 'super_admin'
            && $reservation->company_id !== $request->user()->company_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if (!in_array($reservation->status, ['pending', 'confirmed'])) {
            return response()->json(['message' => 'Cette réservation ne peut pas être annulée'], 400);
        }

        $reservation->update(['status' => 'cancelled']);

        return response()->json($reservation->load(['vehicle', 'company']));
    }

    // ─── Email de statut au client (via Brevo) ───────────────────
    private function sendStatusEmail(Reservation $reservation, string $status): void
    {
        if (!$reservation->customer_email) return;

        $apiKey = env('BREVO_API_KEY');
        if (!$apiKey) return;

        $reservation->load(['vehicle', 'company']);

        $days = $reservation->start_date->diffInDays($reservation->end_date) + 1;
        $total = $days * $reservation->vehicle->daily_rate;

        if ($status === 'confirmed') {
            $subject  = '✅ Réservation confirmée — ' . $reservation->reference;
            $htmlBody = "
                <h2 style='color:#16a34a;'>Votre réservation est confirmée !</h2>
                <p>Bonjour <strong>{$reservation->customer_name}</strong>,</p>
                <p>Votre demande de réservation a été <strong>confirmée</strong> par {$reservation->company->name}.</p>
                <table style='border-collapse:collapse;width:100%;font-size:14px;'>
                    <tr><td style='padding:6px;color:#6b7280;'>Référence</td><td style='padding:6px;font-weight:bold;'>{$reservation->reference}</td></tr>
                    <tr><td style='padding:6px;color:#6b7280;'>Véhicule</td><td style='padding:6px;'>{$reservation->vehicle->brand} {$reservation->vehicle->model} {$reservation->vehicle->year}</td></tr>
                    <tr><td style='padding:6px;color:#6b7280;'>Du</td><td style='padding:6px;'>{$reservation->start_date->format('d/m/Y')}</td></tr>
                    <tr><td style='padding:6px;color:#6b7280;'>Au</td><td style='padding:6px;'>{$reservation->end_date->format('d/m/Y')}</td></tr>
                    <tr><td style='padding:6px;color:#6b7280;'>Durée</td><td style='padding:6px;'>{$days} jour(s)</td></tr>
                    <tr><td style='padding:6px;color:#6b7280;'>Montant estimé</td><td style='padding:6px;font-weight:bold;color:#16a34a;'>" . number_format($total, 2) . " MAD</td></tr>
                </table>
                <p style='margin-top:16px;'>Contactez-nous : <strong>{$reservation->company->phone}</strong></p>
                <p style='color:#6b7280;font-size:12px;'>FleetRental — Gestion de flotte</p>
            ";
        } else {
            $reason   = $reservation->rejection_reason ? "<p><strong>Motif :</strong> {$reservation->rejection_reason}</p>" : '';
            $subject  = '❌ Réservation refusée — ' . $reservation->reference;
            $htmlBody = "
                <h2 style='color:#dc2626;'>Votre réservation a été refusée</h2>
                <p>Bonjour <strong>{$reservation->customer_name}</strong>,</p>
                <p>Nous sommes désolés, votre demande de réservation <strong>{$reservation->reference}</strong> a été refusée.</p>
                {$reason}
                <p>N'hésitez pas à nous contacter : <strong>{$reservation->company->phone}</strong></p>
                <p style='color:#6b7280;font-size:12px;'>FleetRental — Gestion de flotte</p>
            ";
        }

        try {
            Http::withHeaders([
                'api-key'      => $apiKey,
                'Content-Type' => 'application/json',
            ])->post('https://api.brevo.com/v3/smtp/email', [
                'sender'      => ['name' => $reservation->company->name, 'email' => env('BREVO_SENDER_EMAIL', 'a2fd67001@smtp-brevo.com')],
                'to'          => [['email' => $reservation->customer_email, 'name' => $reservation->customer_name]],
                'subject'     => $subject,
                'htmlContent' => $htmlBody,
            ]);
        } catch (\Exception $e) {
            \Log::warning("Email réservation non envoyé : " . $e->getMessage());
        }
    }
}
