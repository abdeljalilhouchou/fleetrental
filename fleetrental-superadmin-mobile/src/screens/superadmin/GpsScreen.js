import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, RefreshControl,
    ActivityIndicator, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getGpsLocations } from '../../api';

const PRIMARY = '#4c1d95';
const ACCENT  = '#7c3aed';

const STATUS_COLOR = {
    moving:  { color: '#16a34a', bg: '#f0fdf4', label: 'En mouvement' },
    idle:    { color: '#d97706', bg: '#fffbeb', label: 'Arrêté'       },
    offline: { color: '#94a3b8', bg: '#f1f5f9', label: 'Hors ligne'   },
};

function timeSince(dateStr) {
    if (!dateStr) return '—';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)    return `il y a ${diff}s`;
    if (diff < 3600)  return `il y a ${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    return `il y a ${Math.floor(diff / 86400)}j`;
}

function formatCoord(val) {
    if (val === null || val === undefined) return '—';
    return Number(val).toFixed(5);
}

export default function GpsScreen() {
    const [locations,  setLocations]  = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter,     setFilter]     = useState('all');
    const loaded = useRef(false);

    const load = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else if (!loaded.current) setLoading(true);
        try {
            const data = await getGpsLocations();
            setLocations(Array.isArray(data) ? data : (data.data || []));
            loaded.current = true;
        } catch (_) {}
        finally { setLoading(false); setRefreshing(false); }
    };

    useFocusEffect(useCallback(() => {
        load();
        const interval = setInterval(() => load(true), 30000);
        return () => clearInterval(interval);
    }, []));

    const filtered = filter === 'all'
        ? locations
        : locations.filter(l => (l.status || 'offline') === filter);

    const counts = {
        all:     locations.length,
        moving:  locations.filter(l => l.status === 'moving').length,
        idle:    locations.filter(l => l.status === 'idle').length,
        offline: locations.filter(l => !l.status || l.status === 'offline').length,
    };

    const renderItem = ({ item: loc }) => {
        const s = STATUS_COLOR[loc.status] || STATUS_COLOR.offline;
        const vehicleLabel = loc.vehicle
            ? `${loc.vehicle.brand || ''} ${loc.vehicle.model || ''}`.trim()
            : (loc.vehicle_label || '—');
        const plate = loc.vehicle?.registration_number || loc.vehicle?.immatriculation || loc.plate || null;

        return (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    <View style={styles.carIcon}>
                        <Ionicons name="car-sport" size={20} color={PRIMARY} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.vehicleName}>{vehicleLabel}</Text>
                        {plate ? <Text style={styles.plate}>{plate}</Text> : null}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: s.color }]} />
                        <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                    </View>
                </View>

                {(loc.driver_name || loc.driver) ? (
                    <View style={styles.driverRow}>
                        <Ionicons name="person-outline" size={13} color="#94a3b8" />
                        <Text style={styles.driverText}>{loc.driver_name || loc.driver}</Text>
                    </View>
                ) : null}

                <View style={styles.coordRow}>
                    <View style={styles.coordItem}>
                        <Ionicons name="location-outline" size={13} color="#94a3b8" />
                        <Text style={styles.coordLabel}>Lat</Text>
                        <Text style={styles.coordValue}>{formatCoord(loc.latitude || loc.lat)}</Text>
                    </View>
                    <View style={styles.coordItem}>
                        <Ionicons name="navigate-outline" size={13} color="#94a3b8" />
                        <Text style={styles.coordLabel}>Lon</Text>
                        <Text style={styles.coordValue}>{formatCoord(loc.longitude || loc.lng)}</Text>
                    </View>
                    {(loc.speed !== null && loc.speed !== undefined) ? (
                        <View style={styles.coordItem}>
                            <Ionicons name="speedometer-outline" size={13} color="#94a3b8" />
                            <Text style={styles.coordLabel}>Vitesse</Text>
                            <Text style={styles.coordValue}>{Number(loc.speed).toFixed(0)} km/h</Text>
                        </View>
                    ) : null}
                </View>

                <View style={styles.lastSeenRow}>
                    <Ionicons name="time-outline" size={12} color="#cbd5e1" />
                    <Text style={styles.lastSeenText}>
                        Dernière position : {timeSince(loc.updated_at || loc.last_seen)}
                    </Text>
                </View>
            </View>
        );
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={ACCENT} /></View>;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.summaryBar}>
                <View style={styles.summaryItem}>
                    <View style={[styles.dot, { backgroundColor: '#16a34a' }]} />
                    <Text style={styles.summaryCount}>{counts.moving}</Text>
                    <Text style={styles.summaryLabel}>En mvt</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <View style={[styles.dot, { backgroundColor: '#d97706' }]} />
                    <Text style={styles.summaryCount}>{counts.idle}</Text>
                    <Text style={styles.summaryLabel}>Arrêtés</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <View style={[styles.dot, { backgroundColor: '#94a3b8' }]} />
                    <Text style={styles.summaryCount}>{counts.offline}</Text>
                    <Text style={styles.summaryLabel}>Hors ligne</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Ionicons name="car-sport-outline" size={14} color={PRIMARY} />
                    <Text style={styles.summaryCount}>{counts.all}</Text>
                    <Text style={styles.summaryLabel}>Total</Text>
                </View>
            </View>

            <View style={styles.filterRow}>
                {[
                    { key: 'all',     label: 'Tous',         color: PRIMARY },
                    { key: 'moving',  label: 'En mouvement', color: '#16a34a' },
                    { key: 'idle',    label: 'Arrêtés',      color: '#d97706' },
                    { key: 'offline', label: 'Hors ligne',   color: '#94a3b8' },
                ].map(f => (
                    <TouchableOpacity
                        key={f.key}
                        style={[styles.filterChip, filter === f.key && { backgroundColor: f.color }]}
                        onPress={() => setFilter(f.key)}
                    >
                        <Text style={[styles.filterText, filter === f.key && { color: '#fff' }]}>
                            {f.label}{counts[f.key] > 0 ? ` (${counts[f.key]})` : ''}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filtered}
                keyExtractor={item => String(item.id || item.vehicle_id || Math.random())}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[ACCENT]} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="location-outline" size={52} color="#cbd5e1" />
                        <Text style={styles.emptyTitle}>Aucun véhicule localisé</Text>
                        <Text style={styles.emptyText}>
                            Les positions GPS s'affichent ici quand les véhicules transmettent leur localisation.
                        </Text>
                    </View>
                }
            />

            <View style={styles.refreshNote}>
                <Ionicons name="sync-outline" size={12} color="#94a3b8" />
                <Text style={styles.refreshNoteText}>Actualisation automatique toutes les 30s</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe:   { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    summaryBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12,
        borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
        borderWidth: 1, borderColor: '#f1f5f9',
    },
    summaryItem:    { flex: 1, alignItems: 'center', gap: 3 },
    summaryDivider: { width: 1, height: 30, backgroundColor: '#e2e8f0' },
    summaryCount:   { fontSize: 18, fontWeight: '800', color: '#0f172a' },
    summaryLabel:   { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
    dot:            { width: 8, height: 8, borderRadius: 4 },

    filterRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10, flexWrap: 'wrap' },
    filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
    filterText: { fontSize: 11, fontWeight: '600', color: '#64748b' },

    list: { paddingHorizontal: 16, paddingBottom: 60 },

    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
        borderWidth: 1, borderColor: '#f1f5f9',
    },
    cardTop:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
    carIcon:    { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center' },
    vehicleName:{ fontSize: 14, fontWeight: '700', color: '#0f172a' },
    plate:      { fontSize: 12, color: '#64748b', marginTop: 2, fontFamily: 'monospace' },

    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 },
    statusDot:   { width: 7, height: 7, borderRadius: 4 },
    statusText:  { fontSize: 11, fontWeight: '700' },

    driverRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
    driverText: { fontSize: 12, color: '#475569' },

    coordRow:  { flexDirection: 'row', gap: 12, marginBottom: 8 },
    coordItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    coordLabel:{ fontSize: 11, color: '#94a3b8', fontWeight: '600' },
    coordValue:{ fontSize: 12, color: '#334155', fontWeight: '600' },

    lastSeenRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    lastSeenText:{ fontSize: 11, color: '#cbd5e1' },

    empty:      { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#475569', marginTop: 12 },
    emptyText:  { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center', lineHeight: 20 },

    refreshNote:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8 },
    refreshNoteText: { fontSize: 11, color: '#94a3b8' },
});
