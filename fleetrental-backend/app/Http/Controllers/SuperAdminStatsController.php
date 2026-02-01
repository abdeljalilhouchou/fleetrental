<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Vehicle;
use App\Models\Maintenance;
use App\Models\User;
use Illuminate\Http\Request;

class SuperAdminStatsController extends Controller
{
    public function index(Request $request)
    {
        $stats = [
            'total_companies' => Company::count(),
            'total_vehicles'  => Vehicle::count(),
            'total_users'     => User::where('role', '!=', 'super_admin')->count(),
            'total_maintenances' => Maintenance::count(),
            
            'vehicles_by_status' => [
                'available'      => Vehicle::where('status', 'available')->count(),
                'rented'         => Vehicle::where('status', 'rented')->count(),
                'maintenance'    => Vehicle::where('status', 'maintenance')->count(),
                'out_of_service' => Vehicle::where('status', 'out_of_service')->count(),
            ],
            
            'total_maintenance_cost' => Maintenance::sum('cost'),
            
            'recent_companies' => Company::latest()->take(5)->get(),
        ];

        return response()->json($stats);
    }
}
