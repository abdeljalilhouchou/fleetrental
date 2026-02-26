'use client';

import { useData } from '../../context/DataContext';
import RoleProtector from '../../components/RoleProtector';
import { Car, Wrench, TrendingUp, DollarSign } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
    BarChart, Bar
} from 'recharts';

const STATUS_COLORS = {
    available: { color: '#16a34a', label: 'Disponible' },
    rented: { color: '#dc2626', label: 'Louée' },
    maintenance: { color: '#d97706', label: 'En maintenance' },
    out_of_service: { color: '#6b7280', label: 'Hors service' },
};

const TYPE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#6366f1', '#84cc16', '#f97316'];

// Custom Tooltip for Area Chart
const AreaTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-4 py-3">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {payload[0].value.toLocaleString()} <span className="text-gray-400 dark:text-gray-500 font-normal">€</span>
                </p>
            </div>
        );
    }
    return null;
};

// Custom Tooltip for Bar Chart
const BarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-4 py-3">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                    {payload[0].value} <span className="text-gray-400 dark:text-gray-500 font-normal">maintenance(s)</span>
                </p>
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {payload[1].value.toLocaleString()} <span className="text-gray-400 dark:text-gray-500 font-normal">€</span>
                </p>
            </div>
        );
    }
    return null;
};

// Custom Pie Label
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.06) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export default function StatsPage() {
    const { stats, loading, user } = useData();
    const isDark = user?.theme === 'dark';

    if (loading || !stats) {
        return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Chargement...</div></div>;
    }

    // Pie chart data
    const pieData = Object.entries(STATUS_COLORS).map(([key, config]) => ({
        name: config.label,
        value: stats.vehicles_by_status[key] || 0,
        color: config.color,
    })).filter(d => d.value > 0);

    // Bar chart data
    const barData = stats.maintenance_by_type.map(item => ({
        name: item.type,
        count: item.count,
        cost: parseFloat(item.total_cost),
    }));

    const topCards = [
        {
            title: 'Total Véhicules',
            value: stats.total_vehicles,
            icon: Car,
            iconColor: 'text-blue-600',
            iconBg: 'bg-blue-50 dark:bg-blue-900/30',
            sub: `${stats.vehicles_by_status.available || 0} disponible(s)`,
            subColor: 'text-green-600',
        },
        {
            title: 'Total Maintenances',
            value: stats.total_maintenances,
            icon: Wrench,
            iconColor: 'text-purple-600',
            iconBg: 'bg-purple-50 dark:bg-purple-900/30',
            sub: `${stats.maintenance_by_type.length} type(s)`,
            subColor: 'text-purple-500',
        },
        {
            title: 'Coût Total',
            value: `${stats.total_cost.toLocaleString()} €`,
            icon: DollarSign,
            iconColor: 'text-green-600',
            iconBg: 'bg-green-50 dark:bg-green-900/30',
            sub: stats.total_maintenances > 0
                ? `Moy. ${(stats.total_cost / stats.total_maintenances).toLocaleString(undefined, { maximumFractionDigits: 0 })} € / maintenance`
                : 'Aucune maintenance',
            subColor: 'text-green-500',
        },
        {
            title: 'Véhicules Concernés',
            value: new Set((stats.maintenance_by_type || []).map(() => null)).size || stats.total_vehicles,
            icon: TrendingUp,
            iconColor: 'text-orange-600',
            iconBg: 'bg-orange-50 dark:bg-orange-900/30',
            sub: stats.total_vehicles > 0
                ? `${((stats.vehicles_by_status.available || 0) / stats.total_vehicles * 100).toFixed(0)}% disponibles`
                : '—',
            subColor: 'text-orange-500',
        },
    ];

    return (
        <RoleProtector allowedRoles={['company_admin', 'fleet_manager']}>
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Statistiques</h1>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Analyse et aperçu de votre flotte</p>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mb-8">
                {topCards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 hover:shadow-md transition">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                                    <Icon size={20} className={card.iconColor} />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-gray-800 dark:text-white">{card.value}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{card.title}</div>
                            <div className={`text-xs font-semibold mt-1.5 ${card.subColor}`}>{card.sub}</div>
                        </div>
                    );
                })}
            </div>

            {/* Charts Row 1 : Area + Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 mb-5">
                {/* Monthly Costs - Area Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                    <div className="mb-6">
                        <h2 className="font-bold text-gray-800 dark:text-white">Coûts mensuels</h2>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Évolution des dépenses de maintenance sur 6 mois</p>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={stats.monthly_costs}>
                            <defs>
                                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} vertical={false} />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                tickFormatter={(v) => `${v}€`}
                            />
                            <Tooltip content={<AreaTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="cost"
                                stroke="#3b82f6"
                                strokeWidth={2.5}
                                fill="url(#colorCost)"
                                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 5, fill: '#2563eb' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Vehicle Status - Pie Chart */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                    <div className="mb-4">
                        <h2 className="font-bold text-gray-800 dark:text-white">Statut des véhicules</h2>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Répartition actuelle</p>
                    </div>
                    {pieData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={160}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={renderPieLabel}
                                        outerRadius={70}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={index} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Légende manuelle */}
                            <div className="space-y-2 mt-2">
                                {pieData.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                            <span className="text-xs text-gray-600 dark:text-gray-400">{item.name}</span>
                                        </div>
                                        <span className="text-xs font-bold text-gray-800 dark:text-white">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-40">
                            <p className="text-gray-300 dark:text-gray-500 text-sm">Aucun véhicule</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Charts Row 2 : Bar Chart (maintenance by type) */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <div className="mb-6">
                    <h2 className="font-bold text-gray-800 dark:text-white">Maintenances par type</h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Nombre et coût selon le type de maintenance</p>
                </div>
                {barData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={barData} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} vertical={false} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                            />
                            <YAxis
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                tickFormatter={(v) => v}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                tickFormatter={(v) => `${v}€`}
                            />
                            <Tooltip content={<BarTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }} />
                            <Bar yAxisId="left" dataKey="count" radius={[6, 6, 0, 0]} barSize={28}>
                                {barData.map((entry, index) => (
                                    <Cell key={index} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                                ))}
                            </Bar>
                            <Bar yAxisId="right" dataKey="cost" fill="#10b981" radius={[6, 6, 0, 0]} barSize={28} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-48">
                        <p className="text-gray-300 dark:text-gray-500 text-sm">Aucune maintenance enregistrée</p>
                    </div>
                )}
                {barData.length > 0 && (
                    <div className="flex items-center gap-6 mt-4 justify-center">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-3 rounded-sm bg-blue-500"></div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Nombre</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-3 rounded-sm bg-green-500"></div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Coût (€)</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
        </RoleProtector>
    );
}
