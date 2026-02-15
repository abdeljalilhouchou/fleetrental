'use client';

import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { getToken } from '../../../lib/api';
import RoleProtector from '../../components/RoleProtector';
import {
    Building2, Plus, Edit2, Trash2, Search, Shield, XCircle,
    AlertCircle, Car, Users, Mail, Phone, MapPin
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const EMPTY_FORM = {
    name: '',
    address: '',
    email: '',
    phone: '',
};

export default function CompaniesPage() {
    const { companies, refreshCompanies } = useData();

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
                res = await fetch(`${API_URL}/companies/${editingId}`, {
                    method: 'PUT', headers: headers(), body: JSON.stringify(form),
                });
            } else {
                res = await fetch(`${API_URL}/companies`, {
                    method: 'POST', headers: headers(), body: JSON.stringify(form),
                });
            }
            const data = await res.json();
            if (!res.ok) { setError(data.message || 'Erreur'); return; }
            await refreshCompanies();
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
        if (!confirm('Vous êtes sûr de supprimer cette entreprise ?')) return;
        const res = await fetch(`${API_URL}/companies/${id}`, { method: 'DELETE', headers: headers() });
        const data = await res.json();
        if (!res.ok) {
            setError(data.message);
            return;
        }
        await refreshCompanies();
    };

    const handleEdit = (c) => {
        setForm({
            name:    c.name || '',
            address: c.address || '',
            email:   c.email || '',
            phone:   c.phone || '',
        });
        setEditingId(c.id);
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
    const filtered = companies.filter(c =>
        `${c.name} ${c.email || ''} ${c.address || ''}`.toLowerCase().includes(search.toLowerCase())
    );

    const totalVehicles = companies.reduce((s, c) => s + (c.vehicles_count || 0), 0);
    const totalUsers    = companies.reduce((s, c) => s + (c.users_count || 0), 0);

    return (
        <RoleProtector allowedRoles={['super_admin']}>
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center">
                        <Shield size={22} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Entreprises</h1>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">Panneau Super Admin</p>
                    </div>
                </div>
                <button onClick={handleCreate}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-purple-600/20 hover:shadow-lg transition flex items-center gap-2">
                    <Plus size={18} />
                    Nouvelle entreprise
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                            <Building2 size={20} className="text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{companies.length}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Entreprises</div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                            <Car size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{totalVehicles}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Véhicules total</div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                            <Users size={20} className="text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{totalUsers}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Utilisateurs total</div>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3 mb-5">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher une entreprise..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/40 outline-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 shadow-sm" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Building2 size={28} className="text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-semibold">Aucune entreprise trouvée</p>
                        <p className="text-gray-300 dark:text-gray-600 text-sm mt-1">
                            {search ? 'Essayez de modifier votre recherche' : 'Créez votre première entreprise'}
                        </p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Entreprise</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Véhicules</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Utilisateurs</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c) => (
                                <tr key={c.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                                    {/* Entreprise */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                                <Building2 size={18} className="text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{c.name}</div>
                                                {c.address && (
                                                    <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <MapPin size={10} /> {c.address}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Contact */}
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            {c.email && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                    <Mail size={11} className="text-gray-300 dark:text-gray-600" /> {c.email}
                                                </div>
                                            )}
                                            {c.phone && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                    <Phone size={11} className="text-gray-300 dark:text-gray-600" /> {c.phone}
                                                </div>
                                            )}
                                            {!c.email && !c.phone && (
                                                <span className="text-xs text-gray-300 dark:text-gray-600">Aucun contact</span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Véhicules */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                                <Car size={13} className="text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{c.vehicles_count || 0}</span>
                                        </div>
                                    </td>

                                    {/* Utilisateurs */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                                <Users size={13} className="text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{c.users_count || 0}</span>
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleEdit(c)} className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
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
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-transparent dark:border-gray-800">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 dark:bg-purple-900/30">
                                    {editingId
                                        ? <Edit2 size={18} className="text-purple-600 dark:text-purple-400" />
                                        : <Building2 size={18} className="text-purple-600 dark:text-purple-400" />}
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-800 dark:text-gray-100">{editingId ? 'Modifier' : 'Nouvelle'} entreprise</h2>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{editingId ? 'Mettez à jour les informations' : 'Créez une nouvelle entreprise'}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                <XCircle size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-lg px-3 py-2 flex items-center gap-2">
                                    <AlertCircle size={14} /> {error}
                                </div>
                            )}

                            {/* Nom */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Nom de l&apos;entreprise</label>
                                <div className="relative">
                                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
                                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Ex: AutoLoc Paris"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/40 outline-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-800 transition" />
                                </div>
                            </div>

                            {/* Adresse */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Adresse</label>
                                <div className="relative">
                                    <MapPin size={16} className="absolute left-3.5 top-3 text-gray-300 dark:text-gray-600" />
                                    <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                                        placeholder="Ex: 15 rue de la paix, 75002 Paris" rows={2}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/40 outline-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-800 transition resize-none" />
                                </div>
                            </div>

                            {/* Email + Phone */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
                                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            placeholder="contact@entreprise.com"
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/40 outline-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-800 transition" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Téléphone</label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
                                        <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                            placeholder="01 23 45 67 89"
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/40 outline-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-800 transition" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 p-6 border-t border-gray-100 dark:border-gray-800">
                            <button onClick={handleSave} disabled={saving}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-2.5 rounded-xl transition shadow-md shadow-purple-600/20">
                                {saving ? 'Sauvegarde...' : editingId ? 'Mettre à jour' : 'Créer l\'entreprise'}
                            </button>
                            <button onClick={() => setShowModal(false)}
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
