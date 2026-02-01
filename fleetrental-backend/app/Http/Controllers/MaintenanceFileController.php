<?php

namespace App\Http\Controllers;

use App\Models\Maintenance;
use App\Models\MaintenanceFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MaintenanceFileController extends Controller
{
    public function store(Request $request, Maintenance $maintenance)
    {
        $request->validate([
            'file' => ['required', 'file', 'max:10240'], // 10MB max
        ]);

        $file = $request->file('file');
        $path = $file->store('maintenance_files', 'public');

        $maintenanceFile = MaintenanceFile::create([
            'maintenance_id' => $maintenance->id,
            'file_path'      => $path,
            'file_name'      => $file->getClientOriginalName(),
            'file_type'      => $file->getMimeType(),
            'file_size'      => $file->getSize(),
        ]);

        return response()->json($maintenanceFile, 201);
    }

    public function destroy(Maintenance $maintenance, MaintenanceFile $file)
    {
        Storage::disk('public')->delete($file->file_path);
        $file->delete();

        return response()->json(['message' => 'Fichier supprimé']);
    }
}