'use client';

import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { getToken } from '../../../lib/api';
import RoleProtector from '../../components/RoleProtector';
import {
    CalendarCheck, Search, CheckCircle2, XCircle, Clock, Ban,
    User, Phone, Mail, Car, Calendar, ChevronRight, RefreshCw,
    AlertCircle, X, MessageSquare,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const STATUS_CONFIG = {
    pending: {
        label: 'En attente',
        textColor: 'text-amber-700 dark:text-amber-300',
        bgColor: 'bg-amber-50 dark:bg-amber-900/30',
        borderColor: 'border-amber-200 dark:border-amber-800',
        icon: Clock,
    },
    confirmed: {
        label: 'Confirmée',
        textColor: 'text-green-700 dark:text-green-300',
        bgColor: 'bg-green-50 dark:bg-green-900/30',
        borderColor: 'border-green-200 dark:border-green-800',
        icon: CheckCircle2,
    },
    rejected: {
        label: 'Refusée',
        textColor: 'text-red-700 dark:text-red-300',
        bgColor: 'bg-red-50 dark:bg-red-900/30',
        borderColor: 'border-red-200 dark:border-red-800',
        icon: XCircle,
    },
    cancelled: {
        label: 'Annulée',
        textColor: 'text-gray-500 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-800/50',
        borderColor: 'border-gray-200 dark:border-gray-700',
        icon: Ban,
    },
};

export default function ReservationsPage() {
    const { loading: ctxLoading, hasPermission } = useData();

    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [expandedId, setExpandedId] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [rejectModal, setRejectModal] = useState(null); // {id}
    const [rejectReason, setRejectReason] = useState('');

    const headers = () => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
    });

    const fetchReservations = async () => {
        setLoading(true);
        setError('');
        try {
            const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
            const res = await fetch(`${API_URL}/reservations${params}`, { headers: headers() });
            const data = await res.json();
            if (!res.ok) { setError(data.message || 'Erreur'); return; }
            setReservations(data);
        } catch { setError('Erreur réseau'); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (!ctxLoading) fetchReservations();
    }, [ctxLoading, filterStatus]);

    const handleConfirm = async (id) => {
        setActionLoading(id + '-confirm');
        try {
            const res = await fetch(`${API_URL}/reservations/${id}/confirm`, {
                method: 'POST', headers: headers(),
            });
            if (res.ok) await fetchReservations();
            else { const d = await res.json(); setError(d.message); }
        } catch { setError('Erreur réseau'); }
        finally { setActionLoading(null); }
    };

    const handleReject = async () => {
        if (!rejectModal) return;
        setActionLoading(rejectModal + '-reject');
        try {
            const res = await fetch(`${API_URL}/reservations/${rejectModal}/reject`, {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify({ rejection_reason: rejectReason }),
            });
            if (res.ok) { setRejectModal(null); setRejectReason(''); await fetchReservations(); }
            else { const d = await res.json(); setError(d.message); }
        } catch { setError('Erreur réseau'); }
        finally { setActionLoading(null); }
    };

    const handleCancel = async (id) => {
        if (!confirm('Annuler cette réservation ?')) return;
        setActionLoading(id + '-cancel');
        try {
            const res = await fetch(`${API_URL}/reservations/${id}/cancel`, {
                method: 'POST', headers: headers(),
            });
            if (res.ok) await fetchReservations();
            else { const d = await res.json(); setError(d.message); }
        } catch { setError('Erreur réseau'); }
        finally { setActionLoading(null); }
    };

    const filtered = reservations.filter(r => {
        const q = search.toLowerCase();
        return (
            r.customer_name?.toLowerCase().includes(q) ||
            r.customer_phone?.toLowerCase().includes(q) ||
            r.reference?.toLowerCase().includes(q) ||
            r.vehicle?.brand?.toLowerCase().includes(q) ||
            r.vehicle?.model?.toLowerCase().includes(q)
        );
    });

    const stats = {
        total:     reservations.length,
        pending:   reservations.filter(r => r.status === 'pending').length,
        confirmed: reservations.filter(r => r.status === 'confirmed').length,
        rejected:  reservations.filter(r => r.status === 'rejected').length,
    };

    return (
        <RoleProtector allowedRoles={['company_admin', 'fleet_manager', 'rental_agent']}>
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
                        <CalendarCheck size={22} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Réservations clients</h1>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">Demandes reçues via l'application mobile</p>
                    </div>
                </div>
                <button onClick={fetchReservations} disabled={loading}
                    className="p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 hover:text-indigo-600 transition disabled:opacity-50 self-start sm:self-auto">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                    <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Total', value: stats.total, color: 'text-gray-800 dark:text-white', filter: 'all' },
                    { label: 'En attente', value: stats.pending, color: 'text-amber-600', filter: 'pending' },
                    { label: 'Confirmées', value: stats.confirmed, color: 'text-green-600', filter: 'confirmed' },
                    { label: 'Refusées', value: stats.rejected, color: 'text-red-600', filter: 'rejected' },
                ].map((s, i) => (
                    <div key={i} onClick={() => setFilterStatus(s.filter === filterStatus ? 'all' : s.filter)}
                        className={`cursor-pointer rounded-2xl border shadow-sm p-5 transition hover:shadow-md
                            ${filterStatus === s.filter && s.filter !== 'all'
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-400/50'
                                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700'}`}>
                        <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Filtres */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
                <div className="relative flex-1 sm:max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher par client, référence, véhicule..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none text-sm text-gray-800 dark:text-white dark:placeholder-gray-500" />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none cursor-pointer">
                    <option value="all">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="confirmed">Confirmées</option>
                    <option value="rejected">Refusées</option>
                    <option value="cancelled">Annulées</option>
                </select>
            </div>

            {/* Tableau */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48 text-gray-400">Chargement...</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <CalendarCheck size={28} className="text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-semibold">Aucune réservation</p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Les demandes de l'application mobile apparaîtront ici</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                    <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Client</th>
                                    <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Véhicule</th>
                                    <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Dates</th>
                                    <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Réf.</th>
                                    <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Statut</th>
                                    <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(r => {
                                    const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
                                    const Icon = cfg.icon;
                                    const isExpanded = expandedId === r.id;
                                    const days = Math.round((new Date(r.end_date) - new Date(r.start_date)) / 86400000) + 1;

                                    return (
                                        <>
                                        <tr key={r.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setExpandedId(isExpanded ? null : r.id)}
                                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                                                        <ChevronRight size={14} className={`text-gray-400 transition ${isExpanded ? 'rotate-90' : ''}`} />
                                                    </button>
                                                    <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <User size={16} className="text-indigo-600 dark:text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-800 dark:text-white">{r.customer_name}</div>
                                                        <div className="text-xs text-gray-400 flex items-center gap-1">
                                                            <Phone size={10} />{r.customer_phone}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-800 dark:text-white">
                                                    {r.vehicle?.brand} {r.vehicle?.model}
                                                </div>
                                                <div className="text-xs text-gray-400">{r.vehicle?.registration_number}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                                    {new Date(r.start_date).toLocaleDateString('fr-FR')}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    → {new Date(r.end_date).toLocaleDateString('fr-FR')} · {days}j
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">
                                                    {r.reference}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${cfg.textColor} ${cfg.bgColor} ${cfg.borderColor}`}>
                                                    <Icon size={12} />
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {r.status === 'pending' && (
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => handleConfirm(r.id)}
                                                            disabled={actionLoading === r.id + '-confirm'}
                                                            title="Confirmer"
                                                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition disabled:opacity-40">
                                                            <CheckCircle2 size={16} />
                                                        </button>
                                                        <button onClick={() => { setRejectModal(r.id); setRejectReason(''); }}
                                                            title="Refuser"
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
                                                            <XCircle size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                                {r.status === 'confirmed' && (
                                                    <button onClick={() => handleCancel(r.id)}
                                                        disabled={actionLoading === r.id + '-cancel'}
                                                        title="Annuler"
                                                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition disabled:opacity-40">
                                                        <Ban size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>

                                        {isExpanded && (
                                            <tr key={r.id + '-expanded'}>
                                                <td colSpan="6" className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
                                                        <div>
                                                            <div className="text-xs font-bold text-gray-400 uppercase mb-1">Email</div>
                                                            <div className="text-sm text-gray-700 dark:text-gray-300">{r.customer_email || '—'}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-gray-400 uppercase mb-1">CIN / Passeport</div>
                                                            <div className="text-sm text-gray-700 dark:text-gray-300">{r.customer_id_number || '—'}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-gray-400 uppercase mb-1">Tarif estimé</div>
                                                            <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                                                {(days * parseFloat(r.vehicle?.daily_rate || 0)).toLocaleString()} MAD
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-gray-400 uppercase mb-1">Reçue le</div>
                                                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                                                {new Date(r.created_at).toLocaleDateString('fr-FR')}
                                                            </div>
                                                        </div>
                                                        {r.notes && (
                                                            <div className="col-span-2 md:col-span-4">
                                                                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Notes du client</div>
                                                                <div className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                                                    {r.notes}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {r.status === 'rejected' && r.rejection_reason && (
                                                            <div className="col-span-2 md:col-span-4">
                                                                <div className="text-xs font-bold text-red-400 uppercase mb-1">Motif de refus</div>
                                                                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                                                                    {r.rejection_reason}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        </>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Refus */}
            {rejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <XCircle size={18} className="text-red-500" />
                                Refuser la réservation
                            </h2>
                            <button onClick={() => setRejectModal(null)} className="text-gray-400 hover:text-gray-700">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                                <MessageSquare size={12} className="inline mr-1" />
                                Motif de refus (optionnel)
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                rows={3}
                                placeholder="Ex: Véhicule non disponible pour cette période..."
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-white outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30 resize-none"
                            />
                            <p className="text-xs text-gray-400 mt-2">Ce motif sera envoyé au client par email s'il a fourni son adresse.</p>
                        </div>
                        <div className="p-6 pt-0 flex gap-3">
                            <button onClick={() => setRejectModal(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                Annuler
                            </button>
                            <button onClick={handleReject}
                                disabled={actionLoading?.includes('-reject')}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition disabled:opacity-50">
                                Confirmer le refus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </RoleProtector>
    );
}
