import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    SafeAreaView, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import * as Location from 'expo-location';
import { sendLocation, stopTracking } from '../api';

export default function DriverTrackingScreen() {
    const [vehicleId, setVehicleId]     = useState('');
    const [driverName, setDriverName]   = useState('');
    const [isTracking, setIsTracking]   = useState(false);
    const [position, setPosition]       = useState(null);
    const [lastSent, setLastSent]       = useState(null);
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState('');
    const intervalRef                   = useRef(null);

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const startTracking = async () => {
        setError('');
        if (!vehicleId.trim()) {
            setError('Entrez l\'ID du véhicule');
            return;
        }
        if (!driverName.trim()) {
            setError('Entrez votre nom');
            return;
        }

        // Demander permission GPS
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission refusée', 'Activez le GPS pour le tracking.');
            return;
        }

        setLoading(true);
        try {
            // Obtenir position initiale
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const { latitude, longitude, speed } = loc.coords;
            setPosition({ latitude, longitude, speed: Math.round((speed || 0) * 3.6) });

            await sendLocation(vehicleId.trim(), latitude, longitude, Math.round((speed || 0) * 3.6), driverName.trim());
            setLastSent(new Date());
            setIsTracking(true);

            // Envoyer position toutes les 15 secondes
            intervalRef.current = setInterval(async () => {
                try {
                    const l = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                    const kmh = Math.round((l.coords.speed || 0) * 3.6);
                    setPosition({ latitude: l.coords.latitude, longitude: l.coords.longitude, speed: kmh });
                    await sendLocation(vehicleId.trim(), l.coords.latitude, l.coords.longitude, kmh, driverName.trim());
                    setLastSent(new Date());
                } catch (e) {
                    // Continuer même si une requête échoue
                }
            }, 15000);
        } catch (e) {
            setError(e.message || 'Erreur de connexion');
        } finally {
            setLoading(false);
        }
    };

    const handleStopTracking = async () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        try {
            await stopTracking(vehicleId.trim());
        } catch (_) {}
        setIsTracking(false);
        setPosition(null);
        setLastSent(null);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Mode Chauffeur</Text>
                    <Text style={styles.headerSub}>Partage ta position GPS en temps réel</Text>
                </View>

                {!isTracking ? (
                    <View style={styles.form}>
                        <Text style={styles.label}>ID du Véhicule</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: 3"
                            placeholderTextColor="#6b7280"
                            value={vehicleId}
                            onChangeText={setVehicleId}
                            keyboardType="numeric"
                        />

                        <Text style={styles.label}>Ton nom</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Ahmed Benali"
                            placeholderTextColor="#6b7280"
                            value={driverName}
                            onChangeText={setDriverName}
                        />

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <TouchableOpacity
                            style={[styles.btn, styles.btnGreen, loading && styles.btnDisabled]}
                            onPress={startTracking}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.btnText}>Démarrer le tracking GPS</Text>
                            }
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.activeBox}>
                        {/* Statut actif */}
                        <View style={styles.statusRow}>
                            <View style={styles.dot} />
                            <Text style={styles.statusText}>Tracking actif</Text>
                        </View>

                        <View style={styles.infoCard}>
                            <InfoRow label="Véhicule ID" value={vehicleId} />
                            <InfoRow label="Chauffeur" value={driverName} />
                            {position && (
                                <>
                                    <InfoRow label="Latitude"  value={position.latitude.toFixed(6)} />
                                    <InfoRow label="Longitude" value={position.longitude.toFixed(6)} />
                                    <InfoRow label="Vitesse"   value={`${position.speed} km/h`} />
                                </>
                            )}
                            {lastSent && (
                                <InfoRow
                                    label="Dernière mise à jour"
                                    value={lastSent.toLocaleTimeString()}
                                />
                            )}
                        </View>

                        <Text style={styles.refreshNote}>Position envoyée toutes les 15 secondes</Text>

                        <TouchableOpacity style={[styles.btn, styles.btnRed]} onPress={handleStopTracking}>
                            <Text style={styles.btnText}>Arrêter le tracking</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

function InfoRow({ label, value }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: '#0f172a' },
    scroll:       { padding: 20 },
    header:       { marginBottom: 28 },
    headerTitle:  { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
    headerSub:    { fontSize: 14, color: '#94a3b8' },

    form:         { gap: 12 },
    label:        { fontSize: 13, fontWeight: '600', color: '#cbd5e1', marginBottom: 2 },
    input:        {
        backgroundColor: '#1e293b',
        color: '#f1f5f9',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#334155',
        marginBottom: 8,
    },
    errorText:    { color: '#f87171', fontSize: 13, marginBottom: 8 },

    btn:          { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    btnGreen:     { backgroundColor: '#16a34a' },
    btnRed:       { backgroundColor: '#dc2626' },
    btnDisabled:  { opacity: 0.6 },
    btnText:      { color: '#fff', fontWeight: '700', fontSize: 16 },

    activeBox:    { gap: 16 },
    statusRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot:          { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e' },
    statusText:   { color: '#22c55e', fontWeight: '700', fontSize: 16 },

    infoCard:     { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, gap: 12 },
    infoRow:      { flexDirection: 'row', justifyContent: 'space-between' },
    infoLabel:    { color: '#94a3b8', fontSize: 13 },
    infoValue:    { color: '#f1f5f9', fontSize: 13, fontWeight: '600' },

    refreshNote:  { color: '#475569', fontSize: 12, textAlign: 'center' },
});
