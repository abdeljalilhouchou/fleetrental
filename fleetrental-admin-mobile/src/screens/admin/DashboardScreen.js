import React, { useState, useCallback, useContext, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getVehicles, getRentals, getMaintenances } from '../../api';
import { AuthContext } from '../../context/AuthContext';

const ROLE_LABELS = {
    company_admin:  'Company Admin',
    fleet_manager:  'Gestionnaire de flotte',
    rental_agent:   'Agent de location',
    mechanic:       'Mécanicien',
    employee:       'Employé',
    super_admin:    'Super Admin',
};

export default function DashboardScreen({ navigation }) {
    const { user, signOut } = useContext(AuthContext);

    const [vehicles,     setVehicles]     = useState([]);
    const [rentals,      setRentals]      = useState([]);
    const [maintenances, setMaintenances] = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [refreshing,   setRefreshing]   = useState(false);

    const loaded = useRef(false);

    const loadData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else if (!loaded.current) setLoading(true);
        try {
            const [v, r, m] = await Promise.all([
                getVehicles().catch(() => []),
                getRentals().catch(() => []),
                getMaintenances().catch(() => []),
            ]);
            setVehicles(v);
            setRentals(r);
            setMaintenances(m);
            loaded.current = true;
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const stats = [
        {
            label: 'Véhicules',
            value: vehicles.length,
            sub: `${vehicles.filter(v => v.status === 'available').length} disponibles`,
            icon: 'car-sport-outline',
            color: '#2563eb',
            bg:    '#eff6ff',
        },
        {
            label: 'Locations actives',
            value: rentals.filter(r => r.status === 'active').length,
            sub:   `${rentals.length} au total`,
            icon:  'key-outline',
            color: '#16a34a',
            bg:    '#f0fdf4',
        },
        {
            label: 'Maintenances',
            value: maintenances.filter(m => m.status === 'in_progress').length,
            sub:   'en cours',
            icon:  'construct-outline',
            color: '#d97706',
            bg:    '#fffbeb',
        },
        {
            label: 'Hors service',
            value: vehicles.filter(v => v.status === 'out_of_service').length,
            sub:   'véhicules',
            icon:  'close-circle-outline',
            color: '#dc2626',
            bg:    '#fef2f2',
        },
    ];

    const recentVehicles = vehicles.slice(0, 5);

    const STATUS_V = {
        available:      { label: 'Disponible',   color: '#16a34a', bg: '#f0fdf4' },
        rented:         { label: 'Louée',         color: '#2563eb', bg: '#eff6ff' },
        maintenance:    { label: 'Maintenance',   color: '#d97706', bg: '#fffbeb' },
        out_of_service: { label: 'Hors service',  color: '#dc2626', bg: '#fef2f2' },
        reserved:       { label: 'Réservée',      color: '#7c3aed', bg: '#f5f3ff' },
    };

    function displayPlate(value) {
        if (!value) return '—';
        return value.replace(/\s*([\u0600-\u06FF])\s*/, ' | $1 | ');
    }

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Chargement...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={['#2563eb']} />}
                contentContainerStyle={styles.scroll}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.greeting}>Bonjour, {user?.name?.split(' ')[0]} 👋</Text>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>{ROLE_LABELS[user?.role] || user?.role}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
                        <Ionicons name="log-out-outline" size={22} color="#64748b" />
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                <View style={styles.statsGrid}>
                    {stats.map((s, i) => (
                        <View key={i} style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                                <Ionicons name={s.icon} size={22} color={s.color} />
                            </View>
                            <Text style={styles.statValue}>{s.value}</Text>
                            <Text style={styles.statLabel}>{s.label}</Text>
                            <Text style={styles.statSub}>{s.sub}</Text>
                        </View>
                    ))}
                </View>

                {/* Raccourcis */}
                <Text style={styles.sectionTitle}>Accès rapide</Text>
                <View style={styles.quickRow}>
                    {[
                        { label: 'Véhicules', icon: 'car-sport', tab: 'Vehicles' },
                        { label: 'Locations',  icon: 'key',       tab: 'Rentals' },
                        { label: 'Maintenance',icon: 'construct', tab: 'Maintenances' },
                    ].map((q, i) => (
                        <TouchableOpacity
                            key={i}
                            style={styles.quickCard}
                            onPress={() => navigation.navigate(q.tab)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name={q.icon} size={26} color="#2563eb" />
                            <Text style={styles.quickLabel}>{q.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Véhicules récents */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Véhicules récents</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Vehicles')}>
                        <Text style={styles.seeAll}>Voir tous</Text>
                    </TouchableOpacity>
                </View>

                {recentVehicles.map(v => {
                    const s = STATUS_V[v.status] || STATUS_V.available;
                    return (
                        <View key={v.id} style={styles.vehicleRow}>
                            <View style={styles.vehicleIcon}>
                                <Ionicons name="car-outline" size={20} color="#2563eb" />
                            </View>
                            <View style={styles.vehicleInfo}>
                                <Text style={styles.vehicleName}>{v.brand} {v.model} {v.year}</Text>
                                <Text style={styles.vehiclePlate}>{displayPlate(v.registration_number)}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                                <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                            </View>
                        </View>
                    );
                })}

                {recentVehicles.length === 0 && (
                    <View style={styles.emptyBox}>
                        <Ionicons name="car-outline" size={36} color="#cbd5e1" />
                        <Text style={styles.emptyText}>Aucun véhicule</Text>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe:        { flex: 1, backgroundColor: '#f8fafc' },
    scroll:      { padding: 20, paddingBottom: 40 },
    center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { marginTop: 10, color: '#64748b' },

    // Header
    header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    headerLeft: { flex: 1 },
    greeting:   { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
    roleBadge:  { alignSelf: 'flex-start', backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    roleText:   { fontSize: 12, fontWeight: '600', color: '#2563eb' },
    logoutBtn:  { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 10 },

    // Stats grid
    statsGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24,
    },
    statCard: {
        width: '47%',
        backgroundColor: '#fff',
        borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: '#e2e8f0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    statIcon:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    statValue: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
    statLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginTop: 2 },
    statSub:   { fontSize: 11, color: '#94a3b8', marginTop: 2 },

    // Quick actions
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 },
    seeAll:       { fontSize: 13, fontWeight: '600', color: '#2563eb' },
    quickRow:     { flexDirection: 'row', gap: 10, marginBottom: 4 },
    quickCard: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#fff', borderRadius: 16, paddingVertical: 18,
        borderWidth: 1, borderColor: '#e2e8f0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
        gap: 8,
    },
    quickLabel: { fontSize: 12, fontWeight: '600', color: '#334155', textAlign: 'center' },

    // Vehicle rows
    vehicleRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
        borderWidth: 1, borderColor: '#f1f5f9',
    },
    vehicleIcon: {
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center',
        marginRight: 12,
    },
    vehicleInfo: { flex: 1 },
    vehicleName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
    vehiclePlate:{ fontSize: 12, color: '#64748b', marginTop: 2, fontFamily: 'monospace' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText:  { fontSize: 11, fontWeight: '700' },

    emptyBox:  { alignItems: 'center', paddingVertical: 30 },
    emptyText: { color: '#94a3b8', marginTop: 8 },
});
