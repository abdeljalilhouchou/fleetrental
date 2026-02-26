<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use App\Models\VehicleDocument;
use Illuminate\Http\Request;
use Carbon\Carbon;

class VehicleDocumentController extends Controller
{
    private function canAccessVehicle(Request $request, Vehicle $vehicle): bool
    {
        $user = $request->user();
        return $user->role === 'super_admin' || $vehicle->company_id === $user->company_id;
    }

    // Liste les documents d'un véhicule (sans le contenu fichier pour économiser la bande passante)
    public function index(Request $request, Vehicle $vehicle)
    {
        if (!$this->canAccessVehicle($request, $vehicle)) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $docs = $vehicle->documents()
            ->select(['id', 'vehicle_id', 'type', 'name', 'file_name', 'mime_type', 'expiry_date', 'notes', 'created_at'])
            ->orderBy('type')
            ->get()
            ->map(function ($doc) {
                $doc->expiry_status = $this->computeExpiryStatus($doc->expiry_date);
                return $doc;
            });

        return response()->json($docs);
    }

    // Ajouter un document
    public function store(Request $request, Vehicle $vehicle)
    {
        if (!$request->user()->hasPermission('manage_vehicle_documents')) {
            return response()->json(['message' => 'Permission refus�e : manage_vehicle_documents'], 403);
        }

        if (!$this->canAccessVehicle($request, $vehicle)) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $validated = $request->validate([
            'type'        => 'required|in:carte_grise,assurance,controle_technique,vignette,autre',
            'name'        => 'required|string|max:255',
            'file_data'   => 'nullable|string',
            'file_name'   => 'nullable|string|max:255',
            'mime_type'   => 'nullable|string|max:100',
            'expiry_date' => 'nullable|date',
            'notes'       => 'nullable|string|max:1000',
        ]);

        $doc = $vehicle->documents()->create($validated);

        // Retourner sans file_data pour économiser la bande passante
        $response = $doc->only(['id', 'vehicle_id', 'type', 'name', 'file_name', 'mime_type', 'expiry_date', 'notes', 'created_at']);
        $response['expiry_status'] = $this->computeExpiryStatus($doc->expiry_date);

        return response()->json($response, 201);
    }

    // Télécharger un document (retourne le contenu base64)
    public function download(Request $request, VehicleDocument $document)
    {
        if (!$this->canAccessVehicle($request, $document->vehicle)) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        return response()->json([
            'file_data' => $document->file_data,
            'file_name' => $document->file_name,
            'mime_type' => $document->mime_type,
        ]);
    }

    // Supprimer un document
    public function destroy(Request $request, VehicleDocument $document)
    {
        if (!$request->user()->hasPermission('manage_vehicle_documents')) {
            return response()->json(['message' => 'Permission refus�e : manage_vehicle_documents'], 403);
        }

        if (!$this->canAccessVehicle($request, $document->vehicle)) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $document->delete();

        return response()->json(['message' => 'Document supprimé']);
    }

    private function computeExpiryStatus($expiryDate): string
    {
        if (!$expiryDate) return 'valid';

        $expiry = Carbon::parse($expiryDate)->startOfDay();
        $today  = Carbon::today();

        if ($expiry->lt($today)) return 'expired';
        if ($expiry->diffInDays($today) <= 30) return 'expiring';

        return 'valid';
    }
}
