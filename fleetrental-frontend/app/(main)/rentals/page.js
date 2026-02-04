'use client';

import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { getToken } from '../../../lib/api';
import RoleProtector from '../../components/RoleProtector';
import {
    Car, Plus, Search, User, Phone,
    CheckCircle2, XCircle, Clock,
    AlertCircle
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const STATUS_CONFIG = {
    ongoing: {
        label: 'En cours',
        textColor: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        icon: Clock,
    },
    completed: {
        label: 'Terminée',
        textColor: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: CheckCircle2,
    },
    cancelled: {
        label: 'Annulée',
        textColor: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: XCircle,
    },
};

const EMPTY_FORM = {
    vehicle_id: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    customer_id_card: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    start_mileage: 0,
    daily_rate: 0,
    deposit_amount: 0,
    paid_amount: 0,
    notes: '',
};

export default function RentalsPage() {
    const { vehicles, rentals, refreshVehicles, refreshRentals, loading } = useData();

    const [showModal, setShowModal] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [selectedRental, setSelectedRental] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [completeForm, setCompleteForm] = useState({ end_mileage: 0, paid_amount: 0 });

    const headers = () => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
    });

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/rentals`, {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify(form),
            });

            const data = await res.json();
            
            if (!res.ok) {
                setError(data.message || 'Erreur');
                setSaving(false);
                return;
            }

            await Promise.all([refreshRentals(), refreshVehicles()]);

            setShowModal(false);
            setForm(EMPTY_FORM);

        } catch (e) {
            setError('Erreur réseau: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleComplete = async () => {
        if (!selectedRental) return;

        setSaving(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/rentals/${selectedRental.id}/complete`, {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify(completeForm),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.message || 'Erreur');
                setSaving(false);
                return;
            }

            await Promise.all([refreshRentals(), refreshVehicles()]);

            setShowCompleteModal(false);
            setSelectedRental(null);
            setCompleteForm({ end_mileage: 0, paid_amount: 0 });

        } catch (e) {
            setError('Erreur réseau: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async (id) => {
        if (!confirm('Voulez-vous vraiment annuler cette location ?')) return;

        const res = await fetch(`${API_URL}/rentals/${id}/cancel`, {
            method: 'POST',
            headers: headers(),
        });

        if (res.ok) {
            await Promise.all([refreshRentals(), refreshVehicles()]);
        }
    };

    const handleCreate = () => {
        setForm(EMPTY_FORM);
        setError('');
        setShowModal(true);
    };

    const openCompleteModal = (rental) => {
        setSelectedRental(rental);
        setCompleteForm({
            end_mileage: rental.vehicle?.current_mileage || rental.start_mileage,
            paid_amount: rental.total_price - rental.paid_amount,
        });
        setError('');
        setShowCompleteModal(true);
    };

    const handleVehicleChange = (vehicleId) => {
        const vehicle = vehicles.find(v => v.id === parseInt(vehicleId));
        if (vehicle) {
            setForm({
                ...form,
                vehicle_id: vehicleId,
                start_mileage: vehicle.current_mileage || 0,
                daily_rate: vehicle.daily_rate || 0,
            });
        }
    };

    const calculateTotalPrice = () => {
        if (!form.start_date || !form.end_date || !form.daily_rate) return 0;
        const start = new Date(form.start_date);
        const end = new Date(form.end_date);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        return days * parseFloat(form.daily_rate);
    };

    const filtered = rentals.filter(r => {
        const vehicle = vehicles.find(v => v.id === r.vehicle_id);
        const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.registration_number}` : '';
        const matchSearch = `${r.customer_name} ${r.customer_phone} ${vehicleName}`.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || r.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const rentalStats = {
        total: rentals.length,
        ongoing: rentals.filter(r => r.status === 'ongoing').length,
        completed: rentals.filter(r => r.status === 'completed').length,
        revenue: rentals.filter(r => r.status === 'completed').reduce((sum, r) => sum + parseFloat(r.total_price), 0),
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Chargement...</div></div>;
    }

    return (
        <RoleProtector allowedRoles={['company_admin', 'employee']}>
        <div>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-purple-50 rounded-2xl flex items-center justify-center">
                        <Car size={22} className="text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Locations</h1>
                        <p className="text-gray-400 text-sm mt-0.5">Gérez vos locations de véhicules</p>
                    </div>
                </div>
                <button onClick={handleCreate}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-purple-600/20 hover:shadow-lg transition flex items-center gap-2">
                    <Plus size={18} />
                    Nouvelle location
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="text-3xl font-bold text-gray-800">{rentalStats.total}</div>
                    <div className="text-xs text-gray-400 mt-1">Total locations</div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="text-3xl font-bold text-blue-600">{rentalStats.ongoing}</div>
                    <div className="text-xs text-gray-400 mt-1">En cours</div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="text-3xl font-bold text-green-600">{rentalStats.completed}</div>
                    <div className="text-xs text-gray-400 mt-1">Terminées</div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="text-3xl font-bold text-purple-600">{rentalStats.revenue.toLocaleString()} MAD</div>
                    <div className="text-xs text-gray-400 mt-1">Revenu total</div>
                </div>
            </div>

            <div className="flex items-center gap-3 mb-5">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher une location..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm text-gray-800" />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm text-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none cursor-pointer">
                    <option value="all">Tous les statuts</option>
                    <option value="ongoing">En cours</option>
                    <option value="completed">Terminée</option>
                    <option value="cancelled">Annulée</option>
                </select>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Car size={28} className="text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-semibold">Aucune location trouvée</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase">Client</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase">Véhicule</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase">Dates</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase">Prix</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase">Statut</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((r) => {
                                const vehicle = vehicles.find(v => v.id === r.vehicle_id);
                                const config = STATUS_CONFIG[r.status];
                                const StatusIcon = config?.icon || Clock;

                                return (
                                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center">
                                                    <User size={18} className="text-purple-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-800">{r.customer_name}</div>
                                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Phone size={10} />
                                                        {r.customer_phone}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {vehicle && (
                                                <div>
                                                    <div className="text-sm font-medium text-gray-800">{vehicle.brand} {vehicle.model}</div>
                                                    <div className="text-xs text-gray-400">{vehicle.registration_number}</div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-700">
                                                {new Date(r.start_date).toLocaleDateString('fr-FR')}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                → {new Date(r.end_date).toLocaleDateString('fr-FR')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-gray-800">
                                                {parseFloat(r.total_price).toLocaleString()} MAD
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {parseFloat(r.daily_rate).toLocaleString()} MAD/jour
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${config?.textColor} ${config?.bgColor} ${config?.borderColor}`}>
                                                <StatusIcon size={12} />
                                                {config?.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                {r.status === 'ongoing' && (
                                                    <>
                                                        <button onClick={() => openCompleteModal(r)}
                                                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                                                            title="Terminer">
                                                            <CheckCircle2 size={16} />
                                                        </button>
                                                        <button onClick={() => handleCancel(r.id)}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                            title="Annuler">
                                                            <XCircle size={16} />
                                                        </button>
                                                    </>
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

            {/* Modal Nouvelle Location */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="font-bold text-gray-800">Nouvelle location</h2>
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
                                    <AlertCircle size={14} /> {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Véhicule */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                                        <Car size={14} className="inline mr-1" />
                                        Véhicule
                                    </label>
                                    <select value={form.vehicle_id} onChange={(e) => handleVehicleChange(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm cursor-pointer">
                                        <option value="">Sélectionner un véhicule</option>
                                        {vehicles.filter(v => v.status === 'available').map(v => (
                                            <option key={v.id} value={v.id}>
                                                {v.brand} {v.model} - {v.registration_number} ({v.daily_rate} MAD/jour)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Informations Client */}
                                <div className="border-t pt-4">
                                    <h3 className="text-sm font-bold text-gray-700 mb-3">Informations client</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nom complet</label>
                                            <input type="text" value={form.customer_name} onChange={(e) => setForm({...form, customer_name: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Téléphone</label>
                                            <input type="text" value={form.customer_phone} onChange={(e) => setForm({...form, customer_phone: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Email</label>
                                            <input type="email" value={form.customer_email} onChange={(e) => setForm({...form, customer_email: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">CIN/Passeport</label>
                                            <input type="text" value={form.customer_id_card} onChange={(e) => setForm({...form, customer_id_card: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm" />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Adresse</label>
                                        <textarea value={form.customer_address} onChange={(e) => setForm({...form, customer_address: e.target.value})}
                                            rows="2"
                                            className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm resize-none" />
                                    </div>
                                </div>

                                {/* Dates et Kilométrage */}
                                <div className="border-t pt-4">
                                    <h3 className="text-sm font-bold text-gray-700 mb-3">Période de location</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Date début</label>
                                            <input type="date" value={form.start_date} onChange={(e) => setForm({...form, start_date: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Date fin</label>
                                            <input type="date" value={form.end_date} onChange={(e) => setForm({...form, end_date: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Km départ</label>
                                            <input type="number" value={form.start_mileage} onChange={(e) => setForm({...form, start_mileage: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm" />
                                        </div>
                                    </div>
                                </div>

                                {/* Prix */}
                                <div className="border-t pt-4">
                                    <h3 className="text-sm font-bold text-gray-700 mb-3">Tarification</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tarif/jour (MAD)</label>
                                            <input type="number" value={form.daily_rate} onChange={(e) => setForm({...form, daily_rate: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Caution (MAD)</label>
                                            <input type="number" value={form.deposit_amount} onChange={(e) => setForm({...form, deposit_amount: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Déjà payé (MAD)</label>
                                            <input type="number" value={form.paid_amount} onChange={(e) => setForm({...form, paid_amount: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm" />
                                        </div>
                                    </div>
                                    <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                                        <div className="text-sm font-semibold text-purple-800">
                                            Prix total estimé : {calculateTotalPrice().toLocaleString()} MAD
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Notes</label>
                                    <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})}
                                        rows="2"
                                        className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm resize-none" />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-100">
                            <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setError(''); }}
                                className="flex-1 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition">
                                Annuler
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex-1 px-5 py-2.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition disabled:opacity-50">
                                {saving ? 'Enregistrement...' : 'Créer la location'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Terminer Location */}
            {showCompleteModal && selectedRental && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="font-bold text-gray-800">Terminer la location</h2>
                            <p className="text-xs text-gray-400 mt-1">{selectedRental.customer_name}</p>
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
                                    <AlertCircle size={14} /> {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Kilométrage retour</label>
                                    <input type="number" value={completeForm.end_mileage} onChange={(e) => setCompleteForm({...completeForm, end_mileage: e.target.value})}
                                        min={selectedRental.start_mileage}
                                        className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm" />
                                    <p className="text-xs text-gray-400 mt-1">Km départ : {selectedRental.start_mileage}</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Paiement final (MAD)</label>
                                    <input type="number" value={completeForm.paid_amount} onChange={(e) => setCompleteForm({...completeForm, paid_amount: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm" />
                                    <p className="text-xs text-gray-400 mt-1">
                                        Restant à payer : {(selectedRental.total_price - selectedRental.paid_amount).toLocaleString()} MAD
                                    </p>
                                </div>

                                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                                    <div className="text-xs font-semibold text-green-800 mb-1">Résumé</div>
                                    <div className="text-xs text-green-700">
                                        <div>Prix total : {parseFloat(selectedRental.total_price).toLocaleString()} MAD</div>
                                        <div>Déjà payé : {parseFloat(selectedRental.paid_amount).toLocaleString()} MAD</div>
                                        <div>Distance parcourue : {completeForm.end_mileage - selectedRental.start_mileage} km</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-100">
                            <button onClick={() => { setShowCompleteModal(false); setSelectedRental(null); setError(''); }}
                                className="flex-1 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition">
                                Annuler
                            </button>
                            <button onClick={handleComplete} disabled={saving}
                                className="flex-1 px-5 py-2.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50">
                                {saving ? 'Traitement...' : 'Terminer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </RoleProtector>
    );
}