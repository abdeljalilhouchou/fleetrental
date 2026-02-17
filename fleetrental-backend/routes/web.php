<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('welcome');
});

// Serve storage files without symlink (needed for Railway ephemeral filesystem)
Route::get('/storage/{path}', function (string $path) {
    if (!Storage::disk('public')->exists($path)) {
        abort(404);
    }

    $file = Storage::disk('public')->get($path);
    $mimeType = Storage::disk('public')->mimeType($path);

    return response($file, 200)->header('Content-Type', $mimeType)
        ->header('Cache-Control', 'public, max-age=86400');
})->where('path', '.*');

