import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    ActivityIndicator, Image, RefreshControl, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCompanyVehicles } from '../api';

const FUEL_ICONS = { essence: 'flame', diesel: 'water', electrique: 'flash', hybride: 'leaf' };
const FUEL_LABELS = { essence: 'Essence', diesel: 'Diesel', electrique: 'Électrique', hybride: 'Hybride' };

export default function CompanyVehiclesScreen({ route, navigation }) {
    const { company } = route.params;
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetchVehicles = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError('');
        try {
            const data = await getCompanyVehicles(company.id);
            setVehicles(data.vehicles || []);
        } catch (e) {
            setError(e.message || 'Erreur de chargement');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchVehicles(); }, []);

    const renderVehicle = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('VehicleDetail', { vehicle: item, company })}
            activeOpacity={0.88}
        >
            {item.photo ? (
                <Image source={{ uri: item.photo }} style={styles.photo} resizeMode="cover" />
            ) : (
                <View style={styles.photoPlaceholder}>
                    <Ionicons name="car" size={36} color="#94a3b8" />
                </View>
            )}
            <View style={styles.cardContent}>
                <Text style={styles.vehicleTitle}>{item.brand} {item.model}</Text>
                <Text style={styles.vehicleYear}>{item.year} · {item.color || ''}</Text>

                <View style={styles.chips}>
                    {item.fuel_type && (
                        <View style={styles.chip}>
                            <Ionicons name={FUEL_ICONS[item.fuel_type] || 'flame'} size={11} color="#64748b" />
                            <Text style={styles.chipText}>{FUEL_LABELS[item.fuel_type] || item.fuel_type}</Text>
                        </View>
                    )}
                    {item.transmission && (
                        <View style={styles.chip}>
                            <Ionicons name="settings-outline" size={11} color="#64748b" />
                            <Text style={styles.chipText}>{item.transmission === 'automatic' ? 'Auto' : 'Manuelle'}</Text>
                        </View>
                    )}
                    {item.seats && (
                        <View style={styles.chip}>
                            <Ionicons name="people-outline" size={11} color="#64748b" />
                            <Text style={styles.chipText}>{item.seats} places</Text>
                        </View>
                    )}
                </View>

                <View style={styles.priceRow}>
                    <Text style={styles.price}>{parseFloat(item.daily_rate || 0).toLocaleString()} MAD</Text>
                    <Text style={styles.perDay}>/jour</Text>
                    <View style={{ flex: 1 }} />
                    <View style={styles.availBadge}>
                        <Text style={styles.availText}>Disponible</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safe}>
            {/* Info entreprise */}
            <View style={styles.companyHeader}>
                <View style={styles.companyIcon}>
                    <Ionicons name="business" size={18} color="#2563eb" />
                </View>
                <View>
                    <Text style={styles.companyName}>{company.name}</Text>
                    {company.address ? <Text style={styles.companyAddress}>{company.address}</Text> : null}
                </View>
            </View>

            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={() => fetchVehicles()}>
                        <Text style={styles.retryText}>Réessayer</Text>
                    </TouchableOpacity>
                </View>
            ) : loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            ) : (
                <FlatList
                    data={vehicles}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderVehicle}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => fetchVehicles(true)} colors={['#2563eb']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="car-outline" size={48} color="#cbd5e1" />
                            <Text style={styles.emptyText}>Aucun véhicule disponible</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    companyHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        padding: 16, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    companyIcon: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center',
    },
    companyName:    { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    companyAddress: { fontSize: 12, color: '#64748b' },
    list: { padding: 16, paddingBottom: 40 },
    card: {
        backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    },
    photo: { width: '100%', height: 160 },
    photoPlaceholder: {
        width: '100%', height: 160, backgroundColor: '#f1f5f9',
        alignItems: 'center', justifyContent: 'center',
    },
    cardContent: { padding: 14 },
    vehicleTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
    vehicleYear:  { fontSize: 13, color: '#64748b', marginBottom: 8 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
        borderWidth: 1, borderColor: '#e2e8f0',
    },
    chipText: { fontSize: 11, color: '#64748b' },
    priceRow: { flexDirection: 'row', alignItems: 'center' },
    price:    { fontSize: 18, fontWeight: '800', color: '#2563eb' },
    perDay:   { fontSize: 12, color: '#64748b', marginLeft: 3, marginTop: 2 },
    availBadge: {
        backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    },
    availText: { fontSize: 11, fontWeight: '700', color: '#16a34a' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 15, color: '#94a3b8', marginTop: 12 },
    errorBox: { margin: 16, padding: 12, backgroundColor: '#fef2f2', borderRadius: 12 },
    errorText: { color: '#dc2626', fontSize: 13, marginBottom: 6 },
    retryText: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
});
