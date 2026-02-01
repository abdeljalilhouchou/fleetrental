'use client';

import { useEffect, useState } from 'react';
import { getToken } from '../../../lib/api';
import { useRouter } from 'next/navigation';
import RoleProtector from '../../components/RoleProtector';
import { Car, Wrench, Plus, ArrowRight, CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const STATUS_CONFIG = {
    available:      { label: 'Disponible',     color: 'text-green-600 bg-green-50',  icon: CheckCircle2 },
    rented:         { label: 'Louée',          color: 'text-red-600 bg-red-50',      icon: Clock },
    maintenance:    { label: 'Maintenance',    color: 'text-amber-600 bg-amber-50',  icon: AlertTriangle },
    out_of_service: { label: 'Hors service',   color: 'text-gray-600 bg-gray-100',   icon: XCircle },
};

export default function DashboardPage() {
    const [user, setUser] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = getToken();
        if (!token) { router.push('/login'); return; }

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        };

        Promise.all([
            fetch(`${API_URL}/me`, { headers }).then(r => r.ok ? r.json() : null),
            fetch(`${API_URL}/vehicles`, { headers }).then(r => r.ok ? r.json() : []),
        ]).then(([userData, vehicleData]) => {
            if (!userData) { router.push('/login'); return; }
            setUser(userData);
            setVehicles(vehicleData || []);
            setLoading(false);
        }).catch(() => router.push('/login'));
    }, [router]);

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Chargement...</div></div>;
    }

    const stats = [
        { title: 'Véhicules Total', value: vehicles.length,                                          icon: Car,            iconColor: 'text-blue-600',   iconBg: 'bg-blue-50' },
        { title: 'Disponibles',     value: vehicles.filter(v => v.status === 'available').length,    icon: CheckCircle2,   iconColor: 'text-green-600',  iconBg: 'bg-green-50' },
        { title: 'En Location',     value: vehicles.filter(v => v.status === 'rented').length,       icon: Clock,          iconColor: 'text-orange-600', iconBg: 'bg-orange-50' },
        { title: 'Maintenance',     value: vehicles.filter(v => v.status === 'maintenance').length,  icon: Wrench,         iconColor: 'text-purple-600', iconBg: 'bg-purple-50' },
    ];

    const quickActions = [
        { label: 'Ajouter un véhicule',     icon: Plus,       path: '/vehicles', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
        { label: 'Voir tous les véhicules', icon: ArrowRight, path: '/vehicles', color: 'bg-gray-50 text-gray-700 hover:bg-gray-100' },
    ];

    return (
        <RoleProtector allowedRoles={['company_admin']}>
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Bonjour, {user?.name} 👋</h1>
                <p className="text-gray-400 text-sm mt-1">Voici un aperçu de votre flotte aujourd'hui</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-5 mb-8">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
                            <div className="mb-4">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                                    <Icon size={20} className={stat.iconColor} />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-gray-800">{stat.value}</div>
                            <div className="text-sm text-gray-400 mt-1">{stat.title}</div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-3 gap-5">
                {/* Recent Vehicles */}
                <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-bold text-gray-800">Véhicules récents</h2>
                        <button onClick={() => router.push('/vehicles')} className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
                            Voir tous <ArrowRight size={14} />
                        </button>
                    </div>

                    {vehicles.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <Car size={24} className="text-gray-300" />
                            </div>
                            <p className="text-gray-400 text-sm">Aucun véhicule pour le moment</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {vehicles.slice(0, 5).map((v) => {
                                const status = STATUS_CONFIG[v.status];
                                const StatusIcon = status.icon;
                                return (
                                    <div key={v.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                                <Car size={18} className="text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-800">{v.color} {v.make} {v.model}</div>
                                                <div className="text-xs text-gray-400">{v.license_plate} · {v.year}</div>
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
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="font-bold text-gray-800 mb-5">Actions rapides</h2>
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
