<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Permission;
use App\Models\User;
use App\Models\UserPermissionOverride;
use Illuminate\Http\Request;

class RolePermissionController extends Controller
{
    // ─── Rôles ────────────────────────────────────────────────────────

    // Retourne tous les rôles avec leurs permissions
    public function indexRoles()
    {
        $roles = Role::with('permissions')->get()->map(function ($role) {
            return [
                'id'            => $role->id,
                'name'          => $role->name,
                'display_name'  => $role->display_name,
                'description'   => $role->description,
                'is_system'     => $role->is_system,
                'permissions'   => $role->permissions->pluck('name'),
                'total_count'   => $role->permissions->count(),
            ];
        });

        return response()->json($roles);
    }

    // Retourne toutes les permissions disponibles groupées par module
    public function indexPermissions()
    {
        $permissions = Permission::all()->groupBy('module')->map(function ($group) {
            return $group->map(fn($p) => [
                'id'           => $p->id,
                'name'         => $p->name,
                'display_name' => $p->display_name,
                'description'  => $p->description,
            ])->values();
        });

        return response()->json($permissions);
    }

    // Met à jour les permissions d'un rôle
    public function updateRolePermissions(Request $request, Role $role)
    {
        $validated = $request->validate([
            'permissions'   => 'required|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $permIds = Permission::whereIn('name', $validated['permissions'])->pluck('id');
        $role->permissions()->sync($permIds);

        return response()->json([
            'message'     => 'Permissions du rôle mises à jour',
            'permissions' => $role->permissions()->pluck('name'),
        ]);
    }

    // ─── Overrides utilisateur ────────────────────────────────────────

    // Retourne les overrides d'un utilisateur + état effectif de chaque permission
    public function userPermissions(Request $request, User $user)
    {
        $currentUser = $request->user();

        // Seul super_admin peut voir les permissions des autres
        if (!$currentUser->isSuperAdmin()) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $allPermissions = Permission::all();
        $rolePermissions = collect();

        if ($user->role !== 'super_admin') {
            $role = $user->roleModel()->with('permissions')->first();
            $rolePermissions = $role ? $role->permissions->pluck('name') : collect();
        }

        $overrides = UserPermissionOverride::where('user_id', $user->id)
            ->with('permission')
            ->get()
            ->keyBy('permission.name');

        $result = $allPermissions->groupBy('module')->map(function ($group) use ($rolePermissions, $overrides, $user) {
            return $group->map(function ($perm) use ($rolePermissions, $overrides, $user) {
                $override = $overrides->get($perm->name);
                $fromRole = $rolePermissions->contains($perm->name);

                if ($user->role === 'super_admin') {
                    $state = 'granted';
                } elseif ($override !== null) {
                    $state = $override->granted ? 'granted' : 'revoked';
                } else {
                    $state = $fromRole ? 'inherited_granted' : 'inherited_denied';
                }

                return [
                    'id'           => $perm->id,
                    'name'         => $perm->name,
                    'display_name' => $perm->display_name,
                    'description'  => $perm->description,
                    'state'        => $state, // granted | revoked | inherited_granted | inherited_denied
                ];
            })->values();
        });

        return response()->json($result);
    }

    // Sauvegarde les overrides d'un utilisateur
    public function updateUserPermissions(Request $request, User $user)
    {
        $currentUser = $request->user();

        if (!$currentUser->isSuperAdmin()) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $validated = $request->validate([
            'overrides'             => 'required|array',
            'overrides.*.name'      => 'required|string|exists:permissions,name',
            'overrides.*.state'     => 'required|in:granted,revoked,inherited',
        ]);

        // Supprimer tous les overrides existants pour cet utilisateur
        UserPermissionOverride::where('user_id', $user->id)->delete();

        // Recréer uniquement les overrides explicites (granted ou revoked)
        foreach ($validated['overrides'] as $item) {
            if ($item['state'] === 'inherited') continue;

            $perm = Permission::where('name', $item['name'])->first();
            if (!$perm) continue;

            UserPermissionOverride::create([
                'user_id'       => $user->id,
                'permission_id' => $perm->id,
                'granted'       => $item['state'] === 'granted',
            ]);
        }

        return response()->json(['message' => 'Permissions utilisateur mises à jour']);
    }
}
