'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { apiRequest } from '@/lib/api';
import { MapPin, RefreshCw, Car, User, Gauge, Wifi, WifiOff } from 'lucide-react';

// Leaflet ne supporte pas le SSR — import dynamique obligatoire
const GpsMap = dynamic(() => import('../../components/GpsMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-slate-800 rounded-2xl">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Chargement de la carte...</p>
            </div>
        </div>
    ),
});

export default function GpsPage() {
    const [locations, setLocations]   = useState([]);
    const [loading, setLoading]       = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [online, setOnline]         = useState(true);

    const fetchLocations = useCallback(async () => {
        try {
            const data = await apiRequest('/gps/active-locations');
            setLocations(Array.isArray(data) ? data : []);
            setLastUpdate(new Date());
            setOnline(true);
        } catch {
            setOnline(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLocations();
        const interval = setInterval(fetchLocations, 10000);
        return () => clearInterval(interval);
    }, [fetchLocations]);

    return (
        <div className="h-screen flex flex-col p-4 gap-4 bg-slate-900">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600/20 rounded-xl flex items-center justify-center">
                        <MapPin size={20} className="text-green-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Suivi GPS en temps réel</h1>
                        <p className="text-slate-400 text-xs">Mise à jour toutes les 10 secondes</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {online
                        ? <span className="flex items-center gap-1.5 text-green-400 text-xs"><Wifi size={14} /> En ligne</span>
                        : <span className="flex items-center gap-1.5 text-red-400 text-xs"><WifiOff size={14} /> Hors ligne</span>
                    }
                    <button
                        onClick={fetchLocations}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition"
                    >
                        <RefreshCw size={16} className="text-slate-300" />
                    </button>
                </div>
            </div>

            {/* ── Contenu principal ── */}
            <div className="flex flex-1 gap-4 min-h-0">

                {/* ── Carte (gauche) ── */}
                <div className="flex-1 min-h-0 rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800 rounded-2xl">
                            <div className="text-center">
                                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-slate-400 text-sm">Connexion au serveur GPS...</p>
                            </div>
                        </div>
                    ) : (
                        <GpsMap locations={locations} />
                    )}
                </div>

                {/* ── Liste des véhicules actifs (droite) ── */}
                <div className="w-72 flex flex-col gap-3 overflow-y-auto">
                    {/* Compteur */}
                    <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-slate-400 text-sm">Véhicules actifs</span>
                            <span className={`w-2.5 h-2.5 rounded-full ${online ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                        </div>
                        <p className="text-3xl font-bold text-white">{locations.length}</p>
                        {lastUpdate && (
                            <p className="text-slate-500 text-xs mt-1">
                                Mis à jour à {lastUpdate.toLocaleTimeString()}
                            </p>
                        )}
                    </div>

                    {/* Cartes véhicules */}
                    {locations.length === 0 ? (
                        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 text-center flex-1 flex flex-col items-center justify-center gap-3">
                            <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                                <Car size={22} className="text-slate-500" />
                            </div>
                            <p className="text-slate-400 text-sm">Aucun véhicule</p>
                            <p className="text-slate-500 text-xs">En attente de connexion des chauffeurs via l&apos;app mobile</p>
                        </div>
                    ) : (
                        locations.map((loc) => (
                            <div key={loc.vehicle_id} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 hover:border-green-500/50 transition">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 bg-green-600/20 rounded-xl flex items-center justify-center shrink-0">
                                        <Car size={16} className="text-green-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-semibold text-sm truncate">{loc.vehicle_name}</p>
                                        <p className="text-slate-400 text-xs">{loc.plate}</p>
                                    </div>
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse mt-1.5 shrink-0" />
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <div className="bg-slate-700/50 rounded-lg p-2">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <User size={11} className="text-slate-400" />
                                            <span className="text-slate-400 text-xs">Chauffeur</span>
                                        </div>
                                        <p className="text-white text-xs font-medium truncate">{loc.driver_name}</p>
                                    </div>
                                    <div className="bg-slate-700/50 rounded-lg p-2">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <Gauge size={11} className="text-slate-400" />
                                            <span className="text-slate-400 text-xs">Vitesse</span>
                                        </div>
                                        <p className="text-white text-xs font-medium">{loc.speed} km/h</p>
                                    </div>
                                </div>
                                <p className="text-slate-500 text-xs mt-2">{loc.last_seen_at}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
