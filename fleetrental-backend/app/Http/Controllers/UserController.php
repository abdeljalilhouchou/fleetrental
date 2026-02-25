<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            // Super Admin voit tous les users
            $users = User::with('company')->get();
        } else {
            // Company Admin voit SEULEMENT les users de son entreprise (pas les super_admin)
            $users = User::where('company_id', $user->company_id)
                ->where('role', '!=', 'super_admin')
                ->with('company')
                ->get();
        }

        return response()->json($users);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        // Déterminer les rôles autorisés
        $allowedRoles = $user->isSuperAdmin()
            ? ['super_admin', 'company_admin', 'fleet_manager', 'rental_agent', 'mechanic', 'employee']
            : ['fleet_manager', 'rental_agent', 'mechanic', 'employee'];

        $rules = [
            'name'       => ['required', 'string', 'max:255'],
            'email'      => ['required', 'email', 'unique:users,email'],
            'password'   => ['required', 'string', 'min:6'],
            'role'       => ['required', Rule::in($allowedRoles)],
        ];

        // Si super_admin, il peut optionnellement choisir l'entreprise
        if ($user->isSuperAdmin()) {
            $rules['company_id'] = ['nullable', 'exists:companies,id'];
        }

        $data = $request->validate($rules);

        // Si company_admin, force le company_id à son entreprise
        if (!$user->isSuperAdmin()) {
            $data['company_id'] = $user->company_id;
        }

        $data['password'] = Hash::make($data['password']);

        $newUser = User::create($data);

        return response()->json($newUser->load('company'), 201);
    }

    public function update(Request $request, User $user)
    {
        $currentUser = $request->user();

        // Un company_admin ne peut pas modifier un super_admin
        if (!$currentUser->isSuperAdmin() && $user->isSuperAdmin()) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        // Un company_admin ne peut modifier que les users de son entreprise
        if (!$currentUser->isSuperAdmin() && $user->company_id !== $currentUser->company_id) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        // Déterminer les rôles autorisés selon qui modifie
        $allowedRoles = $currentUser->isSuperAdmin()
            ? ['super_admin', 'company_admin', 'fleet_manager', 'rental_agent', 'mechanic', 'employee']
            : ['fleet_manager', 'rental_agent', 'mechanic', 'employee'];

        $rules = [
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'role'     => ['required', Rule::in($allowedRoles)],
            'password' => ['nullable', 'string', 'min:6'],
        ];

        // Si super_admin, permet de changer l'entreprise (optionnel pour les super_admins sans entreprise)
        if ($currentUser->isSuperAdmin()) {
            $rules['company_id'] = ['nullable', 'exists:companies,id'];
        }

        $data = $request->validate($rules);

        // Si company_admin, force le company_id à son entreprise
        if (!$currentUser->isSuperAdmin()) {
            $data['company_id'] = $user->company_id;
        }

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return response()->json($user->load('company'));
    }

    public function resetPassword(Request $request, User $user)
    {
        $currentUser = $request->user();

        // Un company_admin ne peut pas réinitialiser le mot de passe d'un super_admin
        if (!$currentUser->isSuperAdmin() && $user->isSuperAdmin()) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        // Un company_admin ne peut réinitialiser que les users de son entreprise
        if (!$currentUser->isSuperAdmin() && $user->company_id !== $currentUser->company_id) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $data = $request->validate([
            'password' => ['required', 'string', 'min:6'],
        ]);

        $user->password = Hash::make($data['password']);
        $user->save();

        return response()->json(['message' => 'Mot de passe réinitialisé avec succès']);
    }

    public function toggleActive(User $user)
    {
        $currentUser = request()->user();

        // Seul le super_admin peut activer/désactiver
        if (!$currentUser->isSuperAdmin()) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        // Ne peut pas désactiver son propre compte
        if ($user->id === $currentUser->id) {
            return response()->json(['message' => 'Vous ne pouvez pas désactiver votre propre compte'], 422);
        }

        $user->update(['is_active' => !$user->is_active]);

        $status = $user->is_active ? 'activé' : 'désactivé';
        return response()->json([
            'message'   => "Utilisateur {$status} avec succès",
            'is_active' => $user->is_active,
            'user'      => $user->load('company'),
        ]);
    }

    public function destroy(User $user)
    {
        $currentUser = request()->user();

        // Un company_admin ne peut pas supprimer un super_admin
        if (!$currentUser->isSuperAdmin() && $user->isSuperAdmin()) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        // Un company_admin ne peut supprimer que les users de son entreprise
        if (!$currentUser->isSuperAdmin() && $user->company_id !== $currentUser->company_id) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        // Empêcher la suppression du dernier admin de l'entreprise
        $adminCount = User::where('company_id', $user->company_id)
            ->where('role', 'company_admin')
            ->count();

        if ($user->isCompanyAdmin() && $adminCount === 1) {
            return response()->json(['message' => 'Impossible de supprimer le dernier administrateur'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé']);
    }
}
