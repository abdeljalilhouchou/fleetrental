'use client';

import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { getToken } from '../../../lib/api';
import RoleProtector from '../../components/RoleProtector';
import {
    Users, Plus, Edit2, Trash2, Search, Shield, XCircle,
    AlertCircle, Mail, Key, User, Building2, ChevronDown,
    ToggleLeft, ToggleRight
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const EMPTY_FORM = {
    name: '',
    email: '',
    password: '',
    role: 'employee',
    company_id: '',
};

const ROLE_LABELS = {
    super_admin: 'Super Admin',
    company_admin: 'Administrateur',
    employee: 'Employé',
};

const ROLE_COLORS = {
    super_admin: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    company_admin: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    employee: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
};

export default function UsersPage() {
    const { user: currentUser, users, companies, loading, refreshUsers } = useData();

    const [showModal, setShowModal]         = useState(false);
    const [form, setForm]                   = useState(EMPTY_FORM);
    const [editingId, setEditingId]         = useState(null);
    const [error, setError]                 = useState('');
    const [saving, setSaving]               = useState(false);
    const [search, setSearch]               = useState('');

    const [filterRole, setFilterRole]             = useState('all');
    const [showResetModal, setShowResetModal]   = useState(false);
    const [resetUserId, setResetUserId]         = useState(null);
    const [resetForm, setResetForm]             = useState({ password: '', password_confirmation: '' });

    const headers = () => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
    });

    // ── CRUD ──────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            let res;
            if (editingId) {
                res = await fetch(`${API_URL}/users/${editingId}`, {
                    method: 'PUT', headers: headers(), body: JSON.stringify(form),
                });
            } else {
                res = await fetch(`${API_URL}/users`, {
                    method: 'POST', headers: headers(), body: JSON.stringify(form),
                });
            }
            const data = await res.json();
            if (!res.ok) { setError(data.message || 'Erreur'); return; }
            await refreshUsers();
            setShowModal(false);
            setForm(EMPTY_FORM);
            setEditingId(null);
        } catch (e) {
            setError('Erreur réseau');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Vous êtes sûr de supprimer cet utilisateur ?')) return;
        const res = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE', headers: headers() });
        const data = await res.json();
        if (!res.ok) {
            setError(data.message);
            setTimeout(() => setError(''), 3000);
            return;
        }
        await refreshUsers();
    };

    const handleEdit = (u) => {
        setForm({
            name:       u.name || '',
            email:      u.email || '',
            password:   '', // Ne pas pré-remplir le mot de passe
            role:       u.role || 'employee',
            company_id: u.company_id || '',
        });
        setEditingId(u.id);
        setError('');
        setShowModal(true);
    };

    const handleCreate = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setError('');
        setShowModal(true);
    };

    // ── RESET PASSWORD ────────────────────────────
    const canReset = (u) => {
        if (currentUser?.role === 'super_admin') return u.id !== currentUser.id;
        if (currentUser?.role === 'company_admin') return u.role === 'employee';
        return false;
    };

    const handleOpenReset = (u) => {
        setResetUserId(u.id);
        setResetForm({ password: '', password_confirmation: '' });
        setError('');
        setShowResetModal(true);
    };

    const handleResetPassword = async () => {
        setSaving(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/users/${resetUserId}/reset-password`, {
                method: 'PUT',
                headers: headers(),
                body: JSON.stringify(resetForm),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.message || 'Erreur'); return; }
            setShowResetModal(false);
            setResetForm({ password: '', password_confirmation: '' });
        } catch (e) {
            setError('Erreur réseau');
        } finally {
            setSaving(false);
        }
    };

    // ── TOGGLE ACTIVE ─────────────────────────────
    const handleToggleActive = async (u) => {
        const action = u.is_active ? 'désactiver' : 'activer';
        if (!confirm(`Voulez-vous ${action} le compte de ${u.name} ?`)) return;
        const res = await fetch(`${API_URL}/users/${u.id}/toggle-active`, {
            method: 'PATCH', headers: headers(),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.message);
            setTimeout(() => setError(''), 3000);
            return;
        }
        await refreshUsers();
    };

    // ── FILTRES ───────────────────────────────────
    const filtered = users.filter(u => {
        const matchSearch = `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase());
        const matchRole = filterRole === 'all' || u.role === filterRole;
        return matchSearch && matchRole;
    });

    const adminCount    = users.filter(u => u.role === 'company_admin').length;
    const employeeCount = users.filter(u => u.role === 'employee').length;

    return (
        <RoleProtector allowedRoles={['super_admin', 'company_admin']} requiredPermission="view_users">
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                        <Users size={22} className="text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Utilisateurs</h1>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">Gérez votre équipe</p>
                    </div>
                </div>
                <button onClick={handleCreate}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-green-600/20 hover:shadow-lg transition flex items-center gap-2 w-full sm:w-auto justify-center">
                    <Plus size={18} />
                    Nouvel utilisateur
                </button>
            </div>

            {/* Error banner */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
                {[
                    { label: 'Total utilisateurs', value: users.length, filter: 'all', valueColor: 'text-gray-800 dark:text-white' },
                    { label: 'Administrateurs', value: adminCount, filter: 'company_admin', valueColor: 'text-green-600 dark:text-green-400' },
                    { label: 'Employés', value: employeeCount, filter: 'employee', valueColor: 'text-blue-600 dark:text-blue-400' },
                ].map((card) => (
                    <div
                        key={card.filter}
                        onClick={() => setFilterRole(filterRole === card.filter ? 'all' : card.filter)}
                        className={`rounded-2xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition ${
                            filterRole === card.filter
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 ring-2 ring-blue-400/50'
                                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700'
                        }`}
                    >
                        <div className={`text-3xl font-bold ${card.valueColor}`}>{card.value}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{card.label}</div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
                <div className="relative flex-1 sm:max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher un utilisateur..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30 outline-none text-sm text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-500 shadow-sm" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Users size={28} className="text-gray-300 dark:text-gray-500" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-semibold">Aucun utilisateur trouvé</p>
                        <p className="text-gray-300 dark:text-gray-500 text-sm mt-1">
                            {search ? 'Essayez de modifier votre recherche' : 'Créez votre premier utilisateur'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto"><table className="w-full min-w-[600px]">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Utilisateur</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Rôle</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Entreprise</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Statut</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((u) => (
                                <tr key={u.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                    {/* Utilisateur */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/50 rounded-xl flex items-center justify-center">
                                                <User size={18} className="text-green-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-800 dark:text-white">{u.name}</div>
                                                <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                                                    <Mail size={10} /> {u.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Rôle */}
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${ROLE_COLORS[u.role]}`}>
                                            {u.role === 'super_admin' && <Shield size={11} />}
                                            {u.role === 'company_admin' && <Shield size={11} />}
                                            {u.role === 'employee' && <User size={11} />}
                                            {ROLE_LABELS[u.role] || u.role}
                                        </span>
                                    </td>

                                    {/* Entreprise */}
                                    <td className="px-6 py-4">
                                        {u.company ? (
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                <Building2 size={11} className="text-gray-300 dark:text-gray-500" /> {u.company.name}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-300 dark:text-gray-500">—</span>
                                        )}
                                    </td>

                                    {/* Statut */}
                                    <td className="px-6 py-4">
                                        {u.is_active !== false ? (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                                                Actif
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
                                                Inactif
                                            </span>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleEdit(u)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition">
                                                <Edit2 size={16} />
                                            </button>
                                            {canReset(u) && (
                                                <button onClick={() => handleOpenReset(u)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition" title="Réinitialiser mot de passe">
                                                    <Key size={16} />
                                                </button>
                                            )}
                                            {currentUser?.role === 'super_admin' && u.id !== currentUser.id && (
                                                <button onClick={() => handleToggleActive(u)}
                                                    className={`p-2 rounded-lg transition ${u.is_active !== false
                                                        ? 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'
                                                        : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'}`}
                                                    title={u.is_active !== false ? 'Désactiver le compte' : 'Activer le compte'}>
                                                    {u.is_active !== false ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(u.id)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table></div>
                )}
            </div>

            {/* ── Modal ── */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                    {editingId
                                        ? <Edit2 size={18} className="text-green-600" />
                                        : <Users size={18} className="text-green-600" />}
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-800 dark:text-white">{editingId ? 'Modifier' : 'Nouvel'} utilisateur</h2>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{editingId ? 'Mettez à jour les informations' : 'Créez un nouveau compte utilisateur'}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-300 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                <XCircle size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs rounded-lg px-3 py-2 flex items-center gap-2">
                                    <AlertCircle size={14} /> {error}
                                </div>
                            )}

                            {/* Nom */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Nom complet</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500" />
                                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Ex: Jean Dupont"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30 outline-none text-sm text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-500 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition" />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500" />
                                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        placeholder="jean.dupont@entreprise.com"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30 outline-none text-sm text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-500 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition" />
                                </div>
                            </div>

                            {/* Entreprise - visible seulement pour super_admin */}
                            {currentUser?.role === 'super_admin' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Entreprise</label>
                                    <div className="relative">
                                        <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500" />
                                        <select value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                                            className="appearance-none w-full pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30 outline-none text-sm text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 cursor-pointer"
                                            required>
                                            <option value="">Sélectionner une entreprise</option>
                                            {companies.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                    </div>
                                </div>
                            )}

                            {/* Mot de passe */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                    Mot de passe {editingId && <span className="text-gray-400 dark:text-gray-500 font-normal normal-case">(laisser vide pour ne pas changer)</span>}
                                </label>
                                <div className="relative">
                                    <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500" />
                                    <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        placeholder={editingId ? 'Nouveau mot de passe' : 'Mot de passe'}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30 outline-none text-sm text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-500 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition" />
                                </div>
                            </div>

                            {/* Rôle */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Rôle</label>
                                <div className="relative">
                                    <Shield size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500" />
                                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                                        className="appearance-none w-full pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30 outline-none text-sm text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 cursor-pointer">
                                        {currentUser?.role === 'super_admin' && (
                                            <>
                                                <option value="super_admin">Super Admin</option>
                                                <option value="company_admin">Administrateur</option>
                                            </>
                                        )}
                                        <option value="employee">Employé</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                    {currentUser?.role === 'super_admin' ? (
                                        <>
                                            <strong>Super Admin :</strong> Accès complet à toutes les entreprises.<br />
                                            <strong>Administrateur :</strong> Gère les utilisateurs et toutes les données de son entreprise.<br />
                                            <strong>Employé :</strong> Consulte et gère les véhicules et maintenances.
                                        </>
                                    ) : (
                                        <>
                                            <strong>Employé :</strong> Peut consulter et gérer les véhicules et maintenances.
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 p-6 border-t border-gray-100 dark:border-gray-700">
                            <button onClick={handleSave} disabled={saving}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2.5 rounded-xl transition shadow-md shadow-green-600/20">
                                {saving ? 'Sauvegarde...' : editingId ? 'Mettre à jour' : 'Créer l\'utilisateur'}
                            </button>
                            <button onClick={() => setShowModal(false)}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ── Modal Réinitialiser mot de passe ── */}
            {showResetModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                                    <Key size={18} className="text-amber-600" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-800 dark:text-white">Réinitialiser mot de passe</h2>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        Pour {users.find(u => u.id === resetUserId)?.name || '...'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowResetModal(false)} className="text-gray-300 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                <XCircle size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs rounded-lg px-3 py-2 flex items-center gap-2">
                                    <AlertCircle size={14} /> {error}
                                </div>
                            )}

                            {/* Nouveau mot de passe */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Nouveau mot de passe</label>
                                <div className="relative">
                                    <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500" />
                                    <input type="password" value={resetForm.password} onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                                        placeholder="Minimum 6 caractères"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 dark:focus:ring-amber-900/30 outline-none text-sm text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-500 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition" />
                                </div>
                            </div>

                            {/* Confirmer mot de passe */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Confirmer mot de passe</label>
                                <div className="relative">
                                    <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500" />
                                    <input type="password" value={resetForm.password_confirmation} onChange={(e) => setResetForm({ ...resetForm, password_confirmation: e.target.value })}
                                        placeholder="Répétez le mot de passe"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 dark:focus:ring-amber-900/30 outline-none text-sm text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-500 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition" />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 p-6 border-t border-gray-100 dark:border-gray-700">
                            <button onClick={handleResetPassword} disabled={saving || !resetForm.password || !resetForm.password_confirmation}
                                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-semibold py-2.5 rounded-xl transition shadow-md shadow-amber-600/20">
                                {saving ? 'En cours...' : 'Réinitialiser'}
                            </button>
                            <button onClick={() => setShowResetModal(false)}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </RoleProtector>
    );
}
