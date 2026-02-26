import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    ActivityIndicator, TextInput, RefreshControl, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCompanies } from '../api';

export default function HomeScreen({ navigation }) {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');

    const fetchCompanies = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError('');
        try {
            const data = await getCompanies();
            setCompanies(data);
        } catch (e) {
            setError(e.message || 'Impossible de charger les entreprises');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchCompanies(); }, []);

    const filtered = companies.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.address?.toLowerCase().includes(search.toLowerCase())
    );

    const renderCompany = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('CompanyVehicles', { company: item })}
            activeOpacity={0.85}
        >
            <View style={styles.cardIcon}>
                <Ionicons name="business" size={22} color="#2563eb" />
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                {item.address ? (
                    <Text style={styles.cardSub} numberOfLines={1}>
                        <Ionicons name="location-outline" size={12} /> {item.address}
                    </Text>
                ) : null}
                {item.phone ? (
                    <Text style={styles.cardSub}>
                        <Ionicons name="call-outline" size={12} /> {item.phone}
                    </Text>
                ) : null}
            </View>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.available_vehicles}</Text>
                <Text style={styles.badgeLabel}>dispo</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>FleetRental</Text>
                    <Text style={styles.headerSub}>Trouvez votre véhicule idéal</Text>
                </View>
                <TouchableOpacity
                    style={styles.trackBtn}
                    onPress={() => navigation.navigate('TrackReservation')}
                >
                    <Ionicons name="search-circle" size={28} color="#2563eb" />
                </TouchableOpacity>
            </View>

            {/* Recherche */}
            <View style={styles.searchBox}>
                <Ionicons name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Rechercher une entreprise..."
                    placeholderTextColor="#94a3b8"
                    style={styles.searchInput}
                />
            </View>

            {error ? (
                <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color="#dc2626" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={() => fetchCompanies()}>
                        <Text style={styles.retryText}>Réessayer</Text>
                    </TouchableOpacity>
                </View>
            ) : loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>Chargement...</Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderCompany}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => fetchCompanies(true)} colors={['#2563eb']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="business-outline" size={48} color="#cbd5e1" />
                            <Text style={styles.emptyText}>Aucune entreprise trouvée</Text>
                        </View>
                    }
                />
            )}

            {/* Bouton suivi */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('TrackReservation')}
            >
                <Ionicons name="receipt-outline" size={22} color="#fff" />
                <Text style={styles.fabText}>Suivre ma réservation</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
    headerSub:   { fontSize: 13, color: '#64748b', marginTop: 2 },
    trackBtn:    { padding: 4 },
    searchBox: {
        flexDirection: 'row', alignItems: 'center',
        margin: 16, paddingHorizontal: 14, paddingVertical: 10,
        backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
    },
    searchInput: { flex: 1, fontSize: 14, color: '#0f172a' },
    list: { paddingHorizontal: 16, paddingBottom: 100 },
    card: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    cardIcon: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    cardBody: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
    cardSub:   { fontSize: 12, color: '#64748b', marginBottom: 2 },
    badge: { alignItems: 'center', marginRight: 12 },
    badgeText: { fontSize: 18, fontWeight: '800', color: '#2563eb' },
    badgeLabel: { fontSize: 10, color: '#64748b' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    loadingText: { marginTop: 12, color: '#64748b' },
    emptyText:   { fontSize: 15, color: '#94a3b8', marginTop: 12 },
    errorBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        margin: 16, padding: 12, backgroundColor: '#fef2f2',
        borderRadius: 12, borderWidth: 1, borderColor: '#fecaca',
    },
    errorText: { flex: 1, color: '#dc2626', fontSize: 13 },
    retryText: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
    fab: {
        position: 'absolute', bottom: 24, left: 16, right: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 14,
        shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
    },
    fabText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
