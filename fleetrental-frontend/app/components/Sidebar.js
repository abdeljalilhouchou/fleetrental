'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { logout, storageUrl } from '../../lib/api';
import { useData } from '../context/DataContext';
import { LayoutDashboard, Car, Wrench, Bell, BarChart2, LogOut, User, Building2, Shield, Users, FileText, Settings, Menu, X, Wallet } from 'lucide-react';
import NotificationBell from './NotificationBell';

// Navigation par rôle
const NAV_BY_ROLE = {
    super_admin: [
        { icon: LayoutDashboard, label: 'Dashboard',     path: '/super-admin/dashboard' },
        { icon: Building2,      label: 'Entreprises',   path: '/companies' },
        { icon: Users,          label: 'Utilisateurs',  path: '/users' },
    ],
    company_admin: [
        { icon: LayoutDashboard, label: 'Dashboard',    path: '/dashboard' },
        { icon: Car,             label: 'Véhicules',    path: '/vehicles' },
        { icon: Wrench,          label: 'Maintenances', path: '/maintenances' },
        { icon: Bell,            label: 'Rappels',      path: '/reminders' },
        { icon: FileText,        label: 'Locations',    path: '/rentals' },
        { icon: Wallet,          label: 'Finances',     path: '/finances' },
        { icon: BarChart2,       label: 'Statistiques', path: '/stats' },
        { icon: Users,           label: 'Utilisateurs', path: '/users' },
    ],
    employee: [
        { icon: Car,             label: 'Véhicules',    path: '/vehicles' },
        { icon: Wrench,          label: 'Maintenances', path: '/maintenances' },
        { icon: Bell,            label: 'Rappels',      path: '/reminders' },
        { icon: FileText,        label: 'Locations',    path: '/rentals' },
    ],
};

const ROLE_LABELS = {
    super_admin:   { badge: 'SA', color: 'bg-purple-600', label: 'Super Admin' },
    company_admin: { badge: 'CA', color: 'bg-green-600',  label: 'Admin Entreprise' },
    employee:      { badge: 'EM', color: 'bg-blue-600',   label: 'Employé' },
};

export default function Sidebar() {
    const router   = useRouter();
    const pathname = usePathname();
    const { user, reminders, loading } = useData();
    const [isOpen, setIsOpen] = useState(false);

    const role = user?.role || 'employee';
    const navItems = NAV_BY_ROLE[role] || NAV_BY_ROLE.employee;
    const roleInfo = ROLE_LABELS[role];

    // Calculer les rappels en retard (utilise computed_status du backend)
    const overdueRemindersCount = reminders?.filter((r) => r.computed_status === 'overdue').length || 0;

    // Fermer la sidebar quand on navigue
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Fermer sidebar sur resize desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) setIsOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const sidebarContent = (
        <>
            {/* Logo */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                        <Car size={20} className="text-white" />
                    </div>
                    <span className="font-bold text-lg text-slate-800 dark:text-white">FleetRental</span>
                    <button onClick={() => setIsOpen(false)} className="lg:hidden ml-auto text-slate-400 hover:text-slate-800 dark:hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                {role !== 'super_admin' && user?.company && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2 bg-white text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-transparent">
                        <Building2 size={14} className="text-blue-500 dark:text-blue-400" />
                        <span className="text-xs font-medium truncate">{user.company.name}</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {loading || !user ? (
                    [1,2,3,4].map(i => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl">
                            <div className="w-5 h-5 bg-slate-300 dark:bg-slate-700 rounded animate-pulse" />
                            <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded animate-pulse flex-1" />
                        </div>
                    ))
                ) : (
                    <>
                        {role === 'super_admin' && (
                            <div className="mb-2 px-4">
                                <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-400 dark:text-slate-600">
                                    <Shield size={11} />
                                    Super Admin
                                </p>
                            </div>
                        )}

                        {navItems.map((item) => {
                            const Icon        = item.icon;
                            const isActive    = pathname === item.path;
                            const isReminders = item.path === '/reminders';
                            const showBadge   = isReminders && overdueRemindersCount > 0;

                            let activeColor = 'bg-blue-600 shadow-blue-600/20';
                            if (role === 'super_admin')   activeColor = 'bg-purple-600 shadow-purple-600/20';
                            if (role === 'company_admin') activeColor = 'bg-green-600 shadow-green-600/20';

                            return (
                                <button key={item.path} onClick={() => router.push(item.path)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition
                                        ${isActive
                                            ? `${activeColor} text-white shadow-lg`
                                            : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                                        }`}
                                >
                                    <Icon size={18} />
                                    <span className="flex-1 text-left">{item.label}</span>
                                    {showBadge && (
                                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-5 text-center">
                                            {overdueRemindersCount > 99 ? '99+' : overdueRemindersCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </>
                )}
            </nav>

            {/* User */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <button onClick={() => router.push('/profile')}
                    className="w-full flex items-center gap-3 mb-3 px-2 py-2 rounded-lg transition group hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center ring-2 ring-slate-300 dark:ring-slate-600 group-hover:ring-blue-500 transition overflow-hidden bg-slate-200 dark:bg-slate-700">
                        {user?.avatar ? (
                            <img src={user.avatar?.startsWith('data:') ? user.avatar : storageUrl(user.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User size={16} className="text-slate-500 dark:text-slate-300" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-semibold truncate flex items-center gap-1.5 text-slate-800 dark:text-white">
                            {user?.name || 'Utilisateur'}
                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${roleInfo?.color} text-white`}>
                                {roleInfo?.badge}
                            </span>
                        </div>
                        <div className="text-xs truncate text-slate-400 dark:text-slate-500">{user?.email || ''}</div>
                    </div>
                    <Settings size={14} className="transition text-slate-400 group-hover:text-blue-500 dark:text-slate-500 dark:group-hover:text-blue-400" />
                </button>
                <div className="flex items-center gap-2">
                    <NotificationBell />
                    <button onClick={logout}
                        className="flex-1 flex items-center gap-2 text-sm transition px-3 py-2 rounded-lg text-slate-500 hover:text-red-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-slate-800">
                        <LogOut size={16} />
                        Déconnexion
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Hamburger button - mobile only */}
            <button onClick={() => setIsOpen(true)} className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl shadow-lg bg-white text-slate-800 border border-slate-200 dark:bg-slate-900 dark:text-white dark:border-transparent">
                <Menu size={22} />
            </button>

            {/* Desktop sidebar */}
            <aside className="hidden lg:flex w-64 flex-col h-screen sticky top-0 shrink-0 bg-slate-100 dark:bg-slate-900">
                {sidebarContent}
            </aside>

            {/* Mobile sidebar overlay */}
            {isOpen && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setIsOpen(false)} />
                    <aside className="relative w-72 max-w-[80vw] flex flex-col h-full animate-slide-in bg-slate-100 dark:bg-slate-900">
                        {sidebarContent}
                    </aside>
                </div>
            )}
        </>
    );
}
