'use client';

import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { getToken, storageUrl } from '../../../lib/api';
import { useRouter } from 'next/navigation';
import RoleProtector from '../../components/RoleProtector';
import { Car, Plus, Edit2, Trash2, Search, CheckCircle2, Clock, AlertTriangle, XCircle, Repeat, AlertCircle, Eye, Camera, LayoutGrid, List, FileText, Download, Shield, Wrench, FileCheck } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const STATUS_CONFIG = {
    available: {
        label: 'Disponible',
        textColor: 'text-green-700 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/30',
        borderColor: 'border-green-200 dark:border-green-800',
        icon: CheckCircle2,
    },
    rented: {
        label: 'Louée',
        textColor: 'text-red-700 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/30',
        borderColor: 'border-red-200 dark:border-red-800',
        icon: Clock,
    },
    maintenance: {
        label: 'En maintenance',
        textColor: 'text-amber-700 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-900/30',
        borderColor: 'border-amber-200 dark:border-amber-800',
        icon: AlertTriangle,
    },
    out_of_service: {
        label: 'Hors service',
        textColor: 'text-gray-700 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-800/50',
        borderColor: 'border-gray-200 dark:border-gray-700',
        icon: XCircle,
    },
};

const DOC_TYPES = {
    carte_grise:        { label: 'Carte Grise',          icon: FileCheck },
    assurance:          { label: 'Assurance',             icon: Shield },
    controle_technique: { label: 'Contrôle Technique',   icon: Wrench },
    vignette:           { label: 'Vignette',              icon: FileText },
    autre:              { label: 'Autre',                 icon: FileText },
};

const EMPTY_DOC_FORM = { type: 'assurance', name: '', expiry_date: '', notes: '', file_data: '', file_name: '', mime_type: '' };

const getDocStatus = (doc) => {
    if (!doc.expiry_date) return 'valid';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const expiry = new Date(doc.expiry_date);
    const diffDays = Math.ceil((expiry - today) / 86400000);
    if (diffDays < 0)  return 'expired';
    if (diffDays <= 30) return 'expiring';
    return 'valid';
};

const DOC_STATUS_CONFIG = {
    valid:    { label: 'Valide',          cls: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30' },
    expiring: { label: 'Expire bientôt', cls: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30' },
    expired:  { label: 'Expiré',         cls: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30' },
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
    const [detailVehicle, setDetailVehicle] = useState(null);
    const [failedPhotos, setFailedPhotos] = useState(new Set());
    const [viewMode, setViewMode] = useState('cards');
    // Documents
    const [docTab, setDocTab]           = useState('info');
    const [vehicleDocs, setVehicleDocs] = useState([]);
    const [docsLoading, setDocsLoading] = useState(false);
    const [showDocForm, setShowDocForm] = useState(false);
    const [docForm, setDocForm]         = useState(EMPTY_DOC_FORM);
    const [docSaving, setDocSaving]     = useState(false);
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

    const handleUploadPhoto = async (vehicleId, file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('photo', file);
        try {
            const res = await fetch(`${API_URL}/vehicles/${vehicleId}/photo`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getToken()}`, 'Accept': 'application/json' },
                body: formData,
            });
            if (res.ok) {
                const updated = await res.json();
                setFailedPhotos(prev => { const next = new Set(prev); next.delete(vehicleId); return next; });
                setDetailVehicle(updated);
                await refreshVehicles();
            } else {
                const data = await res.json();
                setError(data.message || 'Erreur lors du téléchargement');
            }
        } catch (e) {
            setError('Erreur réseau');
        }
    };

    // Réinitialiser l'onglet documents quand on change de véhicule
    useEffect(() => {
        if (detailVehicle) {
            setDocTab('info');
            setVehicleDocs([]);
            setShowDocForm(false);
            setDocForm(EMPTY_DOC_FORM);
        }
    }, [detailVehicle?.id]);

    const loadVehicleDocs = async (vehicleId) => {
        setDocsLoading(true);
        try {
            const res = await fetch(`${API_URL}/vehicles/${vehicleId}/documents`, { headers: headers() });
            if (res.ok) setVehicleDocs(await res.json());
        } catch (e) { console.error(e); }
        finally { setDocsLoading(false); }
    };

    const handleDocFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setError('Fichier trop volumineux (max 5MB)'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => setDocForm(prev => ({ ...prev, file_data: ev.target.result, file_name: file.name, mime_type: file.type }));
        reader.readAsDataURL(file);
    };

    const handleAddDoc = async () => {
        if (!detailVehicle || !docForm.name) return;
        setDocSaving(true); setError('');
        try {
            const res = await fetch(`${API_URL}/vehicles/${detailVehicle.id}/documents`, {
                method: 'POST', headers: headers(), body: JSON.stringify(docForm),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.message || 'Erreur'); return; }
            setVehicleDocs(prev => [...prev, data]);
            setShowDocForm(false);
            setDocForm(EMPTY_DOC_FORM);
        } catch (e) { setError('Erreur réseau'); }
        finally { setDocSaving(false); }
    };

    const handleDeleteDoc = async (docId) => {
        if (!confirm('Supprimer ce document ?')) return;
        try {
            const res = await fetch(`${API_URL}/documents/${docId}`, { method: 'DELETE', headers: headers() });
            if (res.ok) setVehicleDocs(prev => prev.filter(d => d.id !== docId));
        } catch (e) { setError('Erreur réseau'); }
    };

    const handleDownloadDoc = async (doc) => {
        try {
            const res = await fetch(`${API_URL}/documents/${doc.id}/download`, { headers: headers() });
            if (res.ok) {
                const data = await res.json();
                const link = document.createElement('a');
                link.href = data.file_data;
                link.download = data.file_name || 'document';
                link.click();
            }
        } catch (e) { setError('Erreur lors du téléchargement'); }
    };

    const openDocTab = () => {
        setDocTab('docs');
        if (vehicleDocs.length === 0 && !docsLoading) loadVehicleDocs(detailVehicle.id);
    };

    const photoUrl = (v) => {
        if (!v?.photo || failedPhotos.has(v.id)) return null;
        // base64 data URL stockée en BDD → utiliser directement
        if (v.photo.startsWith('data:')) return v.photo;
        // ancien chemin fichier → construire URL
        return storageUrl(v.photo);
    };
    const onPhotoError = (id) => setFailedPhotos(prev => new Set(prev).add(id));

    const isAdmin = ['company_admin', 'super_admin', 'fleet_manager'].includes(currentUser?.role);

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
        return <div className="flex items-center justify-center h-64"><div className="text-gray-400 dark:text-gray-500">Chargement...</div></div>;
    }

    return (
        <RoleProtector allowedRoles={['company_admin', 'fleet_manager', 'rental_agent', 'mechanic', 'employee']}>
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                        <Car size={22} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">Véhicules</h1>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">Gérez votre flotte</p>
                    </div>
                </div>
                {isAdmin && (
                    <button onClick={handleCreate}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/20 hover:shadow-lg transition flex items-center gap-2 w-full sm:w-auto justify-center">
                        <Plus size={18} />
                        Nouveau véhicule
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                {[
                    { label: 'Total véhicules', value: stats.total, filter: 'all', valueColor: 'text-gray-800 dark:text-gray-100' },
                    { label: 'Disponibles', value: stats.available, filter: 'available', valueColor: 'text-green-600 dark:text-green-400' },
                    { label: 'Louées', value: stats.rented, filter: 'rented', valueColor: 'text-red-600 dark:text-red-400' },
                    { label: 'En maintenance', value: stats.maintenance, filter: 'maintenance', valueColor: 'text-amber-600 dark:text-amber-400' },
                ].map((card) => (
                    <div
                        key={card.filter}
                        onClick={() => setFilterStatus(filterStatus === card.filter ? 'all' : card.filter)}
                        className={`rounded-2xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition ${
                            filterStatus === card.filter
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 ring-2 ring-blue-400/50'
                                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                        }`}
                    >
                        <div className={`text-3xl font-bold ${card.valueColor}`}>{card.value}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{card.label}</div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
                <div className="relative flex-1 sm:max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher un véhicule..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 outline-none text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600" />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 outline-none cursor-pointer">
                    <option value="all">Tous les statuts</option>
                    <option value="available">Disponible</option>
                    <option value="rented">Louée</option>
                    <option value="maintenance">En maintenance</option>
                    <option value="out_of_service">Hors service</option>
                </select>
                {/* Toggle vue */}
                <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-1 gap-1">
                    <button onClick={() => setViewMode('cards')}
                        className={`p-2 rounded-lg transition ${viewMode === 'cards' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        title="Vue cartes">
                        <LayoutGrid size={16} />
                    </button>
                    <button onClick={() => setViewMode('table')}
                        className={`p-2 rounded-lg transition ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        title="Vue tableau">
                        <List size={16} />
                    </button>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Car size={28} className="text-gray-300 dark:text-gray-600" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-semibold">Aucun véhicule trouvé</p>
                </div>
            ) : viewMode === 'cards' ? (
                /* ── Vue Cartes ── */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((v) => {
                        const config = STATUS_CONFIG[v.status] || STATUS_CONFIG.available;
                        const StatusIcon = config.icon;
                        return (
                            <div key={v.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
                                {/* Photo */}
                                <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                                    {photoUrl(v) ? (
                                        <img src={photoUrl(v)} alt={`${v.brand} ${v.model}`} className="w-full h-full object-cover" onError={() => onPhotoError(v.id)} />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-gray-300 dark:text-gray-600">
                                            <Car size={36} />
                                        </div>
                                    )}
                                    {/* Badge statut */}
                                    <span className={`absolute top-2 left-2 inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg border ${config.textColor} ${config.bgColor} ${config.borderColor}`}>
                                        <StatusIcon size={11} />
                                        {config.label}
                                    </span>
                                </div>
                                {/* Infos */}
                                <div className="p-4 flex-1 flex flex-col gap-1">
                                    <div className="font-bold text-gray-800 dark:text-gray-100 text-sm">{v.brand} {v.model}</div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500">{v.year} {v.vehicle_type ? `· ${v.vehicle_type}` : ''}</div>
                                    <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-1">{v.registration_number}</div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-gray-400 dark:text-gray-500">{v.current_mileage?.toLocaleString()} km</span>
                                        {v.daily_rate && (
                                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{Number(v.daily_rate).toLocaleString()} MAD/j</span>
                                        )}
                                    </div>
                                </div>
                                {/* Actions */}
                                <div className="flex items-center gap-1 px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                                    <button onClick={() => setDetailVehicle(v)}
                                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 py-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
                                        title="Voir les détails">
                                        <Eye size={14} /> Détails
                                    </button>
                                    <button onClick={() => openStatusModal(v)}
                                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                                        title="Changer le statut">
                                        <Repeat size={14} /> Statut
                                    </button>
                                    {isAdmin && (
                                        <button onClick={() => handleEdit(v)}
                                            className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition">
                                            <Edit2 size={14} />
                                        </button>
                                    )}
                                    {isAdmin && (
                                        <button onClick={() => handleDelete(v.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* ── Vue Tableau ── */
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto"><table className="w-full min-w-[700px]">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Véhicule</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Type</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Immatriculation</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Kilométrage</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Statut</th>
                                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((v) => {
                                const StatusIcon = STATUS_CONFIG[v.status]?.icon || Car;
                                const config = STATUS_CONFIG[v.status] || STATUS_CONFIG.available;
                                return (
                                    <tr key={v.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                                                    {photoUrl(v) ? (
                                                        <img src={photoUrl(v)} alt={`${v.brand} ${v.model}`} className="w-full h-full object-cover" onError={() => onPhotoError(v.id)} />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center">
                                                            <Car size={18} className="text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{v.brand} {v.model}</div>
                                                    <div className="text-xs text-gray-400 dark:text-gray-500">{v.year}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{v.vehicle_type || '—'}</td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-800 dark:text-gray-200">{v.registration_number}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{v.current_mileage?.toLocaleString()} km</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${config.textColor} ${config.bgColor} ${config.borderColor}`}>
                                                <StatusIcon size={12} />
                                                {config.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => setDetailVehicle(v)}
                                                    className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition"
                                                    title="Voir les détails">
                                                    <Eye size={16} />
                                                </button>
                                                <button onClick={() => openStatusModal(v)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                                                    title="Changer le statut">
                                                    <Repeat size={16} />
                                                </button>
                                                {isAdmin && (
                                                    <button onClick={() => handleEdit(v)}
                                                        className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition">
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}
                                                {isAdmin && (
                                                    <button onClick={() => handleDelete(v.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table></div>
                </div>
            )}

            {showStatusModal && selectedVehicle && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-transparent dark:border-gray-800">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                            <h2 className="font-bold text-gray-800 dark:text-gray-100">Changer le statut</h2>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{selectedVehicle.brand} {selectedVehicle.model}</p>
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
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
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                                            } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? config.bgColor : 'bg-gray-100 dark:bg-gray-800'}`}>
                                                <Icon size={20} className={isActive ? config.textColor : 'text-gray-400 dark:text-gray-500'} />
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

                        <div className="flex gap-3 p-6 border-t border-gray-100 dark:border-gray-800">
                            <button onClick={() => { setShowStatusModal(false); setSelectedVehicle(null); setError(''); }}
                                className="flex-1 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showModal && isAdmin && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-transparent dark:border-gray-800">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                            <h2 className="font-bold text-gray-800 dark:text-gray-100">{editingId ? 'Modifier' : 'Nouveau'} véhicule</h2>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
                                    <AlertCircle size={14} /> {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Marque</label>
                                        <input type="text" value={form.brand} onChange={(e) => setForm({...form, brand: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 outline-none text-sm text-gray-800 dark:text-gray-200" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Modèle</label>
                                        <input type="text" value={form.model} onChange={(e) => setForm({...form, model: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 outline-none text-sm text-gray-800 dark:text-gray-200" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Année</label>
                                        <input type="number" value={form.year} onChange={(e) => setForm({...form, year: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 outline-none text-sm text-gray-800 dark:text-gray-200" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Type</label>
                                        <input type="text" value={form.vehicle_type} onChange={(e) => setForm({...form, vehicle_type: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 outline-none text-sm text-gray-800 dark:text-gray-200" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Immatriculation</label>
                                    <input type="text" value={form.registration_number} onChange={(e) => setForm({...form, registration_number: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 outline-none text-sm text-gray-800 dark:text-gray-200" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">VIN</label>
                                    <input type="text" value={form.vin} onChange={(e) => setForm({...form, vin: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 outline-none text-sm text-gray-800 dark:text-gray-200" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Kilométrage</label>
                                        <input type="number" value={form.current_mileage} onChange={(e) => setForm({...form, current_mileage: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 outline-none text-sm text-gray-800 dark:text-gray-200" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Tarif/jour</label>
                                        <input type="number" value={form.daily_rate} onChange={(e) => setForm({...form, daily_rate: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 outline-none text-sm text-gray-800 dark:text-gray-200" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Date d'achat</label>
                                    <input type="date" value={form.purchase_date} onChange={(e) => setForm({...form, purchase_date: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 outline-none text-sm text-gray-800 dark:text-gray-200" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Statut</label>
                                    <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 outline-none text-sm text-gray-800 dark:text-gray-200 cursor-pointer">
                                        <option value="available">Disponible</option>
                                        <option value="rented">Louée</option>
                                        <option value="maintenance">En maintenance</option>
                                        <option value="out_of_service">Hors service</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-100 dark:border-gray-800">
                            <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setEditingId(null); setError(''); }}
                                className="flex-1 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition">
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
            {/* ── Modal Détails véhicule ── */}
            {detailVehicle && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-transparent dark:border-gray-800">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                    <Car size={18} className="text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-800 dark:text-gray-100">{detailVehicle.brand} {detailVehicle.model}</h2>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{detailVehicle.year} · {detailVehicle.vehicle_type || '—'}</p>
                                </div>
                            </div>
                            <button onClick={() => { setDetailVehicle(null); setError(''); }} className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                <XCircle size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 dark:border-gray-800 px-6">
                            <button onClick={() => setDocTab('info')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition -mb-px ${docTab === 'info' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                                Informations
                            </button>
                            <button onClick={openDocTab} className={`px-4 py-3 text-sm font-semibold border-b-2 transition -mb-px flex items-center gap-1.5 ${docTab === 'docs' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                                <FileText size={13} /> Documents
                                {vehicleDocs.some(d => getDocStatus(d) !== 'valid') && (
                                    <span className="w-2 h-2 rounded-full bg-amber-500 ml-0.5" />
                                )}
                            </button>
                        </div>

                        {docTab === 'info' && (<>
                        {/* Photo */}
                        <div className="p-6 pb-0">
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
                                    <AlertCircle size={14} /> {error}
                                </div>
                            )}
                            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 aspect-video flex items-center justify-center relative">
                                {photoUrl(detailVehicle) ? (
                                    <img src={photoUrl(detailVehicle)} alt={`${detailVehicle.brand} ${detailVehicle.model}`} className="w-full h-full object-cover absolute inset-0" onError={() => onPhotoError(detailVehicle.id)} />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-gray-300 dark:text-gray-600">
                                        <Car size={40} />
                                        <span className="text-xs">Aucune photo</span>
                                    </div>
                                )}
                                {isAdmin && (
                                    <label className="absolute bottom-3 right-3 bg-white dark:bg-gray-800 bg-opacity-90 hover:bg-opacity-100 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5 transition hover:shadow-md">
                                        <Camera size={14} />
                                        {photoUrl(detailVehicle) ? 'Changer' : 'Ajouter photo'}
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadPhoto(detailVehicle.id, e.target.files?.[0])} />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Détails */}
                        <div className="p-6 space-y-3">
                            <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800">
                                <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-bold">Statut</span>
                                {(() => {
                                    const cfg = STATUS_CONFIG[detailVehicle.status] || STATUS_CONFIG.available;
                                    const Icon = cfg.icon;
                                    return (
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${cfg.textColor} ${cfg.bgColor} ${cfg.borderColor}`}>
                                            <Icon size={12} /> {cfg.label}
                                        </span>
                                    );
                                })()}
                            </div>
                            <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800">
                                <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-bold">Immatriculation</span>
                                <span className="text-sm font-mono text-gray-800 dark:text-gray-200">{detailVehicle.registration_number}</span>
                            </div>
                            <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800">
                                <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-bold">VIN</span>
                                <span className="text-sm font-mono text-gray-600 dark:text-gray-400">{detailVehicle.vin || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800">
                                <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-bold">Kilométrage</span>
                                <span className="text-sm text-gray-800 dark:text-gray-200">{detailVehicle.current_mileage?.toLocaleString()} km</span>
                            </div>
                            <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800">
                                <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-bold">Tarif / jour</span>
                                <span className="text-sm text-gray-800 dark:text-gray-200">
                                    {detailVehicle.daily_rate ? new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(detailVehicle.daily_rate) : '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2.5">
                                <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-bold">Date d&apos;achat</span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {detailVehicle.purchase_date ? new Date(detailVehicle.purchase_date).toLocaleDateString('fr-FR') : '—'}
                                </span>
                            </div>
                        </div>
                        </>)}

                        {/* ── Onglet Documents ── */}
                        {docTab === 'docs' && (
                        <div className="p-6">
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
                                    <AlertCircle size={14} /> {error}
                                </div>
                            )}

                            {/* Bouton ajouter */}
                            {isAdmin && !showDocForm && (
                                <button onClick={() => setShowDocForm(true)}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 mb-4 border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 rounded-xl hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition text-sm font-medium">
                                    <Plus size={15} /> Ajouter un document
                                </button>
                            )}

                            {/* Formulaire ajout */}
                            {isAdmin && showDocForm && (
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Type</label>
                                            <select value={docForm.type} onChange={e => setDocForm({...docForm, type: e.target.value})}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500">
                                                {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Date d&apos;expiration</label>
                                            <input type="date" value={docForm.expiry_date} onChange={e => setDocForm({...docForm, expiry_date: e.target.value})}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Nom du document *</label>
                                        <input type="text" value={docForm.name} onChange={e => setDocForm({...docForm, name: e.target.value})}
                                            placeholder="ex: Assurance Tous Risques 2026"
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Fichier (PDF / image, max 5MB)</label>
                                        <input type="file" accept=".pdf,image/*" onChange={handleDocFileChange}
                                            className="w-full text-xs text-gray-500 dark:text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 dark:file:bg-blue-900/30 dark:file:text-blue-400 hover:file:bg-blue-100 cursor-pointer" />
                                        {docForm.file_name && <p className="text-xs text-gray-400 mt-1">📎 {docForm.file_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Notes</label>
                                        <textarea value={docForm.notes} onChange={e => setDocForm({...docForm, notes: e.target.value})}
                                            rows={2} placeholder="Notes optionnelles..."
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500 resize-none" />
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <button onClick={() => { setShowDocForm(false); setDocForm(EMPTY_DOC_FORM); setError(''); }}
                                            className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                            Annuler
                                        </button>
                                        <button onClick={handleAddDoc} disabled={!docForm.name || docSaving}
                                            className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                                            {docSaving ? 'Enregistrement...' : 'Enregistrer'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Liste des documents */}
                            {docsLoading ? (
                                <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">Chargement...</div>
                            ) : vehicleDocs.length === 0 ? (
                                <div className="text-center py-10">
                                    <FileText size={32} className="mx-auto text-gray-200 dark:text-gray-700 mb-2" />
                                    <p className="text-gray-400 dark:text-gray-500 text-sm">Aucun document</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {vehicleDocs.map(doc => {
                                        const status = doc.expiry_status || getDocStatus(doc);
                                        const stCfg  = DOC_STATUS_CONFIG[status];
                                        const TypeIcon = DOC_TYPES[doc.type]?.icon || FileText;
                                        return (
                                            <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                                <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <TypeIcon size={16} className="text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{doc.name}</div>
                                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                        <span className="text-xs text-gray-400 dark:text-gray-500">{DOC_TYPES[doc.type]?.label || doc.type}</span>
                                                        {doc.expiry_date && (
                                                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${stCfg.cls}`}>
                                                                {status === 'expired' ? 'Expiré' : new Date(doc.expiry_date).toLocaleDateString('fr-FR')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {doc.notes && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{doc.notes}</div>}
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    {doc.file_name && (
                                                        <button onClick={() => handleDownloadDoc(doc)}
                                                            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                                                            title="Télécharger">
                                                            <Download size={14} />
                                                        </button>
                                                    )}
                                                    {isAdmin && (
                                                        <button onClick={() => handleDeleteDoc(doc.id)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                            title="Supprimer">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        )}

                        {/* Footer */}
                        <div className="flex gap-3 p-6 border-t border-gray-100 dark:border-gray-800">
                            {isAdmin && (
                                <button onClick={() => { setDetailVehicle(null); handleEdit(detailVehicle); }}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2">
                                    <Edit2 size={16} /> Modifier
                                </button>
                            )}
                            <button onClick={() => { setDetailVehicle(null); setError(''); }}
                                className="flex-1 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </RoleProtector>
    );
}
