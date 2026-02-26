<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\MaintenanceController;
use App\Http\Controllers\MaintenanceReminderController;
use App\Http\Controllers\MaintenanceFileController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\SuperAdminStatsController;
use App\Http\Controllers\RentalController;
use App\Http\Controllers\RentalFileController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\VehicleDocumentController;
use App\Http\Controllers\RolePermissionController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\ReservationController;

// ═══════════════════════════════════════════════════════════
// ROUTES PUBLIQUES — Application mobile cliente (sans auth)
// ═══════════════════════════════════════════════════════════
Route::prefix('public')->group(function () {
    Route::get('/companies', [PublicController::class, 'companies']);
    Route::get('/companies/{company}/vehicles', [PublicController::class, 'companyVehicles']);
    Route::get('/vehicles/{vehicle}', [PublicController::class, 'vehicleDetail']);
    Route::post('/reservations', [PublicController::class, 'createReservation']);
    Route::get('/reservations/{reference}', [PublicController::class, 'trackReservation']);
});

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/me/permissions', [AuthController::class, 'myPermissions']);

    // ═══════════════════════════════════════════════════════════
    // PROFILE - Accessible par tous les utilisateurs authentifiés
    // ═══════════════════════════════════════════════════════════
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar']);
    Route::delete('/profile/avatar', [ProfileController::class, 'removeAvatar']);
    Route::put('/profile/preferences', [ProfileController::class, 'updatePreferences']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);

    // ═══════════════════════════════════════════════════════════
    // NOTIFICATIONS - Accessible par tous les utilisateurs authentifiés
    // ═══════════════════════════════════════════════════════════
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    // ═══════════════════════════════════════════════════════════
    // ROUTES ACCESSIBLES PAR TOUS (super_admin, company_admin, employee)
    // ═══════════════════════════════════════════════════════════

    // Véhicules - lecture pour tous
    Route::get('/vehicles', [VehicleController::class, 'index']);
    Route::get('/vehicles/{vehicle}/documents', [VehicleDocumentController::class, 'index']);
    Route::get('/documents/{document}/download', [VehicleDocumentController::class, 'download']);

    // Maintenances - lecture pour tous
    Route::get('/maintenances', [MaintenanceController::class, 'index']);

    // Rappels - lecture pour tous
    Route::get('/reminders', [MaintenanceReminderController::class, 'index']);

    // Stats - lecture pour tous
    Route::get('/stats', [StatsController::class, 'index']);

    // ═══════════════════════════════════════════════════════════
    // ROUTES POUR EMPLOYÉS ET PLUS (employee, company_admin, super_admin)
    // ═══════════════════════════════════════════════════════════

    // Changer le statut d'un véhicule (employés peuvent le faire)
    Route::put('/vehicles/{vehicle}/status', [VehicleController::class, 'updateStatus']);

    // Créer et compléter des maintenances (employés peuvent le faire)
    Route::post('/maintenances', [MaintenanceController::class, 'store']);
    Route::post('/maintenances/{maintenance}/complete', [MaintenanceController::class, 'complete']);

    // Upload de fichiers pour maintenances (employés peuvent le faire)
    Route::post('/maintenances/{maintenance}/files', [MaintenanceFileController::class, 'store']);

    // ═══════════════════════════════════════════════════════════
    // ROUTES COMPANY_ADMIN + SUPER_ADMIN UNIQUEMENT
    // ═══════════════════════════════════════════════════════════

    Route::middleware([App\Http\Middleware\CompanyAdminMiddleware::class])->group(function () {
        // Véhicules - CRUD complet (sauf lecture et changement statut qui sont pour tous)
        Route::post('/vehicles', [VehicleController::class, 'store']);
        Route::put('/vehicles/{vehicle}', [VehicleController::class, 'update']);
        Route::delete('/vehicles/{vehicle}', [VehicleController::class, 'destroy']);
        Route::post('/vehicles/{vehicle}/photo', [VehicleController::class, 'uploadPhoto']);

        // Documents véhicules
        Route::post('/vehicles/{vehicle}/documents', [VehicleDocumentController::class, 'store']);
        Route::delete('/documents/{document}', [VehicleDocumentController::class, 'destroy']);

        // Maintenances - modification et suppression uniquement
        Route::put('/maintenances/{maintenance}', [MaintenanceController::class, 'update']);
        Route::delete('/maintenances/{maintenance}', [MaintenanceController::class, 'destroy']);

        // Fichiers maintenance - suppression
        Route::delete('/maintenances/{maintenance}/files/{file}', [MaintenanceFileController::class, 'destroy']);

        // Rappels - CRUD complet
        Route::post('/reminders', [MaintenanceReminderController::class, 'store']);
        Route::put('/reminders/{reminder}', [MaintenanceReminderController::class, 'update']);
        Route::delete('/reminders/{reminder}', [MaintenanceReminderController::class, 'destroy']);
        Route::post('/reminders/{reminder}/renew', [MaintenanceReminderController::class, 'renew']);

        // Finances
        Route::get('/finances', [FinanceController::class, 'index']);

        // Gestion utilisateurs
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
        Route::put('/users/{user}/reset-password', [UserController::class, 'resetPassword']);
        Route::patch('/users/{user}/toggle-active', [UserController::class, 'toggleActive']);
    });

    // ═══════════════════════════════════════════════════════════
    // RÉSERVATIONS CLIENTS — Accessibles à tous les rôles authentifiés
    // ═══════════════════════════════════════════════════════════
    Route::get('/reservations', [ReservationController::class, 'index']);
    Route::get('/reservations/{reservation}', [ReservationController::class, 'show']);
    Route::post('/reservations/{reservation}/confirm', [ReservationController::class, 'confirm']);
    Route::post('/reservations/{reservation}/reject', [ReservationController::class, 'reject']);
    Route::post('/reservations/{reservation}/cancel', [ReservationController::class, 'cancel']);

    // ═══════════════════════════════════════════════════════════
    // ROUTES SUPER_ADMIN UNIQUEMENT
    // ═══════════════════════════════════════════════════════════

    Route::middleware([App\Http\Middleware\SuperAdminMiddleware::class])->group(function () {
        Route::get('/companies', [CompanyController::class, 'index']);
        Route::post('/companies', [CompanyController::class, 'store']);
        Route::put('/companies/{company}', [CompanyController::class, 'update']);
        Route::delete('/companies/{company}', [CompanyController::class, 'destroy']);

        // Stats globales pour super admin
        Route::get('/super-admin/stats', [SuperAdminStatsController::class, 'index']);

        // ═══════════════════════════════════════════════════════════
        // ROLES & PERMISSIONS - Super Admin uniquement
        // ═══════════════════════════════════════════════════════════
        Route::get('/roles', [RolePermissionController::class, 'indexRoles']);
        Route::get('/permissions', [RolePermissionController::class, 'indexPermissions']);
        Route::put('/roles/{role}/permissions', [RolePermissionController::class, 'updateRolePermissions']);
        Route::get('/users/{user}/permissions', [RolePermissionController::class, 'userPermissions']);
        Route::put('/users/{user}/permissions', [RolePermissionController::class, 'updateUserPermissions']);
    });
    // ========================================
// LOCATIONS (RENTALS) - Tous les rôles
// ========================================
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/rentals/export', [RentalController::class, 'exportCsv']);
        Route::get('/rentals', [RentalController::class, 'index']);
        Route::get('/rentals/{rental}', [RentalController::class, 'show']);
        Route::get('/rentals/{rental}/contract', [RentalController::class, 'contract']);
        Route::post('/rentals', [RentalController::class, 'store']);
        Route::post('/rentals/{rental}/complete', [RentalController::class, 'complete']);
        Route::post('/rentals/{rental}/cancel', [RentalController::class, 'cancel']);
        Route::post('/rentals/{rental}/files', [RentalFileController::class, 'store']);
        Route::get('/vehicles/{vehicle}/rentals', [RentalController::class, 'vehicleHistory']);
    });

    // LOCATIONS - Admins uniquement
    Route::middleware(['auth:sanctum', 'company.admin'])->group(function () {
        Route::put('/rentals/{rental}', [RentalController::class, 'update']);
        Route::delete('/rentals/{rental}', [RentalController::class, 'destroy']);
        Route::delete('/rentals/{rental}/files/{file}', [RentalFileController::class, 'destroy']);
    });
});
