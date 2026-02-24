<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Permissions ─────────────────────────────────────────────
        $permissions = [
            // Véhicules
            ['name' => 'view_vehicles',           'display_name' => 'Voir',                   'module' => 'vehicles',      'description' => 'Consulter la liste des véhicules'],
            ['name' => 'create_vehicles',         'display_name' => 'Créer',                  'module' => 'vehicles',      'description' => 'Ajouter un nouveau véhicule'],
            ['name' => 'edit_vehicles',           'display_name' => 'Modifier',               'module' => 'vehicles',      'description' => 'Modifier un véhicule existant'],
            ['name' => 'delete_vehicles',         'display_name' => 'Supprimer',              'module' => 'vehicles',      'description' => 'Supprimer un véhicule'],
            ['name' => 'change_vehicle_status',   'display_name' => 'Changer le statut',      'module' => 'vehicles',      'description' => 'Changer le statut disponible/en maintenance/loué'],
            ['name' => 'manage_vehicle_documents','display_name' => 'Gérer les documents',    'module' => 'vehicles',      'description' => 'Ajouter et supprimer des documents véhicule'],

            // Locations
            ['name' => 'view_rentals',            'display_name' => 'Voir',                   'module' => 'rentals',       'description' => 'Consulter la liste des locations'],
            ['name' => 'create_rentals',          'display_name' => 'Créer',                  'module' => 'rentals',       'description' => 'Créer une nouvelle location'],
            ['name' => 'edit_rentals',            'display_name' => 'Modifier',               'module' => 'rentals',       'description' => 'Modifier une location existante'],
            ['name' => 'delete_rentals',          'display_name' => 'Supprimer',              'module' => 'rentals',       'description' => 'Supprimer une location'],
            ['name' => 'complete_rentals',        'display_name' => 'Compléter',              'module' => 'rentals',       'description' => 'Marquer une location comme terminée'],
            ['name' => 'cancel_rentals',          'display_name' => 'Annuler',                'module' => 'rentals',       'description' => 'Annuler une location'],

            // Maintenances
            ['name' => 'view_maintenances',       'display_name' => 'Voir',                   'module' => 'maintenances',  'description' => 'Consulter la liste des maintenances'],
            ['name' => 'create_maintenances',     'display_name' => 'Créer',                  'module' => 'maintenances',  'description' => 'Créer une nouvelle maintenance'],
            ['name' => 'edit_maintenances',       'display_name' => 'Modifier',               'module' => 'maintenances',  'description' => 'Modifier une maintenance existante'],
            ['name' => 'delete_maintenances',     'display_name' => 'Supprimer',              'module' => 'maintenances',  'description' => 'Supprimer une maintenance'],
            ['name' => 'complete_maintenances',   'display_name' => 'Compléter',              'module' => 'maintenances',  'description' => 'Marquer une maintenance comme terminée'],

            // Utilisateurs
            ['name' => 'view_users',              'display_name' => 'Voir',                   'module' => 'users',         'description' => 'Consulter la liste des utilisateurs'],
            ['name' => 'manage_users',            'display_name' => 'Gérer',                  'module' => 'users',         'description' => 'Créer, modifier, supprimer des utilisateurs'],

            // Finances
            ['name' => 'view_finances',           'display_name' => 'Voir',                   'module' => 'finances',      'description' => 'Consulter le tableau de bord financier'],

            // Rappels
            ['name' => 'view_reminders',          'display_name' => 'Voir',                   'module' => 'reminders',     'description' => 'Consulter les rappels de maintenance'],
            ['name' => 'manage_reminders',        'display_name' => 'Gérer',                  'module' => 'reminders',     'description' => 'Créer, modifier, supprimer des rappels'],
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm['name']], $perm);
        }

        // ─── Rôles avec leurs permissions par défaut ──────────────────
        $roles = [
            [
                'name'         => 'company_admin',
                'display_name' => 'Company Admin',
                'description'  => 'Accès complet à son entreprise',
                'is_system'    => true,
                'permissions'  => [
                    'view_vehicles','create_vehicles','edit_vehicles','delete_vehicles',
                    'change_vehicle_status','manage_vehicle_documents',
                    'view_rentals','create_rentals','edit_rentals','delete_rentals',
                    'complete_rentals','cancel_rentals',
                    'view_maintenances','create_maintenances','edit_maintenances',
                    'delete_maintenances','complete_maintenances',
                    'view_users','manage_users',
                    'view_finances',
                    'view_reminders','manage_reminders',
                ],
            ],
            [
                'name'         => 'fleet_manager',
                'display_name' => 'Fleet Manager',
                'description'  => 'Gestion des véhicules et maintenances',
                'is_system'    => false,
                'permissions'  => [
                    'view_vehicles','create_vehicles','edit_vehicles','delete_vehicles',
                    'change_vehicle_status','manage_vehicle_documents',
                    'view_rentals',
                    'view_maintenances','create_maintenances','edit_maintenances',
                    'delete_maintenances','complete_maintenances',
                    'view_finances',
                    'view_reminders','manage_reminders',
                ],
            ],
            [
                'name'         => 'rental_agent',
                'display_name' => 'Rental Agent',
                'description'  => 'Gestion des locations uniquement',
                'is_system'    => false,
                'permissions'  => [
                    'view_vehicles','change_vehicle_status',
                    'view_rentals','create_rentals','complete_rentals','cancel_rentals',
                ],
            ],
            [
                'name'         => 'mechanic',
                'display_name' => 'Mécanicien',
                'description'  => 'Maintenances uniquement',
                'is_system'    => false,
                'permissions'  => [
                    'view_vehicles',
                    'view_maintenances','create_maintenances','complete_maintenances',
                    'view_reminders',
                ],
            ],
            [
                'name'         => 'employee',
                'display_name' => 'Employé',
                'description'  => 'Accès de base en lecture et actions simples',
                'is_system'    => true,
                'permissions'  => [
                    'view_vehicles','change_vehicle_status',
                    'view_rentals','create_rentals',
                    'view_maintenances','create_maintenances','complete_maintenances',
                    'view_reminders',
                ],
            ],
        ];

        foreach ($roles as $roleData) {
            $permNames = $roleData['permissions'];
            unset($roleData['permissions']);

            $role = Role::firstOrCreate(['name' => $roleData['name']], $roleData);

            $permIds = Permission::whereIn('name', $permNames)->pluck('id');
            $role->permissions()->sync($permIds);
        }
    }
}
