import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, ActivityIndicator, ScrollView, Alert
} from 'react-native';
import * as Location from 'expo-location';
import { BACKGROUND_LOCATION_TASK } from '../../App';
import { getMyRental, renterLogout, stopRenterTracking } from '../api';

export default function RenterDashboardScreen({ navigation }) {
    const [rental, setRental]         = useState(null);
    const [loading, setLoading]       = useState(true);
    const [tracking, setTracking]     = useState(false);
    const [error, setError]           = useState('');

    useEffect(() => {
        loadRental();
        checkTrackingStatus();
    }, []);

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

    const checkTrackingStatus = async () => {
        const isRegistered = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false);
        setTracking(isRegistered);
    };

    const startTracking = async () => {
        setError('');
        // Permission foreground
        const { status: fg } = await Location.requestForegroundPermissionsAsync();
        if (fg !== 'granted') {
            Alert.alert('Permission refusée', 'Activez la localisation dans les paramètres.');
            return;
        }
        // Permission background
        const { status: bg } = await Location.requestBackgroundPermissionsAsync();
        if (bg !== 'granted') {
            Alert.alert(
                'Permission background requise',
                'Pour continuer le tracking quand l\'app est en arrière-plan, allez dans Paramètres → Localisation → Toujours.'
            );
        }

        try {
            await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
                accuracy: Location.Accuracy.High,
                timeInterval: 15000,
                distanceInterval: 10,
                foregroundService: {
                    notificationTitle: 'FleetRental GPS actif',
                    notificationBody:  'Votre position est partagée avec l\'agence',
                    notificationColor: '#2563eb',
                },
                pausesUpdatesAutomatically: false,
                showsBackgroundLocationIndicator: true,
            });
            setTracking(true);
        } catch (e) {
            setError('Impossible de démarrer le GPS: ' + e.message);
        }
    };

    const stopTracking = async () => {
        try {
            await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        } catch (_) {}
        try {
            await stopRenterTracking();
        } catch (_) {}
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
                                    <Text style={styles.dateValue}>{rental.start_date}</Text>
                                </View>
                                <Text style={styles.dateArrow}>→</Text>
                                <View style={styles.dateBox}>
                                    <Text style={styles.dateLabel}>Retour</Text>
                                    <Text style={styles.dateValue}>{rental.end_date}</Text>
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
                                        Le tracking continue même si vous quittez l'application.
                                    </Text>
                                    <TouchableOpacity style={[styles.btn, styles.btnRed]} onPress={stopTracking}>
                                        <Text style={styles.btnText}>Arrêter le GPS</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.trackingInfo}>
                                        Activez le GPS pour permettre à l'agence de suivre votre véhicule en temps réel.
                                    </Text>
                                    <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={startTracking}>
                                        <Text style={styles.btnText}>Démarrer le GPS</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </>
                ) : (
                    <View style={styles.emptyCard}>
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

    errorBox:       { backgroundColor: '#450a0a', borderRadius: 12, padding: 12 },
    errorText:      { color: '#fca5a5', fontSize: 13 },

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

    btn:            { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    btnGreen:       { backgroundColor: '#16a34a' },
    btnRed:         { backgroundColor: '#dc2626' },
    btnText:        { color: '#fff', fontWeight: '700', fontSize: 15 },

    emptyCard:      { backgroundColor: '#1e293b', borderRadius: 16, padding: 32, alignItems: 'center' },
    emptyText:      { color: '#94a3b8', fontSize: 14 },
});
