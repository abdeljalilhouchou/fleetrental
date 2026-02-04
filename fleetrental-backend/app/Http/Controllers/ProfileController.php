<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:500'],
            'birthdate' => ['nullable', 'date'],
            'password' => ['nullable', 'string', 'min:6'],
            'current_password' => ['required_with:password'],
        ]);

        // Vérifier le mot de passe actuel si un nouveau est fourni
        if (isset($validated['password'])) {
            if (!Hash::check($validated['current_password'], $user->password)) {
                return response()->json(['message' => 'Le mot de passe actuel est incorrect'], 422);
            }
            $user->password = Hash::make($validated['password']);
            unset($validated['password']);
            unset($validated['current_password']);
        }

        $user->update($validated);

        return response()->json([
            'message' => 'Profil mis à jour avec succès',
            'user' => $user->load('company'),
        ]);
    }

    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
        ]);

        $user = $request->user();

        // Supprimer l'ancien avatar s'il existe
        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }

        // Stocker le nouvel avatar
        $path = $request->file('avatar')->store('avatars', 'public');
        $user->avatar = $path;
        $user->save();

        // Générer l'URL complète
        $user->avatar_url = Storage::url($path);

        return response()->json([
            'message' => 'Avatar mis à jour avec succès',
            'user' => $user->load('company'),
        ]);
    }

    public function removeAvatar(Request $request)
    {
        $user = $request->user();

        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }

        $user->avatar = null;
        $user->save();

        return response()->json([
            'message' => 'Avatar supprimé avec succès',
            'user' => $user->load('company'),
        ]);
    }

    public function updatePreferences(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'theme' => ['nullable', 'string', 'in:light,dark'],
            'language' => ['nullable', 'string', 'in:fr,en'],
            'notifications_email' => ['nullable', 'boolean'],
            'notifications_maintenance' => ['nullable', 'boolean'],
            'notifications_rental' => ['nullable', 'boolean'],
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Préférences mises à jour avec succès',
            'user' => $user->load('company'),
        ]);
    }

    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Le mot de passe actuel est incorrect',
                'errors' => ['current_password' => ['Le mot de passe actuel est incorrect']]
            ], 422);
        }

        $user->password = Hash::make($validated['password']);
        $user->save();

        return response()->json([
            'message' => 'Mot de passe mis à jour avec succès',
            'user' => $user->load('company'),
        ]);
    }
}
