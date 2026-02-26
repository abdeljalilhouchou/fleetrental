'use client';

import { useState, Fragment } from 'react';
import { useData } from '../../context/DataContext';
import { getToken, downloadRentalContract, exportRentalsCSV } from '../../../lib/api';
import RoleProtector from '../../components/RoleProtector';
import {
    Car, Plus, Search, User, Phone,
    CheckCircle2, XCircle, Clock,
    AlertCircle, Upload, FileText, FileImage,
    X, Eye, ChevronRight, Download
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const STORAGE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';

function FileIcon({ mimeType }) {
    if (mimeType?.startsWith('image/')) return <FileImage size={16} className="text-pink-500" />;
    return <FileText size={16} className="text-blue-500" />;
}

function formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const STATUS_CONFIG = {
    ongoing: {
        label: 'En cours',
        textColor: 'text-blue-700 dark:text-blue-300',
        bgColor: 'bg-blue-50 dark:bg-blue-900/30',
        borderColor: 'border-blue-200 dark:border-blue-800',
        icon: Clock,
    },
    completed: {
        label: 'Terminée',
        textColor: 'text-green-700 dark:text-green-300',
        bgColor: 'bg-green-50 dark:bg-green-900/30',
        borderColor: 'border-green-200 dark:border-green-800',
        icon: CheckCircle2,
    },
    cancelled: {
        label: 'Annulée',
        textColor: 'text-red-700 dark:text-red-300',
        bgColor: 'bg-red-50 dark:bg-red-900/30',
        borderColor: 'border-red-200 dark:border-red-800',
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
    const { vehicles, rentals, refreshVehicles, refreshRentals, loading, hasPermission } = useData();

    const [showModal, setShowModal] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [selectedRental, setSelectedRental] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [completeForm, setCompleteForm] = useState({ end_mileage: 0, paid_amount: 0 });
    const [expandedId, setExpandedId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const canCreate   = hasPermission('create_rentals');
    const canEdit     = hasPermission('edit_rentals');
    const canComplete = hasPermission('complete_rentals');
    const canCancel   = hasPermission('cancel_rentals');

    const [pdfLoading, setPdfLoading] = useState(null);
    const [csvLoading, setCsvLoading] = useState(false);

    const handleDownloadContract = async (rental) => {
        setPdfLoading(rental.id);
        try {
            await downloadRentalContract(rental.id);
        } catch (e) {
            setError(e.message || 'Erreur téléchargement PDF');
        } finally {
            setPdfLoading(null);
        }
    };

    const handleExportCSV = async () => {
        setCsvLoading(true);
        try {
            await exportRentalsCSV(filterStatus);
        } catch (e) {
            setError(e.message || 'Erreur export CSV');
        } finally {
            setCsvLoading(false);
        }
    };

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

    const handleFileUpload = async (rentalId, files) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            for (let file of files) {
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch(`${API_URL}/rentals/${rentalId}/files`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${getToken()}` },
                    body: formData,
                });
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || "Erreur lors de l'upload");
                }
            }
            await refreshRentals();
        } catch (e) {
            setError(`Erreur lors de l'upload: ${e.message}`);
        } finally {
            setUploading(false);
            setDragOver(false);
        }
    };

    const handleDeleteFile = async (rentalId, fileId) => {
        if (!confirm('Supprimer ce fichier ?')) return;
        const res = await fetch(`${API_URL}/rentals/${rentalId}/files/${fileId}`, {
            method: 'DELETE',
            headers: headers(),
        });
        if (res.ok) await refreshRentals();
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
        return <div className="flex items-center justify-center h-64"><div className="text-gray-400 dark:text-gray-500">Chargement...</div></div>;
    }

    return (
        <RoleProtector allowedRoles={['company_admin', 'fleet_manager', 'rental_agent', 'employee']} requiredPermission="view_rentals">
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center">
                        <Car size={22} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Locations</h1>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">Gérez vos locations de véhicules</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button onClick={handleExportCSV} disabled={csvLoading}
                        title="Exporter en CSV"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-green-600 dark:hover:text-green-400 transition text-sm font-medium disabled:opacity-50">
                        {csvLoading
                            ? <span className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin" />
                            : <Download size={16} />
                        }
                        <span className="hidden sm:inline">Exporter CSV</span>
                    </button>
                    {canCreate && (
                    <button onClick={handleCreate}
                        className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-purple-600/20 hover:shadow-lg transition flex items-center gap-2 justify-center">
                        <Plus size={18} />
                        Nouvelle location
                    </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                {[
                    { label: 'Total locations', value: rentalStats.total, filter: 'all', valueColor: 'text-gray-800 dark:text-white' },
                    { label: 'En cours', value: rentalStats.ongoing, filter: 'ongoing', valueColor: 'text-blue-600 dark:text-blue-400' },
                    { label: 'Terminées', value: rentalStats.completed, filter: 'completed', valueColor: 'text-green-600 dark:text-green-400' },
                    { label: 'Revenu total', value: `${rentalStats.revenue.toLocaleString()} MAD`, filter: null, valueColor: 'text-purple-600 dark:text-purple-400' },
                ].map((card, i) => (
                    <div
                        key={i}
                        onClick={() => card.filter !== null && setFilterStatus(filterStatus === card.filter ? 'all' : card.filter)}
                        className={`rounded-2xl border shadow-sm p-5 transition ${card.filter !== null ? 'cursor-pointer hover:shadow-md' : ''} ${
                            card.filter !== null && filterStatus === card.filter
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 ring-2 ring-blue-400/50'
                                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700'
                        }`}
                    >
                        <div className={`text-3xl font-bold ${card.valueColor}`}>{card.value}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{card.label}</div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
                <div className="relative flex-1 sm:max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher une location..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white dark:placeholder-gray-500" />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none cursor-pointer">
                    <option value="all">Tous les statuts</option>
                    <option value="ongoing">En cours</option>
                    <option value="completed">Terminée</option>
                    <option value="cancelled">Annulée</option>
                </select>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Car size={28} className="text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-semibold">Aucune location trouvée</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto"><table className="w-full min-w-[700px]">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                <th className="text-left px-4 md:px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Client</th>
                                <th className="text-left px-4 md:px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Véhicule</th>
                                <th className="text-left px-4 md:px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Dates</th>
                                <th className="text-left px-4 md:px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Prix</th>
                                <th className="text-left px-4 md:px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Statut</th>
                                <th className="text-left px-4 md:px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((r) => {
                                const vehicle = vehicles.find(v => v.id === r.vehicle_id);
                                const config = STATUS_CONFIG[r.status];
                                const StatusIcon = config?.icon || Clock;
                                const isExpanded = expandedId === r.id;

                                return (
                                    <Fragment key={r.id}>
                                    <tr className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setExpandedId(isExpanded ? null : r.id)}
                                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                                                    <ChevronRight size={14} className={`text-gray-400 dark:text-gray-500 transition ${isExpanded ? 'rotate-90' : ''}`} />
                                                </button>
                                                <div className="w-10 h-10 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl flex items-center justify-center">
                                                    <User size={18} className="text-purple-600 dark:text-purple-400" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-800 dark:text-white">{r.customer_name}</div>
                                                    <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                                        <Phone size={10} />
                                                        {r.customer_phone}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {vehicle && (
                                                <div>
                                                    <div className="text-sm font-medium text-gray-800 dark:text-white">{vehicle.brand} {vehicle.model}</div>
                                                    <div className="text-xs text-gray-400 dark:text-gray-500">{vehicle.registration_number}</div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                                {new Date(r.start_date).toLocaleDateString('fr-FR')}
                                            </div>
                                            <div className="text-xs text-gray-400 dark:text-gray-500">
                                                → {new Date(r.end_date).toLocaleDateString('fr-FR')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-gray-800 dark:text-white">
                                                {parseFloat(r.total_price).toLocaleString()} MAD
                                            </div>
                                            <div className="text-xs text-gray-400 dark:text-gray-500">
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
                                                {r.status === 'ongoing' && canComplete && (
                                                    <button onClick={() => openCompleteModal(r)}
                                                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition"
                                                        title="Terminer">
                                                        <CheckCircle2 size={16} />
                                                    </button>
                                                )}
                                                {r.status === 'ongoing' && canCancel && (
                                                    <button onClick={() => handleCancel(r.id)}
                                                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                                                        title="Annuler">
                                                        <XCircle size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>

                                    {isExpanded && (
                                        <tr>
                                            <td colSpan="6" className="bg-gray-50 dark:bg-gray-800/50 px-4 py-4">
                                                <div className="max-w-4xl">
                                                    {/* Détails de la location */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                                        <div>
                                                            <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Email</div>
                                                            <div className="text-sm text-gray-700 dark:text-gray-300">{r.customer_email || '—'}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Adresse</div>
                                                            <div className="text-sm text-gray-700 dark:text-gray-300">{r.customer_address || '—'}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">CIN / Passeport</div>
                                                            <div className="text-sm text-gray-700 dark:text-gray-300">{r.customer_id_card || '—'}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Caution</div>
                                                            <div className="text-sm text-gray-700 dark:text-gray-300">{parseFloat(r.deposit_amount).toLocaleString()} MAD</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Déjà payé</div>
                                                            <div className="text-sm text-gray-700 dark:text-gray-300">{parseFloat(r.paid_amount).toLocaleString()} MAD</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Restant</div>
                                                            <div className="text-sm font-semibold text-purple-700 dark:text-purple-400">{(parseFloat(r.total_price) - parseFloat(r.paid_amount)).toLocaleString()} MAD</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Km départ</div>
                                                            <div className="text-sm text-gray-700 dark:text-gray-300">{r.start_mileage}</div>
                                                        </div>
                                                        {r.end_mileage && (
                                                            <div>
                                                                <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Km retour</div>
                                                                <div className="text-sm text-gray-700 dark:text-gray-300">{r.end_mileage}</div>
                                                            </div>
                                                        )}
                                                        {r.notes && (
                                                            <div>
                                                                <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Notes</div>
                                                                <div className="text-sm text-gray-700 dark:text-gray-300">{r.notes}</div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Actions de la location */}
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <button
                                                            onClick={() => handleDownloadContract(r)}
                                                            disabled={pdfLoading === r.id}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition text-xs font-semibold disabled:opacity-50"
                                                        >
                                                            {pdfLoading === r.id
                                                                ? <span className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-700 rounded-full animate-spin" />
                                                                : <FileText size={13} />
                                                            }
                                                            Contrat PDF
                                                        </button>
                                                    </div>

                                                    {/* Fichiers joints */}
                                                    <div>
                                                        <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Fichiers joints</div>
                                                        {r.files && r.files.length > 0 ? (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                                                {r.files.map((file) => (
                                                                    <div key={file.id} className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
                                                                        <FileIcon mimeType={file.file_type} />
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{file.file_name}</div>
                                                                            <div className="text-xs text-gray-400 dark:text-gray-500">{formatSize(file.file_size)}</div>
                                                                        </div>
                                                                        <a href={`${STORAGE_URL}/storage/${file.file_path}`}
                                                                            target="_blank" rel="noopener noreferrer"
                                                                            className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">
                                                                            <Eye size={14} />
                                                                        </a>
                                                                        {canEdit && (
                                                                            <button onClick={() => handleDeleteFile(r.id, file.id)}
                                                                                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                                                                                <X size={14} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-gray-400 dark:text-gray-500 mb-3">Aucun fichier joint</div>
                                                        )}

                                                        <div
                                                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                                            onDragLeave={() => setDragOver(false)}
                                                            onDrop={(e) => { e.preventDefault(); handleFileUpload(r.id, e.dataTransfer.files); }}
                                                            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 hover:border-blue-400 dark:hover:border-blue-500'}`}
                                                            onClick={() => {
                                                                const input = document.createElement('input');
                                                                input.type = 'file';
                                                                input.multiple = true;
                                                                input.onchange = (e) => handleFileUpload(r.id, e.target.files);
                                                                input.click();
                                                            }}
                                                        >
                                                            <Upload size={20} className="mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                                                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                                                {uploading ? 'Upload en cours...' : 'Glissez des fichiers ou cliquez pour ajouter'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table></div>
                )}
            </div>

            {/* Modal Nouvelle Location */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="font-bold text-gray-800 dark:text-white">Nouvelle location</h2>
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
                                    <AlertCircle size={14} /> {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Véhicule */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">
                                        <Car size={14} className="inline mr-1" />
                                        Véhicule
                                    </label>
                                    <select value={form.vehicle_id} onChange={(e) => handleVehicleChange(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white cursor-pointer">
                                        <option value="">Sélectionner un véhicule</option>
                                        {vehicles.filter(v => v.status === 'available').map(v => (
                                            <option key={v.id} value={v.id}>
                                                {v.brand} {v.model} - {v.registration_number} ({v.daily_rate} MAD/jour)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Informations Client */}
                                <div className="border-t dark:border-gray-700 pt-4">
                                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Informations client</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Nom complet</label>
                                            <input type="text" value={form.customer_name} onChange={(e) => setForm({...form, customer_name: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Téléphone</label>
                                            <input type="text" value={form.customer_phone} onChange={(e) => setForm({...form, customer_phone: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Email</label>
                                            <input type="email" value={form.customer_email} onChange={(e) => setForm({...form, customer_email: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">CIN/Passeport</label>
                                            <input type="text" value={form.customer_id_card} onChange={(e) => setForm({...form, customer_id_card: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white" />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Adresse</label>
                                        <textarea value={form.customer_address} onChange={(e) => setForm({...form, customer_address: e.target.value})}
                                            rows="2"
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white resize-none" />
                                    </div>
                                </div>

                                {/* Dates et Kilométrage */}
                                <div className="border-t dark:border-gray-700 pt-4">
                                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Période de location</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Date début</label>
                                            <input type="date" value={form.start_date} onChange={(e) => setForm({...form, start_date: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Date fin</label>
                                            <input type="date" value={form.end_date} onChange={(e) => setForm({...form, end_date: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Km départ</label>
                                            <input type="number" value={form.start_mileage} onChange={(e) => setForm({...form, start_mileage: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* Prix */}
                                <div className="border-t dark:border-gray-700 pt-4">
                                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Tarification</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Tarif/jour (MAD)</label>
                                            <input type="number" value={form.daily_rate} onChange={(e) => setForm({...form, daily_rate: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Caution (MAD)</label>
                                            <input type="number" value={form.deposit_amount} onChange={(e) => setForm({...form, deposit_amount: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Déjà payé (MAD)</label>
                                            <input type="number" value={form.paid_amount} onChange={(e) => setForm({...form, paid_amount: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white" />
                                        </div>
                                    </div>
                                    <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-800">
                                        <div className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                                            Prix total estimé : {calculateTotalPrice().toLocaleString()} MAD
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Notes</label>
                                    <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})}
                                        rows="2"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white resize-none" />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-100 dark:border-gray-700">
                            <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setError(''); }}
                                className="flex-1 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition">
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
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="font-bold text-gray-800 dark:text-white">Terminer la location</h2>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{selectedRental.customer_name}</p>
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
                                    <AlertCircle size={14} /> {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Kilométrage retour</label>
                                    <input type="number" value={completeForm.end_mileage} onChange={(e) => setCompleteForm({...completeForm, end_mileage: e.target.value})}
                                        min={selectedRental.start_mileage}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white" />
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Km départ : {selectedRental.start_mileage}</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Paiement final (MAD)</label>
                                    <input type="number" value={completeForm.paid_amount} onChange={(e) => setCompleteForm({...completeForm, paid_amount: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white" />
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        Restant à payer : {(selectedRental.total_price - selectedRental.paid_amount).toLocaleString()} MAD
                                    </p>
                                </div>

                                <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-200 dark:border-green-800">
                                    <div className="text-xs font-semibold text-green-800 dark:text-green-300 mb-1">Résumé</div>
                                    <div className="text-xs text-green-700 dark:text-green-400">
                                        <div>Prix total : {parseFloat(selectedRental.total_price).toLocaleString()} MAD</div>
                                        <div>Déjà payé : {parseFloat(selectedRental.paid_amount).toLocaleString()} MAD</div>
                                        <div>Distance parcourue : {completeForm.end_mileage - selectedRental.start_mileage} km</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-100 dark:border-gray-700">
                            <button onClick={() => { setShowCompleteModal(false); setSelectedRental(null); setError(''); }}
                                className="flex-1 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition">
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