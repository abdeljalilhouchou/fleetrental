'use client';

import { useState, useEffect } from 'react';
import { useData } from '@/app/context/DataContext';
import {
    apiRequest, getUserPermissions, updateUserPermissions,
    getRoles
} from '@/lib/api';
import {
    Users, Search, Shield, ChevronRight, X, Save, RotateCcw,
    Car, FileText, Wrench, DollarSign, Bell, Check, AlertCircle,
    Building2, UserCheck, UserX, Plus, Minus, UserPlus, Eye, EyeOff, KeyRound
} from 'lucide-react';

// ─── Config modules ───────────────────────────────────────────────────────────
const MODULE_CONFIG = {
    vehicles:     { label: 'Véhicules',     icon: Car,        color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20',    border: 'border-blue-200 dark:border-blue-800' },
    rentals:      { label: 'Locations',     icon: FileText,   color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800' },
    maintenances: { label: 'Maintenances',  icon: Wrench,     color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' },
    users:        { label: 'Utilisateurs',  icon: Users,      color: 'text-green-600 dark:text-green-400',   bg: 'bg-green-50 dark:bg-green-900/20',   border: 'border-green-200 dark:border-green-800' },
    finances:     { label: 'Finances',      icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
    reminders:    { label: 'Rappels',       icon: Bell,       color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800' },
};

const ROLE_COLORS = {
    super_admin:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    company_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    fleet_manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    rental_agent:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    mechanic:      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    employee:      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
};

const ROLE_LABELS = {
    super_admin:   'Super Admin',
    company_admin: 'Company Admin',
    fleet_manager: 'Fleet Manager',
    rental_agent:  'Rental Agent',
    mechanic:      'Mécanicien',
    employee:      'Employé',
};

const STATE_CONFIG = {
    granted:          { label: 'Accordé',        icon: Plus,  color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-100 dark:bg-green-900/30' },
    revoked:          { label: 'Révoqué',         icon: Minus, color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-100 dark:bg-red-900/30' },
    inherited_granted:{ label: 'Hérité ✓',       icon: Check, color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-100 dark:bg-blue-900/30' },
    inherited_denied: { label: 'Hérité ✗',       icon: X,     color: 'text-slate-400 dark:text-slate-500', bg: 'bg-slate-100 dark:bg-slate-700' },
};

// Cycle des états: inherited → granted → revoked → inherited
function nextState(current) {
    if (current === 'inherited_granted' || current === 'inherited_denied') return 'granted';
    if (current === 'granted') return 'revoked';
    return current.startsWith('inherited') ? 'inherited_granted' : 'inherited';
}

function toApiState(state) {
    if (state === 'granted') return 'granted';
    if (state === 'revoked') return 'revoked';
    return 'inherited';
}

// ─── Permission State Button ──────────────────────────────────────────────────
function StateButton({ state, onChange, disabled }) {
    const cfg = STATE_CONFIG[state] || STATE_CONFIG.inherited_denied;
    const Icon = cfg.icon;

    return (
        <button
            onClick={() => !disabled && onChange(nextState(state))}
            disabled={disabled}
            title={disabled ? 'Non modifiable' : `Cliquer pour changer (actuel: ${cfg.label})`}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${cfg.bg} ${cfg.color} ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80 active:scale-95'
            }`}
        >
            <Icon size={10} />
            {cfg.label}
        </button>
    );
}

// ─── Panneau permissions utilisateur ─────────────────────────────────────────
function UserPermissionsPanel({ user, onClose }) {
    const [permsByModule, setPermsByModule] = useState({});
    const [localStates, setLocalStates] = useState({});
    const [originalStates, setOriginalStates] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [roles, setRoles] = useState([]);
    const [editRole, setEditRole] = useState(user.role);
    const [editInfo, setEditInfo] = useState({ name: user.name, email: user.email, is_active: user.is_active });
    const [savingInfo, setSavingInfo] = useState(false);
    const [savedInfo, setSavedInfo] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    const [newPassword, setNewPassword] = useState('');
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [savingPwd, setSavingPwd] = useState(false);
    const [savedPwd, setSavedPwd] = useState(false);
    const [pwdError, setPwdError] = useState('');

    const isDirty = JSON.stringify(localStates) !== JSON.stringify(originalStates);
    const isInfoDirty = editRole !== user.role || editInfo.name !== user.name || editInfo.email !== user.email || editInfo.is_active !== user.is_active;

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [permsData, rolesData] = await Promise.all([
                    getUserPermissions(user.id),
                    getRoles(),
                ]);
                setPermsByModule(permsData);
                setRoles(rolesData);

                const states = {};
                Object.values(permsData).flat().forEach(p => {
                    states[p.name] = p.state;
                });
                setLocalStates(states);
                setOriginalStates({ ...states });
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [user.id]);

    function handleStateChange(permName, newState) {
        setLocalStates(prev => ({ ...prev, [permName]: newState }));
    }

    function handleDiscard() {
        setLocalStates({ ...originalStates });
    }

    async function handleSavePermissions() {
        setSaving(true);
        try {
            const overrides = Object.entries(localStates).map(([name, state]) => ({
                name,
                state: toApiState(state),
            }));
            await updateUserPermissions(user.id, overrides);
            setOriginalStates({ ...localStates });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } finally {
            setSaving(false);
        }
    }

    async function handleResetPassword() {
        setPwdError('');
        if (!newPassword || newPassword.length < 8) { setPwdError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
        setSavingPwd(true);
        try {
            await apiRequest(`/users/${user.id}/reset-password`, {
                method: 'PUT',
                body: JSON.stringify({ password: newPassword }),
            });
            setNewPassword('');
            setSavedPwd(true);
            setTimeout(() => setSavedPwd(false), 2500);
        } catch {
            setPwdError('Erreur lors de la réinitialisation.');
        } finally {
            setSavingPwd(false);
        }
    }

    async function handleSaveInfo() {
        setSavingInfo(true);
        try {
            await apiRequest(`/users/${user.id}`, {
                method: 'PUT',
                body: JSON.stringify({ name: editInfo.name, email: editInfo.email, role: editRole, company_id: user.company_id }),
            });
            if (editInfo.is_active !== user.is_active) {
                await apiRequest(`/users/${user.id}/toggle-active`, { method: 'PATCH' });
            }
            setSavedInfo(true);
            setTimeout(() => setSavedInfo(false), 2000);
        } finally {
            setSavingInfo(false);
        }
    }

    const modules = Object.keys(permsByModule);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                            {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900 dark:text-white">{user.name}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[user.role]}`}>
                            {ROLE_LABELS[user.role] || user.role}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                        <X size={18} className="text-slate-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700 px-5">
                    {[
                        { id: 'info', label: 'Informations' },
                        { id: 'permissions', label: 'Permissions' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5">
                    {/* ── Onglet Informations ── */}
                    {activeTab === 'info' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Nom complet</label>
                                    <input
                                        value={editInfo.name}
                                        onChange={e => setEditInfo(p => ({ ...p, name: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Email</label>
                                    <input
                                        value={editInfo.email}
                                        onChange={e => setEditInfo(p => ({ ...p, email: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Rôle</label>
                                    <select
                                        value={editRole}
                                        onChange={e => setEditRole(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                                    >
                                        {roles.map(r => (
                                            <option key={r.name} value={r.name}>{r.display_name}</option>
                                        ))}
                                        <option value="super_admin">Super Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Entreprise</label>
                                    <input
                                        value={user.company?.name || '—'}
                                        disabled
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Statut actif */}
                            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                <div>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Compte actif</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">L'utilisateur peut se connecter</p>
                                </div>
                                <button
                                    onClick={() => setEditInfo(p => ({ ...p, is_active: !p.is_active }))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        editInfo.is_active ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                                    }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                        editInfo.is_active ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>

                            {/* Réinitialisation mot de passe */}
                            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                    <KeyRound size={14} className="text-slate-500" />
                                    Réinitialiser le mot de passe
                                </div>
                                {pwdError && (
                                    <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                        <AlertCircle size={12} /> {pwdError}
                                    </div>
                                )}
                                {savedPwd && (
                                    <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                                        <Check size={12} /> Mot de passe modifié avec succès
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type={showNewPwd ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            placeholder="Nouveau mot de passe (min. 8 car.)"
                                            className="w-full pr-9 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                                        />
                                        <button type="button" onClick={() => setShowNewPwd(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            {showNewPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleResetPassword}
                                        disabled={savingPwd || !newPassword}
                                        className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition disabled:opacity-50"
                                    >
                                        {savingPwd ? <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" /> : <KeyRound size={13} />}
                                        Réinitialiser
                                    </button>
                                </div>
                            </div>

                            {isInfoDirty && (
                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        onClick={() => { setEditRole(user.role); setEditInfo({ name: user.name, email: user.email, is_active: user.is_active }); }}
                                        className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleSaveInfo}
                                        disabled={savingInfo}
                                        className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-60"
                                    >
                                        {savingInfo ? <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" /> : <Save size={13} />}
                                        Enregistrer
                                    </button>
                                </div>
                            )}
                            {savedInfo && !isInfoDirty && (
                                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                    <Check size={14} /> Informations sauvegardées
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Onglet Permissions ── */}
                    {activeTab === 'permissions' && (
                        <>
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
                                </div>
                            ) : (
                                <>
                                    {/* Légende */}
                                    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs">
                                        <span className="text-slate-500 dark:text-slate-400 font-medium">Légende :</span>
                                        {Object.entries(STATE_CONFIG).map(([key, cfg]) => {
                                            const Icon = cfg.icon;
                                            return (
                                                <span key={key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                                                    <Icon size={9} /> {cfg.label}
                                                </span>
                                            );
                                        })}
                                        <span className="text-slate-400 ml-1">← cliquer pour changer</span>
                                    </div>

                                    {/* Modules */}
                                    <div className="space-y-3">
                                        {modules.map(module => {
                                            const cfg = MODULE_CONFIG[module];
                                            const Icon = cfg?.icon || Shield;
                                            const perms = permsByModule[module];
                                            return (
                                                <div key={module} className={`rounded-xl border ${cfg?.border || ''} ${cfg?.bg || ''} p-4`}>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Icon size={15} className={cfg?.color || ''} />
                                                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                                                            {cfg?.label || module}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {perms.map(perm => (
                                                            <div key={perm.name} className="flex items-center justify-between gap-2 bg-white/60 dark:bg-slate-900/40 rounded-lg px-3 py-2">
                                                                <span className="text-sm text-slate-700 dark:text-slate-200">
                                                                    {perm.display_name}
                                                                </span>
                                                                <StateButton
                                                                    state={localStates[perm.name] || perm.state}
                                                                    onChange={(newState) => handleStateChange(perm.name, newState)}
                                                                    disabled={user.role === 'super_admin'}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Boutons */}
                                    {isDirty && (
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
                                            <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                                                <AlertCircle size={14} />
                                                Modifications non sauvegardées
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleDiscard}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                                >
                                                    <RotateCcw size={13} /> Annuler
                                                </button>
                                                <button
                                                    onClick={handleSavePermissions}
                                                    disabled={saving}
                                                    className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-60"
                                                >
                                                    {saving ? <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" /> : <Save size={13} />}
                                                    Enregistrer
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {saved && !isDirty && (
                                        <div className="flex items-center gap-2 pt-3 text-sm text-green-600 dark:text-green-400">
                                            <Check size={14} /> Permissions sauvegardées
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Modal création utilisateur ───────────────────────────────────────────────
function CreateUserModal({ onClose, onCreated }) {
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', company_id: '' });
    const [companies, setCompanies] = useState([]);
    const [roles, setRoles] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showPwd, setShowPwd] = useState(false);

    useEffect(() => {
        Promise.all([
            apiRequest('/companies'),
            getRoles(),
        ]).then(([c, r]) => { setCompanies(c); setRoles(r); });
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        if (!form.name || !form.email || !form.password) { setError('Nom, email et mot de passe sont requis.'); return; }
        setSaving(true);
        try {
            await apiRequest('/users', { method: 'POST', body: JSON.stringify(form) });
            onCreated();
            onClose();
        } catch (err) {
            setError(err?.message || 'Erreur lors de la création.');
        } finally {
            setSaving(false);
        }
    }

    const field = 'w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <UserPlus size={18} className="text-purple-600" />
                        <h2 className="font-bold text-slate-900 dark:text-white">Nouvel utilisateur</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                        <X size={16} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Nom complet *</label>
                        <input className={field} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Jean Dupont" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Email *</label>
                        <input type="email" className={field} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="jean@exemple.com" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Mot de passe *</label>
                        <div className="relative">
                            <input type={showPwd ? 'text' : 'password'} className={field + ' pr-10'} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min. 8 caractères" />
                            <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Rôle</label>
                            <select className={field} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                                {roles.map(r => <option key={r.name} value={r.name}>{r.display_name}</option>)}
                                <option value="super_admin">Super Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Entreprise</label>
                            <select className={field} value={form.company_id} onChange={e => setForm(p => ({ ...p, company_id: e.target.value }))}>
                                <option value="">— Aucune —</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                            Annuler
                        </button>
                        <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition disabled:opacity-60">
                            {saving ? <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" /> : <UserPlus size={14} />}
                            Créer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function SuperAdminUsersPage() {
    const { user: currentUser } = useData();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showCreate, setShowCreate] = useState(false);

    async function loadUsers() {
        setLoading(true);
        try {
            const data = await apiRequest('/users');
            setUsers(data);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadUsers(); }, []);

    if (!currentUser || currentUser.role !== 'super_admin') {
        return (
            <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
                Accès réservé au super administrateur.
            </div>
        );
    }

    const filtered = users.filter(u => {
        const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
        const matchRole = !filterRole || u.role === filterRole;
        return matchSearch && matchRole;
    });

    const roles = [...new Set(users.map(u => u.role))];

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
                    <Users size={24} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Gestion des Utilisateurs
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Modifier les informations et permissions de chaque utilisateur
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition"
                >
                    <UserPlus size={16} />
                    Nouvel utilisateur
                </button>
            </div>

            {/* Barre de recherche + filtre */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher par nom ou email..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                </div>
                <select
                    value={filterRole}
                    onChange={e => setFilterRole(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:border-blue-500"
                >
                    <option value="">Tous les rôles</option>
                    {roles.map(r => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Utilisateur</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rôle</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Entreprise</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Statut</th>
                                <th className="px-5 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filtered.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                {u.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{u.name}</p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] || ROLE_COLORS.employee}`}>
                                            {ROLE_LABELS[u.role] || u.role}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                                            <Building2 size={13} className="text-slate-400" />
                                            {u.company?.name || '—'}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        {u.is_active ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                                                <UserCheck size={10} /> Actif
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                                                <UserX size={10} /> Inactif
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <button
                                            onClick={() => setSelectedUser(u)}
                                            className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition"
                                        >
                                            Gérer <ChevronRight size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-slate-400 dark:text-slate-500">
                                        Aucun utilisateur trouvé
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Panel utilisateur */}
            {selectedUser && (
                <UserPermissionsPanel
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                />
            )}

            {/* Modal création */}
            {showCreate && (
                <CreateUserModal
                    onClose={() => setShowCreate(false)}
                    onCreated={loadUsers}
                />
            )}
        </div>
    );
}
