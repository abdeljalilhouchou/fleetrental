<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use App\Models\Maintenance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class StatsController extends Controller
{
    public function index(Request $request)
    {
        $companyId = $request->user()->company_id;

        // Véhicules par statut
        $vehiclesByStatus = Vehicle::where('company_id', $companyId)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        // Coût total des maintenances
        $totalCost = Maintenance::whereHas('vehicle', fn($q) => $q->where('company_id', $companyId))
            ->sum('cost');

        // Nombre total de maintenances
        $totalMaintenances = Maintenance::whereHas('vehicle', fn($q) => $q->where('company_id', $companyId))
            ->count();

        // Coûts mensuels (6 derniers mois)
        $monthlyCosts = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $cost = Maintenance::whereHas('vehicle', fn($q) => $q->where('company_id', $companyId))
                ->whereYear('date', $month->year)
                ->whereMonth('date', $month->month)
                ->sum('cost');
            $monthlyCosts[] = [
                'month' => $month->format('M Y'),
                'cost' => (float)$cost,
            ];
        }

        // Maintenances par type
        $maintenanceByType = Maintenance::whereHas('vehicle', fn($q) => $q->where('company_id', $companyId))
            ->select('type', DB::raw('count(*) as count'), DB::raw('sum(cost) as total_cost'))
            ->groupBy('type')
            ->orderByDesc('count')
            ->get();

        return response()->json([
            'total_vehicles'      => Vehicle::where('company_id', $companyId)->count(),
            'vehicles_by_status'  => $vehiclesByStatus,
            'total_cost'          => (float)$totalCost,
            'total_maintenances'  => $totalMaintenances,
            'monthly_costs'       => $monthlyCosts,
            'maintenance_by_type' => $maintenanceByType,
        ]);
    }
}