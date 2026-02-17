'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '../../context/DataContext';
import RoleProtector from '../../components/RoleProtector';
import { Car, Wrench, Plus, ArrowRight, CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
    available:      { label: 'Disponible',     color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30',  icon: CheckCircle2 },
    rented:         { label: 'Louée',          color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30',      icon: Clock },
    maintenance:    { label: 'Maintenance',    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30',  icon: AlertTriangle },
    out_of_service: { label: 'Hors service',   color: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50',   icon: XCircle },
};

export default function DashboardPage() {
    const { user, vehicles } = useData();
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState(null);

    const stats = [
        { title: 'Véhicules Total', value: vehicles.length,                                          icon: Car,            iconColor: 'text-blue-600 dark:text-blue-400',   iconBg: 'bg-blue-50 dark:bg-blue-900/30',       filter: null },
        { title: 'Disponibles',     value: vehicles.filter(v => v.status === 'available').length,    icon: CheckCircle2,   iconColor: 'text-green-600 dark:text-green-400',  iconBg: 'bg-green-50 dark:bg-green-900/30',      filter: 'available' },
        { title: 'En Location',     value: vehicles.filter(v => v.status === 'rented').length,       icon: Clock,          iconColor: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-50 dark:bg-orange-900/30',   filter: 'rented' },
        { title: 'Maintenance',     value: vehicles.filter(v => v.status === 'maintenance').length,  icon: Wrench,         iconColor: 'text-purple-600 dark:text-purple-400', iconBg: 'bg-purple-50 dark:bg-purple-900/30',   filter: 'maintenance' },
    ];

    const filteredVehicles = activeFilter
        ? vehicles.filter(v => v.status === activeFilter)
        : vehicles;

    const quickActions = [
        { label: 'Ajouter un véhicule',     icon: Plus,       path: '/vehicles', color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50' },
        { label: 'Voir tous les véhicules', icon: ArrowRight, path: '/vehicles', color: 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' },
    ];

    return (
        <RoleProtector allowedRoles={['company_admin']}>
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Bonjour, {user?.name} 👋</h1>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Voici un aperçu de votre flotte aujourd&apos;hui</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mb-8">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    const isActive = activeFilter === stat.filter;
                    return (
                        <div
                            key={i}
                            onClick={() => setActiveFilter(isActive ? null : stat.filter)}
                            className={`rounded-2xl border shadow-sm p-5 hover:shadow-md transition cursor-pointer ${
                                isActive
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 ring-2 ring-blue-400/50'
                                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                            }`}
                        >
                            <div className="mb-4">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                                    <Icon size={20} className={stat.iconColor} />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{stat.value}</div>
                            <div className="text-sm text-gray-400 dark:text-gray-500 mt-1">{stat.title}</div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
                {/* Recent Vehicles */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-bold text-gray-800 dark:text-gray-100">
                            {activeFilter ? `Véhicules — ${stats.find(s => s.filter === activeFilter)?.title}` : 'Véhicules récents'}
                        </h2>
                        <div className="flex items-center gap-3">
                            {activeFilter && (
                                <button onClick={() => setActiveFilter(null)} className="text-gray-400 dark:text-gray-500 text-sm font-medium hover:text-gray-600 dark:hover:text-gray-300">
                                    Réinitialiser
                                </button>
                            )}
                            <button onClick={() => router.push('/vehicles')} className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline flex items-center gap-1">
                                Voir tous <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>

                    {filteredVehicles.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <Car size={24} className="text-gray-300 dark:text-gray-600" />
                            </div>
                            <p className="text-gray-400 dark:text-gray-500 text-sm">
                                {activeFilter ? 'Aucun véhicule avec ce statut' : 'Aucun véhicule pour le moment'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredVehicles.slice(0, 5).map((v) => {
                                const status = STATUS_CONFIG[v.status];
                                const StatusIcon = status.icon;
                                return (
                                    <div key={v.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                                <Car size={18} className="text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                                    {v.color} {v.brand} {v.model}
                                                </div>
                                                <div className="text-xs text-gray-400 dark:text-gray-500">
                                                    {v.registration_number} · {v.year}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg ${status.color}`}>
                                            <StatusIcon size={13} />
                                            {status.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                    <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-5">Actions rapides</h2>
                    <div className="space-y-3">
                        {quickActions.map((action, i) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={i}
                                    onClick={() => router.push(action.path)}
                                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-sm font-semibold transition ${action.color}`}
                                >
                                    <Icon size={18} />
                                    {action.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
        </RoleProtector>
    );
}
