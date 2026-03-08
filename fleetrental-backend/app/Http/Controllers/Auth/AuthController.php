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
            'token'       => $token,
            'user'        => $user->load('company'),
            'permissions' => $this->getUserPermissions($user),
            'redirect'    => $redirect,
            'expires_in'  => $rememberMe ? 30 * 24 * 3600 : 24 * 3600,
        ]);
    }

    private function getUserPermissions($user): array
    {
        // Super admin : toutes les permissions sans exception
        if ($user->isSuperAdmin()) {
            return \App\Models\Permission::pluck('name')->toArray();
        }

        // Pour tous les autres rôles (y compris company_admin) :
        // on part des permissions du rôle, puis on applique les overrides individuels.

        // 1) Permissions du rôle
        $role = $user->roleModel()->with('permissions')->first();
        $rolePerms = $role ? $role->permissions->pluck('name') : collect();

        // 2) Overrides individuels
        $overrides = $user->permissionOverrides()->with('permission')->get();

        // Appliquer les overrides
        $result = $rolePerms;
        foreach ($overrides as $override) {
            if (!$override->permission) continue;
            $name = $override->permission->name;
            if ($override->granted) {
                $result = $result->push($name);
            } else {
                $result = $result->reject(fn($n) => $n === $name);
            }
        }

        return $result->unique()->values()->toArray();
    }

    public function myPermissions(Request $request)
    {
        return response()->json($this->getUserPermissions($request->user()));
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
            'id'          => $user->id,
            'name'        => $user->name,
            'email'       => $user->email,
            'role'        => $user->role,
            'company'     => $user->company,
            'phone'       => $user->phone,
            'address'     => $user->address,
            'birthdate'   => $user->birthdate,
            'avatar'      => $user->avatar,
            'theme'       => $user->theme,
            'language'    => $user->language,
            'permissions' => $this->getUserPermissions($user),
            'notifications_email'       => $user->notifications_email,
            'notifications_maintenance' => $user->notifications_maintenance,
            'notifications_rental'      => $user->notifications_rental,
        ]);
    }
}
