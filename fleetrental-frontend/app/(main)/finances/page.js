'use client';

import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { getToken } from '../../../lib/api';
import RoleProtector from '../../components/RoleProtector';
import {
    Wallet, TrendingUp, TrendingDown, Clock, CheckCircle2, AlertCircle,
    RefreshCw, Calendar,
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
    PieChart, Pie, Cell,
} from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const PERIODS = [
    { key: 'month',   label: 'Ce mois' },
    { key: 'quarter', label: '3 mois' },
    { key: 'year',    label: 'Cette année' },
    { key: 'all',     label: 'Tout' },
];

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

const fmt = (n) =>
    new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0) + ' MAD';

const STATUS_RENTAL = {
    ongoing:   { label: 'En cours',  color: 'text-blue-600 bg-blue-50 border-blue-200' },
    completed: { label: 'Terminée',  color: 'text-green-600 bg-green-50 border-green-200' },
    cancelled: { label: 'Annulée',   color: 'text-red-600 bg-red-50 border-red-200' },
};

const STATUS_MAINT = {
    completed:   { label: 'Terminée',   color: 'text-green-600 bg-green-50 border-green-200' },
    in_progress: { label: 'En cours',   color: 'text-amber-600 bg-amber-50 border-amber-200' },
    scheduled:   { label: 'Planifiée',  color: 'text-blue-600 bg-blue-50 border-blue-200' },
};

export default function FinancesPage() {
    const { loading: ctxLoading } = useData();
    const [period, setPeriod]   = useState('year');
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    const fetchFinances = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/finances?period=${period}`, {
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'Accept': 'application/json',
                },
            });
            if (!res.ok) {
                const d = await res.json();
                setError(d.message || 'Erreur lors du chargement');
                return;
            }
            setData(await res.json());
        } catch {
            setError('Erreur réseau');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!ctxLoading) fetchFinances();
    }, [period, ctxLoading]);

    const summary = data?.summary || {};
    const pieData = data ? [
        { name: 'Soldé',      value: data.payment_status.fully_paid },
        { name: 'Partiel',    value: data.payment_status.partial },
        { name: 'Non payé',   value: data.payment_status.unpaid },
    ] : [];

    const kpis = [
        {
            label: 'Revenus totaux',
            value: fmt(summary.total_revenue),
            icon: TrendingUp,
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-100 dark:border-blue-800',
        },
        {
            label: 'Encaissé',
            value: fmt(summary.total_collected),
            icon: CheckCircle2,
            color: 'text-green-600',
            bg: 'bg-green-50 dark:bg-green-900/20',
            border: 'border-green-100 dark:border-green-800',
        },
        {
            label: 'En attente',
            value: fmt(summary.outstanding),
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            border: 'border-amber-100 dark:border-amber-800',
        },
        {
            label: 'Charges',
            value: fmt(summary.total_expenses),
            icon: TrendingDown,
            color: 'text-red-600',
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-100 dark:border-red-800',
        },
        {
            label: 'Bénéfice net',
            value: fmt(summary.net_profit),
            icon: Wallet,
            color: summary.net_profit >= 0 ? 'text-purple-600' : 'text-red-600',
            bg: summary.net_profit >= 0 ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-red-50 dark:bg-red-900/20',
            border: summary.net_profit >= 0 ? 'border-purple-100 dark:border-purple-800' : 'border-red-100 dark:border-red-800',
        },
    ];

    if (ctxLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-400">Chargement...</div>
            </div>
        );
    }

    return (
        <RoleProtector allowedRoles={['company_admin']}>
            <div>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                            <Wallet size={22} className="text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">Finances</h1>
                            <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">Revenus, charges et bénéfices</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Filtre période */}
                        <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-1 gap-1">
                            {PERIODS.map(p => (
                                <button key={p.key} onClick={() => setPeriod(p.key)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                                        period === p.key
                                            ? 'bg-green-600 text-white shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                    }`}>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        <button onClick={fetchFinances} disabled={loading}
                            className="p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 hover:text-green-600 transition disabled:opacity-50">
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="text-gray-400 dark:text-gray-500">Chargement des données...</div>
                    </div>
                ) : (
                    <>
                        {/* KPIs */}
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4 mb-6">
                            {kpis.map((kpi) => {
                                const Icon = kpi.icon;
                                return (
                                    <div key={kpi.label} className={`rounded-2xl border shadow-sm p-5 ${kpi.bg} ${kpi.border}`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className={`w-8 h-8 rounded-xl bg-white/60 dark:bg-black/20 flex items-center justify-center`}>
                                                <Icon size={16} className={kpi.color} />
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{kpi.label}</span>
                                        </div>
                                        <div className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Graphiques */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                            {/* Bar chart */}
                            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Évolution sur 12 mois</h2>
                                <ResponsiveContainer width="100%" height={240}>
                                    <BarChart data={data?.monthly_data || []} barCategoryGap="30%">
                                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                                            tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip
                                            formatter={(v, name) => [fmt(v), name]}
                                            contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                                        <Legend wrapperStyle={{ fontSize: 11 }} />
                                        <Bar dataKey="collected" name="Encaissé"  fill="#22c55e" radius={[4,4,0,0]} />
                                        <Bar dataKey="expenses"  name="Charges"   fill="#ef4444" radius={[4,4,0,0]} />
                                        <Bar dataKey="profit"    name="Bénéfice"  fill="#8b5cf6" radius={[4,4,0,0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Pie chart */}
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Statut paiements</h2>
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                                            dataKey="value" paddingAngle={3}>
                                            {pieData.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v) => [v, 'locations']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-2 mt-2">
                                    {pieData.map((item, i) => (
                                        <div key={item.name} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                                                <span className="text-gray-500 dark:text-gray-400">{item.name}</span>
                                            </div>
                                            <span className="font-semibold text-gray-700 dark:text-gray-300">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Tables */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Locations récentes */}
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                                    <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Locations récentes</h2>
                                </div>
                                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                                    {(data?.recent_rentals || []).length === 0 ? (
                                        <p className="text-center text-gray-400 py-8 text-sm">Aucune location</p>
                                    ) : (data?.recent_rentals || []).map(r => {
                                        const s = STATUS_RENTAL[r.status] || STATUS_RENTAL.ongoing;
                                        return (
                                            <div key={r.id} className="px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{r.customer}</div>
                                                        <div className="text-xs text-gray-400 dark:text-gray-500">{r.vehicle} · {r.start_date}</div>
                                                    </div>
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${s.color} flex-shrink-0`}>{s.label}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs mt-1">
                                                    <span className="text-gray-500">Total: <span className="font-semibold text-gray-700 dark:text-gray-300">{fmt(r.total)}</span></span>
                                                    <span className="text-green-600">Payé: <span className="font-semibold">{fmt(r.paid)}</span></span>
                                                    {r.remaining > 0 && (
                                                        <span className="text-amber-600">Reste: <span className="font-semibold">{fmt(r.remaining)}</span></span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Charges récentes */}
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                                    <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Charges récentes</h2>
                                </div>
                                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                                    {(data?.recent_expenses || []).length === 0 ? (
                                        <p className="text-center text-gray-400 py-8 text-sm">Aucune charge</p>
                                    ) : (data?.recent_expenses || []).map(e => {
                                        const s = STATUS_MAINT[e.status] || STATUS_MAINT.scheduled;
                                        return (
                                            <div key={e.id} className="px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{e.vehicle}</div>
                                                        <div className="text-xs text-gray-400 dark:text-gray-500">{e.type} {e.date ? `· ${e.date}` : ''}</div>
                                                    </div>
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${s.color} flex-shrink-0`}>{s.label}</span>
                                                </div>
                                                <div className="text-xs mt-1">
                                                    <span className="text-red-600 font-semibold">{fmt(e.cost)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </RoleProtector>
    );
}
