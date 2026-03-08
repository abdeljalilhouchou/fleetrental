import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl,
    ActivityIndicator, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getStats } from '../../api';

const ACCENT = '#7c3aed';

const TYPE_LABELS = {
    oil_change:    'Vidange',
    tire_change:   'Pneus',
    brake_service: 'Freins',
    engine_repair: 'Moteur',
    inspection:    'Contrôle',
    cleaning:      'Nettoyage',
    other:         'Autre',
};

const STATUS_COLORS = {
    available:      { color: '#16a34a', bg: '#f0fdf4', label: 'Disponibles' },
    rented:         { color: '#2563eb', bg: '#eff6ff', label: 'Louées' },
    maintenance:    { color: '#d97706', bg: '#fffbeb', label: 'En maintenance' },
    out_of_service: { color: '#dc2626', bg: '#fef2f2', label: 'Hors service' },
    reserved:       { color: ACCENT,    bg: '#f5f3ff', label: 'Réservées' },
};

function KpiCard({ icon, label, value, color, bg }) {
    return (
        <View style={[styles.kpiCard, { backgroundColor: bg }]}>
            <View style={[styles.kpiIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <Text style={styles.kpiValue}>{value}</Text>
            <Text style={styles.kpiLabel}>{label}</Text>
        </View>
    );
}

export default function StatsScreen() {
    const [data,      setData]       = useState(null);
    const [loading,   setLoading]    = useState(true);
    const [refreshing,setRefreshing] = useState(false);
    const loaded = useRef(false);

    const load = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else if (!loaded.current) setLoading(true);
        try {
            const d = await getStats();
            setData(d);
            loaded.current = true;
        } catch (_) {}
        finally { setLoading(false); setRefreshing(false); }
    };

    useFocusEffect(useCallback(() => { load(); }, []));

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={ACCENT} />
        </View>
    );

    const maxCost = Math.max(...(data?.monthly_costs || []).map(m => m.cost), 1);

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[ACCENT]} />}
            >
                <Text style={styles.sectionTitle}>Aperçu général</Text>
                <View style={styles.kpiGrid}>
                    <KpiCard icon="car-sport" label="Total véhicules" value={data?.total_vehicles ?? 0} color="#2563eb" bg="#eff6ff" />
                    <KpiCard icon="construct" label="Maintenances" value={data?.total_maintenances ?? 0} color="#d97706" bg="#fffbeb" />
                    <KpiCard icon="cash" label="Coût total" value={`${Number(data?.total_cost ?? 0).toFixed(0)} MAD`} color="#dc2626" bg="#fef2f2" />
                </View>

                <Text style={styles.sectionTitle}>Véhicules par statut</Text>
                <View style={styles.card}>
                    {Object.entries(data?.vehicles_by_status || {}).map(([status, count]) => {
                        const s = STATUS_COLORS[status] || { color: '#64748b', bg: '#f1f5f9', label: status };
                        const pct = data?.total_vehicles ? Math.round((count / data.total_vehicles) * 100) : 0;
                        return (
                            <View key={status} style={styles.statusRow}>
                                <View style={[styles.statusDot, { backgroundColor: s.color }]} />
                                <Text style={styles.statusLabel}>{s.label}</Text>
                                <View style={styles.barTrack}>
                                    <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: s.color }]} />
                                </View>
                                <Text style={[styles.statusCount, { color: s.color }]}>{count}</Text>
                            </View>
                        );
                    })}
                    {!Object.keys(data?.vehicles_by_status || {}).length && (
                        <Text style={styles.emptyText}>Aucun véhicule enregistré</Text>
                    )}
                </View>

                <Text style={styles.sectionTitle}>Coûts de maintenance (6 mois)</Text>
                <View style={styles.card}>
                    {(data?.monthly_costs || []).map((m, i) => (
                        <View key={i} style={styles.barRow}>
                            <Text style={styles.barLabel}>{m.month}</Text>
                            <View style={styles.barTrack}>
                                <View style={[
                                    styles.barFill,
                                    {
                                        width: `${Math.round((m.cost / maxCost) * 100)}%`,
                                        backgroundColor: ACCENT,
                                        minWidth: m.cost > 0 ? 4 : 0,
                                    }
                                ]} />
                            </View>
                            <Text style={styles.barValue}>{m.cost > 0 ? `${Number(m.cost).toFixed(0)}` : '—'}</Text>
                        </View>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>Maintenances par type</Text>
                <View style={styles.card}>
                    {(data?.maintenance_by_type || []).map((t, i) => (
                        <View key={i} style={styles.typeRow}>
                            <View style={styles.typeLeft}>
                                <Text style={styles.typeLabel}>{TYPE_LABELS[t.type] || t.type}</Text>
                                <Text style={styles.typeCount}>{t.count} intervention{t.count > 1 ? 's' : ''}</Text>
                            </View>
                            <Text style={styles.typeCost}>{Number(t.total_cost).toFixed(0)} MAD</Text>
                        </View>
                    ))}
                    {!(data?.maintenance_by_type?.length) && (
                        <Text style={styles.emptyText}>Aucune maintenance enregistrée</Text>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe:    { flex: 1, backgroundColor: '#f8fafc' },
    center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { padding: 16, paddingBottom: 40 },

    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 10, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },

    kpiGrid: { flexDirection: 'row', gap: 10, marginBottom: 4 },
    kpiCard: {
        flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    },
    kpiIcon:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    kpiValue: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
    kpiLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', textAlign: 'center' },

    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
        borderWidth: 1, borderColor: '#f1f5f9',
    },

    statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusLabel: { fontSize: 13, color: '#475569', fontWeight: '600', width: 110 },
    statusCount: { fontSize: 13, fontWeight: '800', width: 24, textAlign: 'right' },

    barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
    barLabel: { fontSize: 11, color: '#94a3b8', width: 56, fontWeight: '600' },
    barTrack: { flex: 1, height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
    barFill:  { height: 8, borderRadius: 4 },
    barValue: { fontSize: 11, color: '#475569', fontWeight: '700', width: 40, textAlign: 'right' },

    typeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
    typeLeft: { gap: 2 },
    typeLabel: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
    typeCount: { fontSize: 12, color: '#94a3b8' },
    typeCost:  { fontSize: 14, fontWeight: '800', color: '#dc2626' },

    emptyText: { textAlign: 'center', color: '#94a3b8', paddingVertical: 20, fontSize: 14 },
});
