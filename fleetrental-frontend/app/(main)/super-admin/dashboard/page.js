'use client';

import { useRouter } from 'next/navigation';
import { useData } from '@/app/context/DataContext';
import RoleProtector from '@/app/components/RoleProtector';
import {
    Building2, Car, Users, Wrench, CheckCircle2, Clock,
    AlertTriangle, XCircle, DollarSign, TrendingUp
} from 'lucide-react';

export default function SuperAdminDashboard() {
    const { superAdminStats: stats } = useData();
    const router = useRouter();

    const mainStats = [
        { 
            title: 'Entreprises', 
            value: stats?.total_companies || 0, 
            icon: Building2, 
            iconColor: 'text-purple-600', 
            iconBg: 'bg-purple-50',
            trend: '+2 ce mois',
        },
        { 
            title: 'Véhicules Total', 
            value: stats?.total_vehicles || 0, 
            icon: Car, 
            iconColor: 'text-blue-600', 
            iconBg: 'bg-blue-50',
            trend: '+15 ce mois',
        },
        { 
            title: 'Utilisateurs', 
            value: stats?.total_users || 0, 
            icon: Users, 
            iconColor: 'text-green-600', 
            iconBg: 'bg-green-50',
            trend: '+8 ce mois',
        },
        { 
            title: 'Maintenances', 
            value: stats?.total_maintenances || 0, 
            icon: Wrench, 
            iconColor: 'text-orange-600', 
            iconBg: 'bg-orange-50',
            trend: '23 ce mois',
        },
    ];

    const vehicleStats = [
        {
            label: 'Disponibles',
            value: stats?.vehicles_by_status?.available || 0,
            icon: CheckCircle2,
            color: 'text-green-600 bg-green-50',
        },
        {
            label: 'Louées',
            value: stats?.vehicles_by_status?.rented || 0,
            icon: Clock,
            color: 'text-red-600 bg-red-50',
        },
        {
            label: 'Maintenance',
            value: stats?.vehicles_by_status?.maintenance || 0,
            icon: AlertTriangle,
            color: 'text-amber-600 bg-amber-50',
        },
        {
            label: 'Hors service',
            value: stats?.vehicles_by_status?.out_of_service || 0,
            icon: XCircle,
            color: 'text-gray-600 bg-gray-100',
        },
    ];

    const totalCost = stats?.total_maintenance_cost || 0;
    const formattedCost = new Intl.NumberFormat('fr-MA', {
        style: 'currency',
        currency: 'MAD',
    }).format(totalCost);

    return (
        <RoleProtector allowedRoles={['super_admin']}>
        <div>
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
                        <Building2 size={24} className="text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Dashboard Super Admin</h1>
                        <p className="text-gray-400 text-sm">Vue d'ensemble de toutes les entreprises</p>
                    </div>
                </div>
            </div>

            {/* Main Stats Cards */}
            <div className="grid grid-cols-4 gap-5 mb-6">
                {mainStats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center`}>
                                    <Icon size={24} className={stat.iconColor} />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</div>
                            <div className="text-xs text-gray-400 mb-2">{stat.title}</div>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                <TrendingUp size={12} className="text-green-500" />
                                <span>{stat.trend}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-3 gap-5 mb-6">
                {/* Vehicle Status */}
                <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="font-bold text-gray-800 mb-5">État des véhicules</h2>
                    <div className="grid grid-cols-4 gap-4">
                        {vehicleStats.map((stat, idx) => {
                            const Icon = stat.icon;
                            return (
                                <div key={idx} className="text-center">
                                    <div className={`w-14 h-14 ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                                        <Icon size={24} />
                                    </div>
                                    <div className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</div>
                                    <div className="text-xs text-gray-400">{stat.label}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Maintenance Cost */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="font-bold text-gray-800 mb-5">Coût total maintenances</h2>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center">
                            <DollarSign size={28} className="text-orange-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800 mb-1">{formattedCost}</div>
                    <div className="text-xs text-gray-400">Toutes entreprises confondues</div>
                </div>
            </div>

            {/* Recent Companies */}
            {stats?.recent_companies && stats.recent_companies.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="font-bold text-gray-800 mb-5">Entreprises récentes</h2>
                    <div className="space-y-3">
                        {stats.recent_companies.map((company) => (
                            <div key={company.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition cursor-pointer"
                                onClick={() => router.push('/companies')}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200">
                                        <Building2 size={18} className="text-gray-600" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-800 text-sm">{company.name}</div>
                                        <div className="text-xs text-gray-400">{company.email || 'Aucun email'}</div>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400">
                                    {new Date(company.created_at).toLocaleDateString('fr-FR')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
        </RoleProtector>
    );
}
