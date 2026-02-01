<?php

use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\MaintenanceController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\MaintenanceReminderController;
use App\Http\Controllers\MaintenanceFileController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SuperAdminStatsController;



// Routes publiques
Route::post('/login', [AuthController::class, 'login']);

// Routes protégées (authentification nécessaire)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // ═══════════════════════════════════════════════════════════
    // ROUTES ACCESSIBLES PAR TOUS (super_admin, company_admin, employee)
    // ═══════════════════════════════════════════════════════════

    // Véhicules - lecture seule pour employee
    Route::get('/vehicles', [VehicleController::class, 'index']);

    // Maintenances - lecture seule pour employee  
    Route::get('/maintenances', [MaintenanceController::class, 'index']);

    // Rappels - lecture seule pour employee
    Route::get('/reminders', [MaintenanceReminderController::class, 'index']);

    // Stats - lecture pour tous
    Route::get('/stats', [StatsController::class, 'index']);
    

    // ═══════════════════════════════════════════════════════════
    // ROUTES COMPANY_ADMIN + SUPER_ADMIN UNIQUEMENT
    // ═══════════════════════════════════════════════════════════

    Route::middleware([App\Http\Middleware\CompanyAdminMiddleware::class])->group(function () {
        // Véhicules - CRUD complet
        Route::post('/vehicles', [VehicleController::class, 'store']);
        Route::put('/vehicles/{vehicle}', [VehicleController::class, 'update']);
        Route::delete('/vehicles/{vehicle}', [VehicleController::class, 'destroy']);

        // Maintenances - CRUD complet
        Route::post('/maintenances', [MaintenanceController::class, 'store']);
        Route::put('/maintenances/{maintenance}', [MaintenanceController::class, 'update']);
        Route::delete('/maintenances/{maintenance}', [MaintenanceController::class, 'destroy']);
        Route::post('/maintenances/{maintenance}/complete', [MaintenanceController::class, 'complete']);

        // Fichiers maintenance
        Route::post('/maintenances/{maintenance}/files', [MaintenanceFileController::class, 'store']);
        Route::delete('/maintenances/{maintenance}/files/{file}', [MaintenanceFileController::class, 'destroy']);

        // Rappels - CRUD complet
        Route::post('/reminders', [MaintenanceReminderController::class, 'store']);
        Route::put('/reminders/{reminder}', [MaintenanceReminderController::class, 'update']);
        Route::delete('/reminders/{reminder}', [MaintenanceReminderController::class, 'destroy']);
        Route::post('/reminders/{reminder}/renew', [MaintenanceReminderController::class, 'renew']);

        // Gestion utilisateurs
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
    });

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
        
    });
});
