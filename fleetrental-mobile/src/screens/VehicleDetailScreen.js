import React from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Image,
    ScrollView, SafeAreaView, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FUEL_LABELS = { essence: 'Essence', diesel: 'Diesel', electrique: 'Électrique', hybride: 'Hybride' };
const TRANS_LABELS = { automatic: 'Automatique', manual: 'Manuelle' };

export default function VehicleDetailScreen({ route, navigation }) {
    const { vehicle, company } = route.params;
    const dailyRate = parseFloat(vehicle.daily_rate || 0);

    const specs = [
        vehicle.fuel_type    && { icon: 'flame-outline',    label: 'Carburant',     value: FUEL_LABELS[vehicle.fuel_type] || vehicle.fuel_type },
        vehicle.transmission && { icon: 'settings-outline', label: 'Transmission',  value: TRANS_LABELS[vehicle.transmission] || vehicle.transmission },
        vehicle.seats        && { icon: 'people-outline',   label: 'Places',        value: String(vehicle.seats) },
        vehicle.color        && { icon: 'color-palette-outline', label: 'Couleur',  value: vehicle.color },
    ].filter(Boolean);

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Photo */}
                {vehicle.photo ? (
                    <Image source={{ uri: vehicle.photo }} style={styles.photo} resizeMode="cover" />
                ) : (
                    <View style={styles.photoPlaceholder}>
                        <Ionicons name="car" size={60} color="#94a3b8" />
                    </View>
                )}

                <View style={styles.content}>
                    {/* Titre & Prix */}
                    <View style={styles.titleRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.vehicleName}>{vehicle.brand} {vehicle.model}</Text>
                            <Text style={styles.vehicleYear}>{vehicle.year} · {vehicle.registration_number}</Text>
                        </View>
                        <View style={styles.priceBox}>
                            <Text style={styles.priceAmount}>{dailyRate.toLocaleString()}</Text>
                            <Text style={styles.priceCurrency}>MAD/jour</Text>
                        </View>
                    </View>

                    {/* Badge disponible */}
                    <View style={styles.availRow}>
                        <View style={styles.availBadge}>
                            <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                            <Text style={styles.availText}>Disponible</Text>
                        </View>
                    </View>

                    {/* Caractéristiques */}
                    {specs.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Caractéristiques</Text>
                            <View style={styles.specsGrid}>
                                {specs.map((spec, i) => (
                                    <View key={i} style={styles.specCard}>
                                        <Ionicons name={spec.icon} size={20} color="#2563eb" />
                                        <Text style={styles.specValue}>{spec.value}</Text>
                                        <Text style={styles.specLabel}>{spec.label}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Entreprise */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Loueur</Text>
                        <View style={styles.companyCard}>
                            <View style={styles.companyIcon}>
                                <Ionicons name="business" size={20} color="#2563eb" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.companyName}>{company?.name || vehicle.company?.name}</Text>
                                {(company?.address || vehicle.company?.address) ? (
                                    <Text style={styles.companySub}>{company?.address || vehicle.company?.address}</Text>
                                ) : null}
                            </View>
                            {(company?.phone || vehicle.company?.phone) ? (
                                <TouchableOpacity
                                    onPress={() => Linking.openURL(`tel:${company?.phone || vehicle.company?.phone}`)}
                                    style={styles.callBtn}>
                                    <Ionicons name="call" size={18} color="#fff" />
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>

                    {/* Prix estimé */}
                    <View style={styles.estimateBox}>
                        <Ionicons name="information-circle-outline" size={16} color="#2563eb" />
                        <Text style={styles.estimateText}>
                            Pour 3 jours : <Text style={styles.estimateBold}>{(dailyRate * 3).toLocaleString()} MAD</Text> estimé
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bouton Réserver */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.bookBtn}
                    onPress={() => navigation.navigate('Booking', { vehicle, company })}
                    activeOpacity={0.88}
                >
                    <Ionicons name="calendar-outline" size={20} color="#fff" />
                    <Text style={styles.bookBtnText}>Réserver ce véhicule</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    photo: { width: '100%', height: 220 },
    photoPlaceholder: {
        width: '100%', height: 220, backgroundColor: '#f1f5f9',
        alignItems: 'center', justifyContent: 'center',
    },
    content: { padding: 20, paddingBottom: 100 },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    vehicleName: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
    vehicleYear: { fontSize: 13, color: '#64748b', marginTop: 2 },
    priceBox: { alignItems: 'flex-end', backgroundColor: '#eff6ff', padding: 10, borderRadius: 12 },
    priceAmount:   { fontSize: 20, fontWeight: '800', color: '#2563eb' },
    priceCurrency: { fontSize: 11, color: '#64748b' },
    availRow: { flexDirection: 'row', marginBottom: 20 },
    availBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: '#dcfce7', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    },
    availText: { fontSize: 12, fontWeight: '700', color: '#16a34a' },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    specCard: {
        width: '47%', backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    specValue: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginTop: 6 },
    specLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
    companyCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#fff', borderRadius: 14, padding: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    companyIcon: {
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center',
    },
    companyName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
    companySub:  { fontSize: 12, color: '#64748b', marginTop: 2 },
    callBtn: {
        width: 38, height: 38, borderRadius: 10, backgroundColor: '#2563eb',
        alignItems: 'center', justifyContent: 'center',
    },
    estimateBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#eff6ff', borderRadius: 12, padding: 12,
        borderWidth: 1, borderColor: '#bfdbfe',
    },
    estimateText: { fontSize: 13, color: '#1e40af', flex: 1 },
    estimateBold: { fontWeight: '800' },
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 16, backgroundColor: '#fff',
        borderTopWidth: 1, borderTopColor: '#f1f5f9',
    },
    bookBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 15,
        shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
    },
    bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
