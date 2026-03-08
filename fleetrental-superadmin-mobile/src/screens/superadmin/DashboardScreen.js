import React, { useState, useCallback, useContext, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCompanies, getVehicles, getRentals, getMaintenances } from '../../api';
import { AuthContext } from '../../context/AuthContext';

const PRIMARY = '#4c1d95';
const ACCENT  = '#7c3aed';

const STATUS_V = {
    available:      { label: 'Disponible',  color: '#16a34a', bg: '#f0fdf4' },
    rented:         { label: 'Louée',        color: '#2563eb', bg: '#eff6ff' },
    maintenance:    { label: 'Maintenance',  color: '#d97706', bg: '#fffbeb' },
    out_of_service: { label: 'Hors service', color: '#dc2626', bg: '#fef2f2' },
    reserved:       { label: 'Réservée',     color: '#7c3aed', bg: '#f5f3ff' },
};

function displayPlate(value) {
    if (!value) return '—';
    return value.replace(/\s*([\u0600-\u06FF])\s*/, ' | $1 | ');
}

export default function DashboardScreen({ navigation }) {
    const { user, signOut } = useContext(AuthContext);

    const [companies,    setCompanies]    = useState([]);
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
            const [c, v, r, m] = await Promise.all([
                getCompanies().catch(() => []),
                getVehicles().catch(() => []),
                getRentals().catch(() => []),
                getMaintenances().catch(() => []),
            ]);
            setCompanies(c);
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
        { label: 'Entreprises',     value: companies.length, sub: 'actives',              icon: 'business-outline',   color: ACCENT,    bg: '#f5f3ff' },
        { label: 'Véhicules',       value: vehicles.length,  sub: `${vehicles.filter(v => v.status === 'available').length} disponibles`, icon: 'car-sport-outline', color: '#2563eb', bg: '#eff6ff' },
        { label: 'Locations actives', value: rentals.filter(r => r.status === 'ongoing').length, sub: `${rentals.length} au total`, icon: 'key-outline', color: '#16a34a', bg: '#f0fdf4' },
        { label: 'Maintenances',    value: maintenances.filter(m => m.status === 'in_progress').length, sub: 'en cours', icon: 'construct-outline', color: '#d97706', bg: '#fffbeb' },
    ];

    const recentVehicles = vehicles.slice(0, 5);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={ACCENT} />
                <Text style={styles.loadingText}>Chargement...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={[ACCENT]} />}
                contentContainerStyle={styles.scroll}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.greeting}>Bonjour, {user?.name?.split(' ')[0]} 👋</Text>
                        <View style={styles.roleBadge}>
                            <Ionicons name="shield-checkmark" size={12} color={ACCENT} />
                            <Text style={styles.roleText}>Super Administrateur</Text>
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

                {/* Accès rapide */}
                <Text style={styles.sectionTitle}>Accès rapide</Text>
                <View style={styles.quickRow}>
                    {[
                        { label: 'Entreprises', icon: 'business',   tab: 'Companies', color: ACCENT },
                        { label: 'Utilisateurs',icon: 'people',     tab: 'Users',     color: '#0284c7' },
                        { label: 'Véhicules',   icon: 'car-sport',  tab: 'Vehicles',  color: '#2563eb' },
                        { label: 'Locations',   icon: 'key',        tab: 'Rentals',   color: '#16a34a' },
                    ].map((q, i) => (
                        <TouchableOpacity
                            key={i}
                            style={styles.quickCard}
                            onPress={() => navigation.navigate(q.tab)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name={q.icon} size={24} color={q.color} />
                            <Text style={styles.quickLabel}>{q.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Entreprises récentes */}
                {companies.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Entreprises récentes</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Companies')}>
                                <Text style={[styles.seeAll, { color: ACCENT }]}>Voir toutes</Text>
                            </TouchableOpacity>
                        </View>
                        {companies.slice(0, 4).map(c => (
                            <View key={c.id} style={styles.companyRow}>
                                <View style={[styles.companyIcon, { backgroundColor: '#f5f3ff' }]}>
                                    <Ionicons name="business-outline" size={18} color={ACCENT} />
                                </View>
                                <View style={styles.companyInfo}>
                                    <Text style={styles.companyName}>{c.name}</Text>
                                    <Text style={styles.companySub}>{c.vehicles_count ?? 0} véhicules · {c.users_count ?? 0} utilisateurs</Text>
                                </View>
                            </View>
                        ))}
                    </>
                )}

                {/* Véhicules récents */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Véhicules récents</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Vehicles')}>
                        <Text style={[styles.seeAll, { color: ACCENT }]}>Voir tous</Text>
                    </TouchableOpacity>
                </View>
                {recentVehicles.map(v => {
                    const s = STATUS_V[v.status] || STATUS_V.available;
                    return (
                        <View key={v.id} style={styles.vehicleRow}>
                            <View style={styles.vehicleIcon}>
                                <Ionicons name="car-outline" size={20} color={ACCENT} />
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

    header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    headerLeft: { flex: 1 },
    greeting:   { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
    roleBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: '#f5f3ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    roleText:   { fontSize: 12, fontWeight: '600', color: ACCENT },
    logoutBtn:  { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 10 },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    statCard: {
        width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: '#e2e8f0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    statIcon:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    statValue: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
    statLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginTop: 2 },
    statSub:   { fontSize: 11, color: '#94a3b8', marginTop: 2 },

    sectionTitle:  { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 },
    seeAll:        { fontSize: 13, fontWeight: '600' },

    quickRow: { flexDirection: 'row', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
    quickCard: {
        flex: 1, minWidth: '22%', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16,
        borderWidth: 1, borderColor: '#e2e8f0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
        gap: 8,
    },
    quickLabel: { fontSize: 11, fontWeight: '600', color: '#334155', textAlign: 'center' },

    companyRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
        borderWidth: 1, borderColor: '#f1f5f9',
    },
    companyIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    companyInfo: { flex: 1 },
    companyName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
    companySub:  { fontSize: 12, color: '#64748b', marginTop: 2 },

    vehicleRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
        borderWidth: 1, borderColor: '#f1f5f9',
    },
    vehicleIcon:  { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    vehicleInfo:  { flex: 1 },
    vehicleName:  { fontSize: 14, fontWeight: '700', color: '#0f172a' },
    vehiclePlate: { fontSize: 12, color: '#64748b', marginTop: 2 },
    statusBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText:   { fontSize: 11, fontWeight: '700' },

    emptyBox:  { alignItems: 'center', paddingVertical: 30 },
    emptyText: { color: '#94a3b8', marginTop: 8 },
});
