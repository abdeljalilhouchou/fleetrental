<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json(['message' => 'Identifiants invalides'], 401);
        }

        $user = Auth::user();

        if (!$user->is_active) {
            Auth::logout();
            return response()->json(['message' => 'Votre compte a été désactivé. Contactez votre administrateur.'], 403);
        }

        $rememberMe = $request->boolean('remember_me', false);
        $expiresAt  = $rememberMe ? now()->addDays(30) : now()->addDay();
        $token      = $user->createToken('auth_token', ['*'], $expiresAt)->plainTextToken;

        // Détermine la redirection selon le rôle
        $redirect = match ($user->role) {
            'super_admin'   => '/super-admin/dashboard',
            'company_admin' => '/dashboard',
            'employee'      => '/vehicles',
            default         => '/dashboard',
        };

        return response()->json([
            'token'      => $token,
            'user'       => $user->load('company'),
            'redirect'   => $redirect,
            'expires_in' => $rememberMe ? 30 * 24 * 3600 : 24 * 3600, // secondes
        ]);
    }

    public function myPermissions(Request $request)
    {
        $user = $request->user();

        // super_admin a toutes les permissions
        if ($user->isSuperAdmin()) {
            $all = \App\Models\Permission::pluck('name');
            return response()->json($all);
        }

        // Récupérer toutes les permissions et filtrer celles accordées
        $all = \App\Models\Permission::pluck('name');
        $granted = $all->filter(fn($name) => $user->hasPermission($name))->values();

        return response()->json($granted);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnexion réussie']);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('company');

        return response()->json([
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'role'       => $user->role,
            'company'    => $user->company,
            'phone'      => $user->phone,
            'address'    => $user->address,
            'birthdate'  => $user->birthdate,
            'avatar'     => $user->avatar,
            'theme'      => $user->theme,
            'language'   => $user->language,
            'notifications_email'       => $user->notifications_email,
            'notifications_maintenance' => $user->notifications_maintenance,
            'notifications_rental'      => $user->notifications_rental,
        ]);
    }
}
