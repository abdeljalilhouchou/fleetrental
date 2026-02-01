'use client';

import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { getToken } from '../../../lib/api';
import { useRouter } from 'next/navigation';
import RoleProtector from '../../components/RoleProtector';
import { Car, Plus, Edit2, Trash2, Search, CheckCircle2, Clock, AlertTriangle, XCircle, Repeat, AlertCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const STATUS_CONFIG = {
    available: {
        label: 'Disponible',
        textColor: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: CheckCircle2,
    },
    rented: {
        label: 'Louée',
        textColor: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: Clock,
    },
    maintenance: {
        label: 'En maintenance',
        textColor: 'text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        icon: AlertTriangle,
    },
    out_of_service: {
        label: 'Hors service',
        textColor: 'text-gray-700',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        icon: XCircle,
    },
};

const EMPTY_FORM = {
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    registration_number: '',
    vin: '',
    current_mileage: 0,
    purchase_date: '',
    status: 'available',
    vehicle_type: '',
    daily_rate: '',
    photo: '',
};

export default function VehiclesPage() {
    const { vehicles, user: currentUser, loading, refreshVehicles } = useData();
    
    const [showModal, setShowModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const router = useRouter();

    const headers = () => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
    });

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            let res;
            if (editingId) {
                res = await fetch(`${API_URL}/vehicles/${editingId}`, {
                    method: 'PUT',
                    headers: headers(),
                    body: JSON.stringify(form),
                });
            } else {
                res = await fetch(`${API_URL}/vehicles`, {
                    method: 'POST',
                    headers: headers(),
                    body: JSON.stringify(form),
                });
            }
            const data = await res.json();
            if (!res.ok) {
                setError(data.message || 'Erreur');
                return;
            }
            await refreshVehicles();
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
        if (!confirm('Voulez-vous vraiment supprimer ce véhicule ?')) return;
        const res = await fetch(`${API_URL}/vehicles/${id}`, {
            method: 'DELETE',
            headers: headers(),
        });
        if (res.ok) await refreshVehicles();
    };

    const handleEdit = (v) => {
        setForm({
            brand: v.brand || '',
            model: v.model || '',
            year: v.year || new Date().getFullYear(),
            registration_number: v.registration_number || '',
            vin: v.vin || '',
            current_mileage: v.current_mileage || 0,
            purchase_date: v.purchase_date || '',
            status: v.status || 'available',
            vehicle_type: v.vehicle_type || '',
            daily_rate: v.daily_rate || '',
            photo: v.photo || '',
        });
        setEditingId(v.id);
        setError('');
        setShowModal(true);
    };

    const handleCreate = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setError('');
        setShowModal(true);
    };

    const handleStatusChange = async (newStatus) => {
        if (!selectedVehicle) return;
        
        setSaving(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/vehicles/${selectedVehicle.id}/status`, {
                method: 'PUT',
                headers: headers(),
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.message || 'Erreur');
                return;
            }

            await refreshVehicles();
            setShowStatusModal(false);
            setSelectedVehicle(null);
        } catch (e) {
            setError('Erreur réseau');
        } finally {
            setSaving(false);
        }
    };

    const openStatusModal = (vehicle) => {
        setSelectedVehicle(vehicle);
        setError('');
        setShowStatusModal(true);
    };

    const isAdmin = currentUser?.role === 'company_admin' || currentUser?.role === 'super_admin';

    const filtered = vehicles.filter(v => {
        const matchesSearch = `${v.brand} ${v.model} ${v.registration_number}`.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'all' || v.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: vehicles.length,
        available: vehicles.filter(v => v.status === 'available').length,
        rented: vehicles.filter(v => v.status === 'rented').length,
        maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Chargement...</div></div>;
    }

    return (
        <RoleProtector allowedRoles={['super_admin', 'company_admin', 'employee']}>
        <div>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center">
                        <Car size={22} className="text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Véhicules</h1>
                        <p className="text-gray-400 text-sm mt-0.5">Gérez votre flotte</p>
                    </div>
                </div>
                {isAdmin && (
                    <button onClick={handleCreate}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/20 hover:shadow-lg transition flex items-center gap-2">
                        <Plus size={18} />
                        Nouveau véhicule
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
                    <div className="text-xs text-gray-400 mt-1">Total véhicules</div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="text-3xl font-bold text-green-600">{stats.available}</div>
                    <div className="text-xs text-gray-400 mt-1">Disponibles</div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="text-3xl font-bold text-red-600">{stats.rented}</div>
                    <div className="text-xs text-gray-400 mt-1">Louées</div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="text-3xl font-bold text-amber-600">{stats.maintenance}</div>
                    <div className="text-xs text-gray-400 mt-1">En maintenance</div>
                </div>
            </div>

            <div className="flex items-center gap-3 mb-5">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher un véhicule..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm text-gray-800" />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm text-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none cursor-pointer">
                    <option value="all">Tous les statuts</option>
                    <option value="available">Disponible</option>
                    <option value="rented">Louée</option>
                    <option value="maintenance">En maintenance</option>
                    <option value="out_of_service">Hors service</option>
                </select>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Car size={28} className="text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-semibold">Aucun véhicule trouvé</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase">Véhicule</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase">Type</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase">Immatriculation</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase">Kilométrage</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase">Statut</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((v) => {
                                const StatusIcon = STATUS_CONFIG[v.status]?.icon || Car;
                                const config = STATUS_CONFIG[v.status] || STATUS_CONFIG.available;

                                return (
                                    <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center">
                                                    <Car size={18} className="text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-800">{v.brand} {v.model}</div>
                                                    <div className="text-xs text-gray-400">{v.year}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{v.vehicle_type || '—'}</td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-800">{v.registration_number}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{v.current_mileage?.toLocaleString()} km</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${config.textColor} ${config.bgColor} ${config.borderColor}`}>
                                                <StatusIcon size={12} />
                                                {config.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => openStatusModal(v)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title="Changer le statut">
                                                    <Repeat size={16} />
                                                </button>
                                                {isAdmin && (
                                                    <button onClick={() => handleEdit(v)}
                                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition">
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}
                                                {isAdmin && (
                                                    <button onClick={() => handleDelete(v.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {showStatusModal && selectedVehicle && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="font-bold text-gray-800">Changer le statut</h2>
                            <p className="text-xs text-gray-400 mt-1">{selectedVehicle.brand} {selectedVehicle.model}</p>
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
                                    <AlertCircle size={14} /> {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                                    const Icon = config.icon;
                                    const isActive = selectedVehicle.status === key;
                                    
                                    return (
                                        <button key={key} onClick={() => handleStatusChange(key)}
                                            disabled={saving || isActive}
                                            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition ${
                                                isActive 
                                                    ? `${config.borderColor} ${config.bgColor} ${config.textColor}`
                                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                            } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? config.bgColor : 'bg-gray-100'}`}>
                                                <Icon size={20} className={isActive ? config.textColor : 'text-gray-400'} />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="font-semibold text-sm">{config.label}</div>
                                            </div>
                                            {isActive && <div className="text-xs font-bold">ACTUEL</div>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-100">
                            <button onClick={() => { setShowStatusModal(false); setSelectedVehicle(null); setError(''); }}
                                className="flex-1 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition">
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showModal && isAdmin && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="font-bold text-gray-800">{editingId ? 'Modifier' : 'Nouveau'} véhicule</h2>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
                                    <AlertCircle size={14} /> {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Marque</label>
                                        <input type="text" value={form.brand} onChange={(e) => setForm({...form, brand: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Modèle</label>
                                        <input type="text" value={form.model} onChange={(e) => setForm({...form, model: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Année</label>
                                        <input type="number" value={form.year} onChange={(e) => setForm({...form, year: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Type</label>
                                        <input type="text" value={form.vehicle_type} onChange={(e) => setForm({...form, vehicle_type: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Immatriculation</label>
                                    <input type="text" value={form.registration_number} onChange={(e) => setForm({...form, registration_number: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">VIN</label>
                                    <input type="text" value={form.vin} onChange={(e) => setForm({...form, vin: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Kilométrage</label>
                                        <input type="number" value={form.current_mileage} onChange={(e) => setForm({...form, current_mileage: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tarif/jour</label>
                                        <input type="number" value={form.daily_rate} onChange={(e) => setForm({...form, daily_rate: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Date d'achat</label>
                                    <input type="date" value={form.purchase_date} onChange={(e) => setForm({...form, purchase_date: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Statut</label>
                                    <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm cursor-pointer">
                                        <option value="available">Disponible</option>
                                        <option value="rented">Louée</option>
                                        <option value="maintenance">En maintenance</option>
                                        <option value="out_of_service">Hors service</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-100">
                            <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setEditingId(null); setError(''); }}
                                className="flex-1 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition">
                                Annuler
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex-1 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </RoleProtector>
    );
}
