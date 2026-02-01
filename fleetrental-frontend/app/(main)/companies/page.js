'use client';

import { useState, useEffect } from 'react';
import { getToken } from '../../../lib/api';
import { useRouter } from 'next/navigation';
import RoleProtector from '../../components/RoleProtector';
import {
    Building2, Plus, Edit2, Trash2, Search, Shield, XCircle,
    AlertCircle, Car, Users, CheckCircle2, Mail, Phone, MapPin
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const EMPTY_FORM = {
    name: '',
    address: '',
    email: '',
    phone: '',
};

export default function CompaniesPage() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm]           = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [error, setError]         = useState('');
    const [saving, setSaving]       = useState(false);
    const [search, setSearch]       = useState('');
    const router                    = useRouter();

    const headers = () => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
    });

    const fetchData = async () => {
        try {
            const res = await fetch(`${API_URL}/companies`, { headers: headers() });
            if (res.status === 401) { router.push('/login'); return; }
            if (res.status === 403) { router.push('/dashboard'); return; }
            setCompanies(await res.json());
        } catch (e) {
            setError('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!getToken()) { router.push('/login'); return; }
        fetchData();
    }, [router]);

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
            await fetchData();
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
        await fetchData();
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

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Chargement...</div></div>;
    }

    return (
        <RoleProtector allowedRoles={['super_admin']}>
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-purple-50 rounded-2xl flex items-center justify-center">
                        <Shield size={22} className="text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Entreprises</h1>
                        <p className="text-gray-400 text-sm mt-0.5">Panneau Super Admin</p>
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
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                            <Building2 size={20} className="text-purple-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800">{companies.length}</div>
                    <div className="text-xs text-gray-400 mt-1">Entreprises</div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Car size={20} className="text-blue-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800">{totalVehicles}</div>
                    <div className="text-xs text-gray-400 mt-1">Véhicules total</div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                            <Users size={20} className="text-green-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800">{totalUsers}</div>
                    <div className="text-xs text-gray-400 mt-1">Utilisateurs total</div>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3 mb-5">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher une entreprise..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none text-sm text-gray-800 placeholder-gray-300 shadow-sm" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Building2 size={28} className="text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-semibold">Aucune entreprise trouvée</p>
                        <p className="text-gray-300 text-sm mt-1">
                            {search ? 'Essayez de modifier votre recherche' : 'Créez votre première entreprise'}
                        </p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Entreprise</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Véhicules</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Utilisateurs</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c) => (
                                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                    {/* Entreprise */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                                                <Building2 size={18} className="text-purple-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-800">{c.name}</div>
                                                {c.address && (
                                                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
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
                                                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                                    <Mail size={11} className="text-gray-300" /> {c.email}
                                                </div>
                                            )}
                                            {c.phone && (
                                                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                                    <Phone size={11} className="text-gray-300" /> {c.phone}
                                                </div>
                                            )}
                                            {!c.email && !c.phone && (
                                                <span className="text-xs text-gray-300">Aucun contact</span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Véhicules */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                                                <Car size={13} className="text-blue-600" />
                                            </div>
                                            <span className="text-sm font-semibold text-gray-800">{c.vehicles_count || 0}</span>
                                        </div>
                                    </td>

                                    {/* Utilisateurs */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                                                <Users size={13} className="text-green-600" />
                                            </div>
                                            <span className="text-sm font-semibold text-gray-800">{c.users_count || 0}</span>
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleEdit(c)} className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
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
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${editingId ? 'bg-purple-50' : 'bg-purple-50'}`}>
                                    {editingId
                                        ? <Edit2 size={18} className="text-purple-600" />
                                        : <Building2 size={18} className="text-purple-600" />}
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-800">{editingId ? 'Modifier' : 'Nouvelle'} entreprise</h2>
                                    <p className="text-xs text-gray-400">{editingId ? 'Mettez à jour les informations' : 'Créez une nouvelle entreprise'}</p>
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
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nom de l'entreprise</label>
                                <div className="relative">
                                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Ex: AutoLoc Paris"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none text-sm text-gray-800 placeholder-gray-300 bg-gray-50 focus:bg-white transition" />
                                </div>
                            </div>

                            {/* Adresse */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Adresse</label>
                                <div className="relative">
                                    <MapPin size={16} className="absolute left-3.5 top-3 text-gray-300" />
                                    <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                                        placeholder="Ex: 15 rue de la paix, 75002 Paris" rows={2}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none text-sm text-gray-800 placeholder-gray-300 bg-gray-50 focus:bg-white transition resize-none" />
                                </div>
                            </div>

                            {/* Email + Phone */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            placeholder="contact@entreprise.com"
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none text-sm text-gray-800 placeholder-gray-300 bg-gray-50 focus:bg-white transition" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Téléphone</label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                                        <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                            placeholder="01 23 45 67 89"
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none text-sm text-gray-800 placeholder-gray-300 bg-gray-50 focus:bg-white transition" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 p-6 border-t border-gray-100">
                            <button onClick={handleSave} disabled={saving}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-2.5 rounded-xl transition shadow-md shadow-purple-600/20">
                                {saving ? 'Sauvegarde...' : editingId ? 'Mettre à jour' : 'Créer l\'entreprise'}
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
