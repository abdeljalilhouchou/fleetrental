'use client';

import { useState, useEffect, useCallback } from 'react';
import { useData } from '@/app/context/DataContext';
import { getRoles, getAllPermissions, updateRolePermissions } from '@/lib/api';
import {
    Shield, Car, FileText, Wrench, Users, DollarSign, Bell,
    Check, X, ChevronRight, Save, RotateCcw, Lock,
    Building2, ClipboardList, User, Gauge
} from 'lucide-react';

// ─── Config modules ───────────────────────────────────────────────────────────
const MODULE_CONFIG = {
    vehicles: {
        label: 'Véhicules',
        icon: Car,
        color: 'blue',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        iconBg: 'bg-blue-100 dark:bg-blue-900/40',
        iconColor: 'text-blue-600 dark:text-blue-400',
    },
    rentals: {
        label: 'Locations',
        icon: FileText,
        color: 'purple',
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
        iconBg: 'bg-purple-100 dark:bg-purple-900/40',
        iconColor: 'text-purple-600 dark:text-purple-400',
    },
    maintenances: {
        label: 'Maintenances',
        icon: Wrench,
        color: 'orange',
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-800',
        iconBg: 'bg-orange-100 dark:bg-orange-900/40',
        iconColor: 'text-orange-600 dark:text-orange-400',
    },
    users: {
        label: 'Utilisateurs',
        icon: Users,
        color: 'green',
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        iconBg: 'bg-green-100 dark:bg-green-900/40',
        iconColor: 'text-green-600 dark:text-green-400',
    },
    finances: {
        label: 'Finances',
        icon: DollarSign,
        color: 'emerald',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        border: 'border-emerald-200 dark:border-emerald-800',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    reminders: {
        label: 'Rappels',
        icon: Bell,
        color: 'yellow',
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        iconBg: 'bg-yellow-100 dark:bg-yellow-900/40',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
};

const ROLE_ICONS = {
    company_admin: { icon: Building2,     color: 'text-blue-500' },
    fleet_manager: { icon: Gauge,         color: 'text-indigo-500' },
    rental_agent:  { icon: ClipboardList, color: 'text-purple-500' },
    mechanic:      { icon: Wrench,        color: 'text-orange-500' },
    employee:      { icon: User,          color: 'text-green-500' },
};

function RoleIcon({ name, size = 18, className = '' }) {
    const cfg = ROLE_ICONS[name];
    const Icon = cfg?.icon ?? User;
    return <Icon size={size} className={className || cfg?.color || 'text-slate-400'} />;
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }) {
    return (
        <button
            type="button"
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
            } ${checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    checked ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    );
}

// ─── Module Card ──────────────────────────────────────────────────────────────
function ModuleCard({ module, permissions, activePerms, onToggle, onToggleAll, isSystem }) {
    const cfg = MODULE_CONFIG[module] || MODULE_CONFIG.vehicles;
    const Icon = cfg.icon;
    const allActive = permissions.every(p => activePerms.has(p.name));
    const someActive = permissions.some(p => activePerms.has(p.name));

    return (
        <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 flex flex-col gap-3`}>
            {/* Header module */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${cfg.iconBg}`}>
                        <Icon size={16} className={cfg.iconColor} />
                    </div>
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                        {cfg.label}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        ({permissions.filter(p => activePerms.has(p.name)).length}/{permissions.length})
                    </span>
                </div>
                {/* Toggle tout sélectionner */}
                {!isSystem && (
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Tout</span>
                        <Toggle
                            checked={allActive}
                            onChange={() => onToggleAll(permissions, !allActive)}
                        />
                    </div>
                )}
            </div>

            {/* Liste permissions */}
            <div className="flex flex-col gap-2">
                {permissions.map(perm => (
                    <div key={perm.name} className="flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                            <span className="text-sm text-slate-700 dark:text-slate-200">
                                {perm.display_name}
                            </span>
                            {perm.description && (
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                    {perm.description}
                                </span>
                            )}
                        </div>
                        {isSystem ? (
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                <Lock size={12} />
                                <span>Tout</span>
                            </div>
                        ) : (
                            <Toggle
                                checked={activePerms.has(perm.name)}
                                onChange={(val) => onToggle(perm.name, val)}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function RolesPermissionsPage() {
    const { user } = useData();

    const [roles, setRoles] = useState([]);
    const [permissionsByModule, setPermissionsByModule] = useState({});
    const [totalPermCount, setTotalPermCount] = useState(0);
    const [selectedRole, setSelectedRole] = useState(null);
    const [activePerms, setActivePerms] = useState(new Set()); // permissions cochées pour le rôle sélectionné
    const [originalPerms, setOriginalPerms] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const isDirty = JSON.stringify([...activePerms].sort()) !== JSON.stringify([...originalPerms].sort());

    // Charger rôles + permissions
    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [rolesData, permsData] = await Promise.all([getRoles(), getAllPermissions()]);
                setRoles(rolesData);
                setPermissionsByModule(permsData);

                const count = Object.values(permsData).reduce((acc, arr) => acc + arr.length, 0);
                setTotalPermCount(count);

                if (rolesData.length > 0) {
                    selectRole(rolesData[0], rolesData[0].permissions);
                }
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    function selectRole(role, permNames) {
        setSelectedRole(role);
        const set = new Set(permNames || role.permissions || []);
        setActivePerms(new Set(set));
        setOriginalPerms(new Set(set));
        setSaved(false);
    }

    function handleToggle(permName, val) {
        setActivePerms(prev => {
            const next = new Set(prev);
            val ? next.add(permName) : next.delete(permName);
            return next;
        });
    }

    function handleToggleAll(permissions, val) {
        setActivePerms(prev => {
            const next = new Set(prev);
            permissions.forEach(p => val ? next.add(p.name) : next.delete(p.name));
            return next;
        });
    }

    function handleDiscard() {
        setActivePerms(new Set(originalPerms));
    }

    async function handleSave() {
        if (!selectedRole) return;
        setSaving(true);
        try {
            await updateRolePermissions(selectedRole.id, [...activePerms]);
            const newOriginal = new Set(activePerms);
            setOriginalPerms(newOriginal);
            // Mettre à jour le compteur dans la liste des rôles
            setRoles(prev => prev.map(r =>
                r.id === selectedRole.id
                    ? { ...r, permissions: [...activePerms], total_count: activePerms.size }
                    : r
            ));
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } finally {
            setSaving(false);
        }
    }

    if (!user || user.role !== 'super_admin') {
        return (
            <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
                Accès réservé au super administrateur.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    const modules = Object.keys(permissionsByModule);

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                    <Shield size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Rôles & Permissions
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Configurez les droits d'accès pour chaque rôle
                    </p>
                </div>
            </div>

            <div className="flex gap-6">
                {/* ─── Colonne gauche : liste des rôles ─────────────────── */}
                <div className="w-64 flex-shrink-0 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 mb-3">
                        Rôles disponibles
                    </p>
                    {roles.map(role => {
                        const isSelected = selectedRole?.id === role.id;
                        const pct = Math.round((role.total_count / totalPermCount) * 100);
                        return (
                            <button
                                key={role.id}
                                onClick={() => selectRole(role)}
                                className={`w-full text-left rounded-xl p-3 border transition-all ${
                                    isSelected
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-400 dark:hover:border-blue-500'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <RoleIcon name={role.name} size={18} className={isSelected ? 'text-white' : undefined} />
                                        <span className="font-semibold text-sm">{role.display_name}</span>
                                    </div>
                                    {isSelected && <ChevronRight size={14} />}
                                </div>
                                <div className={`text-xs mb-2 ${isSelected ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}>
                                    {role.name === 'super_admin'
                                        ? 'Accès total'
                                        : `${role.total_count}/${totalPermCount} permissions`
                                    }
                                </div>
                                {/* Barre de progression */}
                                {role.name !== 'super_admin' && (
                                    <div className={`h-1 rounded-full ${isSelected ? 'bg-blue-400' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                        <div
                                            className={`h-1 rounded-full transition-all ${isSelected ? 'bg-white' : 'bg-blue-500'}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ─── Colonne droite : permissions du rôle sélectionné ─── */}
                <div className="flex-1 min-w-0">
                    {selectedRole ? (
                        <>
                            {/* Header rôle */}
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <RoleIcon name={selectedRole.name} size={24} />
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                            {selectedRole.display_name}
                                        </h2>
                                        {selectedRole.is_system && (
                                            <span className="inline-flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                                                <Lock size={10} /> Système
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                        {selectedRole.name === 'super_admin'
                                            ? 'Accès illimité à toutes les fonctionnalités'
                                            : `${activePerms.size} permissions actives sur ${totalPermCount}`
                                        }
                                    </p>
                                </div>

                                {/* Boutons sauvegarde */}
                                {selectedRole.name !== 'super_admin' && !selectedRole.is_system && isDirty && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleDiscard}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                        >
                                            <RotateCcw size={14} /> Annuler
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-60"
                                        >
                                            {saving ? (
                                                <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                                            ) : (
                                                <Save size={14} />
                                            )}
                                            Enregistrer
                                        </button>
                                    </div>
                                )}
                                {saved && !isDirty && (
                                    <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 font-medium">
                                        <Check size={16} /> Enregistré
                                    </div>
                                )}
                            </div>

                            {/* Barre progression globale */}
                            {selectedRole.name !== 'super_admin' && (
                                <div className="mb-5 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-600 dark:text-slate-300 font-medium">Permissions actives</span>
                                        <span className="font-bold text-blue-600 dark:text-blue-400">
                                            {activePerms.size} / {totalPermCount}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-2 bg-blue-600 rounded-full transition-all"
                                            style={{ width: `${(activePerms.size / totalPermCount) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Grille des modules */}
                            {selectedRole.name === 'super_admin' ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="p-4 bg-blue-100 dark:bg-blue-900/40 rounded-2xl mb-4">
                                        <Shield size={40} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                        Accès total
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                                        Le super administrateur dispose de tous les droits sur toutes les entreprises. Ses permissions ne peuvent pas être modifiées.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {modules.map(module => (
                                        <ModuleCard
                                            key={module}
                                            module={module}
                                            permissions={permissionsByModule[module]}
                                            activePerms={activePerms}
                                            onToggle={handleToggle}
                                            onToggleAll={handleToggleAll}
                                            isSystem={selectedRole.is_system}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-slate-400">
                            Sélectionnez un rôle
                        </div>
                    )}
                </div>
            </div>

            {/* Barre de sauvegarde sticky en bas si modifications non sauvegardées */}
            {isDirty && selectedRole?.name !== 'super_admin' && !selectedRole?.is_system && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <div className="flex items-center gap-3 bg-slate-900 dark:bg-slate-700 text-white px-5 py-3 rounded-2xl shadow-2xl">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                        <span className="text-sm">Modifications non sauvegardées</span>
                        <button
                            onClick={handleDiscard}
                            className="text-sm text-slate-300 hover:text-white transition flex items-center gap-1"
                        >
                            <X size={14} /> Annuler
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg transition flex items-center gap-1.5 disabled:opacity-60"
                        >
                            {saving ? (
                                <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                                <Save size={13} />
                            )}
                            Enregistrer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
