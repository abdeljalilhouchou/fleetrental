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

        $user  = Auth::user();
        $token = $user->createToken('auth_token')->plainTextToken;

        // Détermine la redirection selon le rôle
        $redirect = match ($user->role) {
            'super_admin'   => '/super-admin/dashboard',
            'company_admin' => '/dashboard',
            'employee'      => '/vehicles',
            default         => '/dashboard',
        };

        return response()->json([
            'token'    => $token,
            'user'     => $user->load('company'),
            'redirect' => $redirect,
        ]);
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
            'id'       => $user->id,
            'name'     => $user->name,
            'email'    => $user->email,
            'role'     => $user->role,
            'company'  => $user->company,
        ]);
    }
}
