import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, RefreshControl,
    ActivityIndicator, SafeAreaView, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getReservations, confirmReservation, rejectReservation } from '../../api';

const PRIMARY = '#4c1d95';
const ACCENT  = '#7c3aed';

const STATUS_CONFIG = {
    pending:   { label: 'En attente', color: '#d97706', bg: '#fffbeb', icon: 'time' },
    confirmed: { label: 'Confirmée',  color: '#16a34a', bg: '#f0fdf4', icon: 'checkmark-circle' },
    rejected:  { label: 'Rejetée',   color: '#dc2626', bg: '#fef2f2', icon: 'close-circle' },
    cancelled: { label: 'Annulée',   color: '#64748b', bg: '#f1f5f9', icon: 'ban' },
};

function formatDate(str) {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ReservationsScreen() {
    const [reservations, setReservations] = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [refreshing,   setRefreshing]   = useState(false);
    const [filter,       setFilter]       = useState('all');
    const [actionId,     setActionId]     = useState(null);
    const loaded = useRef(false);

    const load = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else if (!loaded.current) setLoading(true);
        try {
            const data = await getReservations();
            setReservations(Array.isArray(data) ? data : (data.data || []));
            loaded.current = true;
        } catch (_) {}
        finally { setLoading(false); setRefreshing(false); }
    };

    useFocusEffect(useCallback(() => { load(); }, []));

    const handleConfirm = (r) => {
        Alert.alert(
            'Confirmer la réservation',
            `Confirmer la réservation de ${r.customer_name || r.name} pour ${r.vehicle?.brand} ${r.vehicle?.model} ?`,
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Oui, confirmer',
                    onPress: async () => {
                        setActionId(r.id);
                        try { await confirmReservation(r.id); load(true); }
                        catch (e) { Alert.alert('Erreur', e.message); }
                        finally { setActionId(null); }
                    },
                },
            ]
        );
    };

    const handleReject = (r) => {
        Alert.alert(
            'Rejeter la réservation',
            `Rejeter la réservation de ${r.customer_name || r.name} ?`,
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Oui, rejeter', style: 'destructive',
                    onPress: async () => {
                        setActionId(r.id);
                        try { await rejectReservation(r.id); load(true); }
                        catch (e) { Alert.alert('Erreur', e.message); }
                        finally { setActionId(null); }
                    },
                },
            ]
        );
    };

    const filtered = filter === 'all' ? reservations : reservations.filter(r => r.status === filter);

    const counts = {
        all:       reservations.length,
        pending:   reservations.filter(r => r.status === 'pending').length,
        confirmed: reservations.filter(r => r.status === 'confirmed').length,
        rejected:  reservations.filter(r => r.status === 'rejected').length,
    };

    const renderItem = ({ item: r }) => {
        const s = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
        const isPending = r.status === 'pending';
        const isActioning = actionId === r.id;
        const customerName = r.customer_name || r.name || 'Client';
        const vehicleLabel = r.vehicle ? `${r.vehicle.brand} ${r.vehicle.model}` : '—';

        return (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    <View style={styles.clientIcon}>
                        <Ionicons name="person-outline" size={18} color={PRIMARY} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.clientName}>{customerName}</Text>
                        <Text style={styles.vehicleLabel}>{vehicleLabel}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                        <Ionicons name={s.icon} size={11} color={s.color} />
                        <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                    </View>
                </View>

                <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                        <Ionicons name="calendar-outline" size={13} color="#94a3b8" />
                        <Text style={styles.infoText}>{formatDate(r.start_date)} → {formatDate(r.end_date)}</Text>
                    </View>
                    {r.customer_phone || r.phone ? (
                        <View style={styles.infoItem}>
                            <Ionicons name="call-outline" size={13} color="#94a3b8" />
                            <Text style={styles.infoText}>{r.customer_phone || r.phone}</Text>
                        </View>
                    ) : null}
                    {r.total_price || r.estimated_price ? (
                        <View style={styles.infoItem}>
                            <Ionicons name="cash-outline" size={13} color="#94a3b8" />
                            <Text style={styles.infoText}>{Number(r.total_price || r.estimated_price).toFixed(0)} MAD</Text>
                        </View>
                    ) : null}
                    {r.reference && (
                        <View style={styles.infoItem}>
                            <Ionicons name="bookmark-outline" size={13} color="#94a3b8" />
                            <Text style={styles.infoText}>Réf. {r.reference}</Text>
                        </View>
                    )}
                </View>

                {isPending && (
                    <View style={styles.actionBtns}>
                        <TouchableOpacity
                            style={[styles.rejectBtn, isActioning && { opacity: 0.5 }]}
                            onPress={() => handleReject(r)}
                            disabled={isActioning}
                        >
                            {isActioning
                                ? <ActivityIndicator size="small" color="#dc2626" />
                                : <><Ionicons name="close-circle-outline" size={16} color="#dc2626" /><Text style={styles.rejectBtnText}>Rejeter</Text></>
                            }
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.confirmBtn, isActioning && { opacity: 0.5 }]}
                            onPress={() => handleConfirm(r)}
                            disabled={isActioning}
                        >
                            {isActioning
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <><Ionicons name="checkmark-circle-outline" size={16} color="#fff" /><Text style={styles.confirmBtnText}>Confirmer</Text></>
                            }
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={ACCENT} /></View>;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.filterRow}>
                {[
                    { key: 'all',       label: 'Toutes',     color: PRIMARY },
                    { key: 'pending',   label: 'En attente', color: '#d97706' },
                    { key: 'confirmed', label: 'Confirmées', color: '#16a34a' },
                    { key: 'rejected',  label: 'Rejetées',   color: '#dc2626' },
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
                keyExtractor={item => String(item.id)}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[ACCENT]} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>Aucune réservation{filter !== 'all' ? ' dans cette catégorie' : ''}</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe:   { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    filterRow: { flexDirection: 'row', gap: 6, padding: 16, paddingBottom: 8 },
    filterChip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
    filterText: { fontSize: 11, fontWeight: '600', color: '#64748b' },

    list: { paddingHorizontal: 16, paddingBottom: 40 },

    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
        borderWidth: 1, borderColor: '#f1f5f9',
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
    clientIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center' },
    clientName:   { fontSize: 14, fontWeight: '700', color: '#0f172a' },
    vehicleLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
    statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText:   { fontSize: 10, fontWeight: '700' },

    infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    infoText: { fontSize: 12, color: '#64748b' },

    actionBtns: { flexDirection: 'row', gap: 8, marginTop: 10 },
    rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1.5, borderColor: '#dc2626', borderRadius: 10, paddingVertical: 10 },
    rejectBtnText: { color: '#dc2626', fontWeight: '700', fontSize: 13 },
    confirmBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#16a34a', borderRadius: 10, paddingVertical: 10 },
    confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

    empty:     { alignItems: 'center', paddingVertical: 60 },
    emptyText: { color: '#94a3b8', marginTop: 10, fontSize: 15 },
});
