'use client';

import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { getToken } from '../../../lib/api';
import RoleProtector from '../../components/RoleProtector';
import {
    Users, Plus, Edit2, Trash2, Search, Shield, XCircle,
    AlertCircle, Mail, Key, User, Building2, ChevronDown
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
    super_admin: 'bg-purple-50 text-purple-700 border-purple-200',
    company_admin: 'bg-green-50 text-green-700 border-green-200',
    employee: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function UsersPage() {
    const { user: currentUser, users, companies, loading, refreshUsers } = useData();

    const [showModal, setShowModal] = useState(false);
    const [form, setForm]           = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [error, setError]         = useState('');
    const [saving, setSaving]       = useState(false);
    const [search, setSearch]       = useState('');

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

    // ── FILTRES ───────────────────────────────────
    const filtered = users.filter(u =>
        `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    );

    const adminCount    = users.filter(u => u.role === 'company_admin').length;
    const employeeCount = users.filter(u => u.role === 'employee').length;

    return (
        <RoleProtector allowedRoles={['super_admin', 'company_admin']}>
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-green-50 rounded-2xl flex items-center justify-center">
                        <Users size={22} className="text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Utilisateurs</h1>
                        <p className="text-gray-400 text-sm mt-0.5">Gérez votre équipe</p>
                    </div>
                </div>
                <button onClick={handleCreate}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-green-600/20 hover:shadow-lg transition flex items-center gap-2">
                    <Plus size={18} />
                    Nouvel utilisateur
                </button>
            </div>

            {/* Error banner */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                            <Users size={20} className="text-gray-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800">{users.length}</div>
                    <div className="text-xs text-gray-400 mt-1">Total utilisateurs</div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                            <Shield size={20} className="text-green-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800">{adminCount}</div>
                    <div className="text-xs text-gray-400 mt-1">Administrateurs</div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <User size={20} className="text-blue-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800">{employeeCount}</div>
                    <div className="text-xs text-gray-400 mt-1">Employés</div>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3 mb-5">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher un utilisateur..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none text-sm text-gray-800 placeholder-gray-300 shadow-sm" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Users size={28} className="text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-semibold">Aucun utilisateur trouvé</p>
                        <p className="text-gray-300 text-sm mt-1">
                            {search ? 'Essayez de modifier votre recherche' : 'Créez votre premier utilisateur'}
                        </p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Utilisateur</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Rôle</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Entreprise</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((u) => (
                                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                    {/* Utilisateur */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center">
                                                <User size={18} className="text-green-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-800">{u.name}</div>
                                                <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
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
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <Building2 size={11} className="text-gray-300" /> {u.company.name}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-300">—</span>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleEdit(u)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(u.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Modal ── */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${editingId ? 'bg-green-50' : 'bg-green-50'}`}>
                                    {editingId
                                        ? <Edit2 size={18} className="text-green-600" />
                                        : <Users size={18} className="text-green-600" />}
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-800">{editingId ? 'Modifier' : 'Nouvel'} utilisateur</h2>
                                    <p className="text-xs text-gray-400">{editingId ? 'Mettez à jour les informations' : 'Créez un nouveau compte utilisateur'}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-300 hover:text-gray-500 p-1 rounded-lg hover:bg-gray-100 transition">
                                <XCircle size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2 flex items-center gap-2">
                                    <AlertCircle size={14} /> {error}
                                </div>
                            )}

                            {/* Nom */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nom complet</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Ex: Jean Dupont"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none text-sm text-gray-800 placeholder-gray-300 bg-gray-50 focus:bg-white transition" />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        placeholder="jean.dupont@entreprise.com"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none text-sm text-gray-800 placeholder-gray-300 bg-gray-50 focus:bg-white transition" />
                                </div>
                            </div>

                            {/* Entreprise - visible seulement pour super_admin */}
                            {currentUser?.role === 'super_admin' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Entreprise</label>
                                    <div className="relative">
                                        <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                                        <select value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                                            className="appearance-none w-full pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none text-sm text-gray-800 bg-gray-50 focus:bg-white cursor-pointer"
                                            required>
                                            <option value="">Sélectionner une entreprise</option>
                                            {companies.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            )}

                            {/* Mot de passe */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Mot de passe {editingId && <span className="text-gray-400 font-normal normal-case">(laisser vide pour ne pas changer)</span>}
                                </label>
                                <div className="relative">
                                    <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                                    <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        placeholder={editingId ? 'Nouveau mot de passe' : 'Mot de passe'}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none text-sm text-gray-800 placeholder-gray-300 bg-gray-50 focus:bg-white transition" />
                                </div>
                            </div>

                            {/* Rôle */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Rôle</label>
                                <div className="relative">
                                    <Shield size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                                        className="appearance-none w-full pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none text-sm text-gray-800 bg-gray-50 focus:bg-white cursor-pointer">
                                        {currentUser?.role === 'super_admin' && (
                                            <>
                                                <option value="super_admin">Super Admin</option>
                                                <option value="company_admin">Administrateur</option>
                                            </>
                                        )}
                                        <option value="employee">Employé</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
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
                        <div className="flex gap-3 p-6 border-t border-gray-100">
                            <button onClick={handleSave} disabled={saving}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2.5 rounded-xl transition shadow-md shadow-green-600/20">
                                {saving ? 'Sauvegarde...' : editingId ? 'Mettre à jour' : 'Créer l\'utilisateur'}
                            </button>
                            <button onClick={() => setShowModal(false)}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition">
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
