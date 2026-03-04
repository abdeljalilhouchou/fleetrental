import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, ActivityIndicator, ScrollView, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getMyRental, renterLogout, sendRenterLocation, stopRenterTracking } from '../api';

export default function RenterDashboardScreen({ navigation }) {
    const [rental, setRental]     = useState(null);
    const [loading, setLoading]   = useState(true);
    const [tracking, setTracking] = useState(false);
    const [error, setError]       = useState('');

    const locationSub = useRef(null); // subscription expo-location

    useEffect(() => {
        loadRental();
        return () => {
            // Cleanup si on quitte l'écran
            if (locationSub.current) {
                locationSub.current.remove();
                locationSub.current = null;
            }
        };
    }, []);

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const loadRental = async () => {
        try {
            const data = await getMyRental();
            setRental(data);
        } catch (e) {
            setError(e.message || 'Impossible de charger la location');
        } finally {
            setLoading(false);
        }
    };

    const startTracking = async () => {
        setError('');

        // Demander permission foreground
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission refusée', 'Activez la localisation dans les paramètres.');
            return;
        }

        try {
            // watchPositionAsync fonctionne dans Expo Go (foreground)
            const sub = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 15000,   // toutes les 15 secondes
                    distanceInterval: 10,  // ou 10 mètres de déplacement
                },
                async (loc) => {
                    const { latitude, longitude, speed } = loc.coords;
                    try {
                        await sendRenterLocation(latitude, longitude, Math.max(0, Math.round((speed || 0) * 3.6)));
                    } catch (_) {}
                }
            );

            locationSub.current = sub;
            setTracking(true);
        } catch (e) {
            setError('Impossible de démarrer le GPS : ' + e.message);
            Alert.alert('Erreur GPS', e.message);
        }
    };

    const stopTracking = async () => {
        if (locationSub.current) {
            locationSub.current.remove();
            locationSub.current = null;
        }
        try { await stopRenterTracking(); } catch (_) {}
        setTracking(false);
    };

    const handleLogout = async () => {
        await stopTracking();
        await renterLogout();
        navigation.replace('Home');
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator color="#2563eb" size="large" style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Ma Location</Text>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                        <Text style={styles.logoutText}>Déconnexion</Text>
                    </TouchableOpacity>
                </View>

                {error ? (
                    <View style={styles.errorBox}>
                        <Ionicons name="alert-circle" size={16} color="#fca5a5" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {rental ? (
                    <>
                        {/* Infos véhicule */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Véhicule loué</Text>
                            <Text style={styles.vehicleName}>
                                {rental.vehicle?.brand} {rental.vehicle?.model} ({rental.vehicle?.year})
                            </Text>
                            <Text style={styles.vehiclePlate}>{rental.vehicle?.registration_number}</Text>
                        </View>

                        {/* Dates */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Période de location</Text>
                            <View style={styles.datesRow}>
                                <View style={styles.dateBox}>
                                    <Text style={styles.dateLabel}>Départ</Text>
                                    <Text style={styles.dateValue}>{formatDate(rental.start_date)}</Text>
                                </View>
                                <Text style={styles.dateArrow}>→</Text>
                                <View style={styles.dateBox}>
                                    <Text style={styles.dateLabel}>Retour</Text>
                                    <Text style={styles.dateValue}>{formatDate(rental.end_date)}</Text>
                                </View>
                            </View>
                        </View>

                        {/* GPS Tracking */}
                        <View style={[styles.card, tracking && styles.cardActive]}>
                            <View style={styles.trackingHeader}>
                                <Text style={styles.cardTitle}>GPS Tracking</Text>
                                {tracking && (
                                    <View style={styles.activeBadge}>
                                        <View style={styles.activeDot} />
                                        <Text style={styles.activeText}>Actif</Text>
                                    </View>
                                )}
                            </View>

                            {tracking ? (
                                <>
                                    <Text style={styles.trackingInfo}>
                                        Votre position est partagée avec l'agence toutes les 15 secondes.
                                        Gardez l'application ouverte pour continuer le tracking.
                                    </Text>
                                    <TouchableOpacity style={[styles.btn, styles.btnRed]} onPress={stopTracking}>
                                        <Ionicons name="stop-circle" size={18} color="#fff" />
                                        <Text style={styles.btnText}>  Arrêter le GPS</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.trackingInfo}>
                                        Activez le GPS pour permettre à l'agence de suivre votre véhicule en temps réel.
                                    </Text>
                                    <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={startTracking}>
                                        <Ionicons name="navigate" size={18} color="#fff" />
                                        <Text style={styles.btnText}>  Démarrer le GPS</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </>
                ) : (
                    <View style={styles.emptyCard}>
                        <Ionicons name="car-outline" size={48} color="#334155" />
                        <Text style={styles.emptyText}>Aucune location active trouvée.</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:      { flex: 1, backgroundColor: '#0f172a' },
    scroll:         { padding: 20, gap: 16 },

    header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    headerTitle:    { fontSize: 22, fontWeight: '800', color: '#fff' },
    logoutBtn:      { padding: 8 },
    logoutText:     { color: '#94a3b8', fontSize: 13 },

    errorBox:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#450a0a', borderRadius: 12, padding: 12 },
    errorText:      { color: '#fca5a5', fontSize: 13, flex: 1 },

    card:           { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#334155' },
    cardActive:     { borderColor: '#16a34a' },
    cardTitle:      { color: '#94a3b8', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },

    vehicleName:    { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 4 },
    vehiclePlate:   { color: '#60a5fa', fontSize: 14, fontWeight: '600' },

    datesRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dateBox:        { alignItems: 'center' },
    dateLabel:      { color: '#94a3b8', fontSize: 12 },
    dateValue:      { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 2 },
    dateArrow:      { color: '#475569', fontSize: 18 },

    trackingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    activeBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#14532d', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    activeDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
    activeText:     { color: '#22c55e', fontSize: 12, fontWeight: '600' },
    trackingInfo:   { color: '#94a3b8', fontSize: 13, lineHeight: 20, marginVertical: 12 },

    btn:            { flexDirection: 'row', borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
    btnGreen:       { backgroundColor: '#16a34a' },
    btnRed:         { backgroundColor: '#dc2626' },
    btnText:        { color: '#fff', fontWeight: '700', fontSize: 15 },

    emptyCard:      { backgroundColor: '#1e293b', borderRadius: 16, padding: 32, alignItems: 'center', gap: 12 },
    emptyText:      { color: '#94a3b8', fontSize: 14 },
});
