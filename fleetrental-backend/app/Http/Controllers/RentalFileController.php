<?php

namespace App\Http\Controllers;

use App\Models\Rental;
use App\Models\RentalFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RentalFileController extends Controller
{
    public function store(Request $request, Rental $rental)
    {
        $request->validate([
            'file' => ['required', 'file', 'max:10240'], // 10MB max
        ]);

        $file = $request->file('file');
        $path = $file->store('rental_files', 'public');

        $rentalFile = RentalFile::create([
            'rental_id' => $rental->id,
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
        ]);

        return response()->json($rentalFile, 201);
    }

    public function destroy(Rental $rental, RentalFile $file)
    {
        Storage::disk('public')->delete($file->file_path);
        $file->delete();

        return response()->json(['message' => 'Fichier supprimé']);
    }
}
