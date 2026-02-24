<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    // Relation vers le modèle Role via le champ 'role' (string name)
    public function roleModel()
    {
        return $this->belongsTo(Role::class, 'role', 'name');
    }

    // Overrides individuels de permissions
    public function permissionOverrides()
    {
        return $this->hasMany(UserPermissionOverride::class);
    }

    // Vérifie si l'utilisateur a une permission donnée
    public function hasPermission(string $permission): bool
    {
        // super_admin a tout
        if ($this->role === 'super_admin') return true;

        // Vérifier d'abord un override individuel
        $override = $this->permissionOverrides()
            ->whereHas('permission', fn($q) => $q->where('name', $permission))
            ->first();

        if ($override !== null) {
            return $override->granted;
        }

        // Sinon, vérifier les permissions du rôle
        $role = $this->roleModel()->with('permissions')->first();
        if (!$role) return false;

        return $role->permissions->contains('name', $permission);
    }

    protected $fillable = [
        'name',
        'email',
        'password',
        'company_id',
        'role',
        'phone',
        'address',
        'birthdate',
        'avatar',
        'theme',
        'language',
        'notifications_email',
        'notifications_maintenance',
        'notifications_rental',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'birthdate' => 'date',
            'notifications_email' => 'boolean',
            'notifications_maintenance' => 'boolean',
            'notifications_rental' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
    // Un utilisateur appartient à une entreprise
    public function company()
    {
        return $this->belongsTo(Company::class);
    }
    public function isSuperAdmin()
    {
        return $this->role === 'super_admin';
    }

    public function isCompanyAdmin()
    {
        return $this->role === 'company_admin';
    }

    public function isEmployee()
    {
        return $this->role === 'employee';
    }
}