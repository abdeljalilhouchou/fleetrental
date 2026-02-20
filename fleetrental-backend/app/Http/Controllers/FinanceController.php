<?php

namespace App\Http\Controllers;

use App\Models\Rental;
use App\Models\Maintenance;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class FinanceController extends Controller
{
    public function index(Request $request)
    {
        $companyId = $request->user()->company_id;
        $period    = $request->query('period', 'year');

        $startDate = match ($period) {
            'month'   => Carbon::now()->startOfMonth(),
            'quarter' => Carbon::now()->subMonths(3)->startOfDay(),
            'year'    => Carbon::now()->startOfYear(),
            default   => null,
        };

        // ── Requête de base : locations de la company ──
        $rentalQuery = Rental::where('company_id', $companyId);
        if ($startDate) {
            $rentalQuery->where('start_date', '>=', $startDate);
        }

        // ── Requête de base : maintenances des véhicules de la company ──
        $maintenanceQuery = Maintenance::whereHas('vehicle', function ($q) use ($companyId) {
            $q->where('company_id', $companyId);
        });
        if ($startDate) {
            $maintenanceQuery->where('date', '>=', $startDate);
        }

        $rentals      = $rentalQuery->with('vehicle')->get();
        $maintenances = $maintenanceQuery->with('vehicle')->get();

        // ── KPIs ──
        $totalRevenue    = $rentals->sum('total_price');
        $totalCollected  = $rentals->sum('paid_amount');
        $totalOutstanding = $totalRevenue - $totalCollected;
        $totalExpenses   = $maintenances->sum('cost');
        $netProfit       = $totalCollected - $totalExpenses;

        // ── Répartition par statut de paiement ──
        $fullyPaid   = $rentals->where('status', 'completed')->filter(fn($r) => $r->paid_amount >= $r->total_price)->count();
        $partial     = $rentals->filter(fn($r) => $r->paid_amount > 0 && $r->paid_amount < $r->total_price)->count();
        $unpaid      = $rentals->filter(fn($r) => $r->paid_amount == 0)->count();

        // ── Données mensuelles (12 derniers mois) ──
        $monthlyData = [];
        for ($i = 11; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $label = $month->locale('fr')->isoFormat('MMM YY');

            $monthRentals = Rental::where('company_id', $companyId)
                ->whereYear('start_date', $month->year)
                ->whereMonth('start_date', $month->month)
                ->get();

            $monthMaintenance = Maintenance::whereHas('vehicle', function ($q) use ($companyId) {
                $q->where('company_id', $companyId);
            })
                ->whereYear('date', $month->year)
                ->whereMonth('date', $month->month)
                ->sum('cost');

            $monthlyData[] = [
                'month'    => $label,
                'revenue'  => (float) $monthRentals->sum('total_price'),
                'collected'=> (float) $monthRentals->sum('paid_amount'),
                'expenses' => (float) $monthMaintenance,
                'profit'   => (float) $monthRentals->sum('paid_amount') - (float) $monthMaintenance,
            ];
        }

        // ── Locations récentes ──
        $recentRentals = Rental::where('company_id', $companyId)
            ->with('vehicle')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($r) => [
                'id'           => $r->id,
                'customer'     => $r->customer_name,
                'vehicle'      => $r->vehicle ? "{$r->vehicle->brand} {$r->vehicle->model}" : '—',
                'start_date'   => $r->start_date?->format('d/m/Y'),
                'end_date'     => $r->end_date?->format('d/m/Y'),
                'total'        => (float) $r->total_price,
                'paid'         => (float) $r->paid_amount,
                'remaining'    => (float) ($r->total_price - $r->paid_amount),
                'status'       => $r->status,
            ]);

        // ── Charges récentes (maintenances) ──
        $recentExpenses = Maintenance::whereHas('vehicle', function ($q) use ($companyId) {
            $q->where('company_id', $companyId);
        })
            ->with('vehicle')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($m) => [
                'id'      => $m->id,
                'vehicle' => $m->vehicle ? "{$m->vehicle->brand} {$m->vehicle->model}" : '—',
                'type'    => $m->type,
                'cost'    => (float) $m->cost,
                'date'    => $m->date ? Carbon::parse($m->date)->format('d/m/Y') : null,
                'status'  => $m->status,
            ]);

        return response()->json([
            'summary' => [
                'total_revenue'    => round($totalRevenue, 2),
                'total_collected'  => round($totalCollected, 2),
                'outstanding'      => round($totalOutstanding, 2),
                'total_expenses'   => round($totalExpenses, 2),
                'net_profit'       => round($netProfit, 2),
            ],
            'payment_status' => [
                'fully_paid' => $fullyPaid,
                'partial'    => $partial,
                'unpaid'     => $unpaid,
            ],
            'monthly_data'   => $monthlyData,
            'recent_rentals' => $recentRentals,
            'recent_expenses'=> $recentExpenses,
        ]);
    }
}
