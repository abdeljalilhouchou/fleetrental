import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    SafeAreaView, Alert, ActivityIndicator, ScrollView, FlatList
} from 'react-native';
import * as Location from 'expo-location';
import { getCompanies, getCompanyVehicles, sendLocation, stopTracking } from '../api';

export default function DriverTrackingScreen() {
    // Étapes : 'company' → 'vehicle' → 'tracking'
    const [step, setStep]               = useState('company');

    const [companies, setCompanies]     = useState([]);
    const [vehicles, setVehicles]       = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    const [driverName, setDriverName]   = useState('');
    const [position, setPosition]       = useState(null);
    const [lastSent, setLastSent]       = useState(null);
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState('');
    const intervalRef                   = useRef(null);

    useEffect(() => {
        getCompanies().then(setCompanies).catch(() => {});
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    const selectCompany = async (company) => {
        setSelectedCompany(company);
        setLoading(true);
        try {
            const v = await getCompanyVehicles(company.id);
            setVehicles(Array.isArray(v) ? v : []);
            setStep('vehicle');
        } catch {
            setError('Impossible de charger les véhicules');
        } finally {
            setLoading(false);
        }
    };

    const startTracking = async () => {
        setError('');
        if (!driverName.trim()) { setError('Entrez votre nom'); return; }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission refusée', 'Activez le GPS pour le tracking.');
            return;
        }

        setLoading(true);
        try {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const { latitude, longitude, speed } = loc.coords;
            const kmh = Math.round((speed || 0) * 3.6);
            setPosition({ latitude, longitude, speed: kmh });

            await sendLocation(selectedVehicle.id, latitude, longitude, kmh, driverName.trim());
            setLastSent(new Date());
            setStep('tracking');

            intervalRef.current = setInterval(async () => {
                try {
                    const l = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                    const k = Math.round((l.coords.speed || 0) * 3.6);
                    setPosition({ latitude: l.coords.latitude, longitude: l.coords.longitude, speed: k });
                    await sendLocation(selectedVehicle.id, l.coords.latitude, l.coords.longitude, k, driverName.trim());
                    setLastSent(new Date());
                } catch (_) {}
            }, 15000);
        } catch (e) {
            setError(e.message || 'Erreur de connexion');
        } finally {
            setLoading(false);
        }
    };

    const handleStop = async () => {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        try { await stopTracking(selectedVehicle.id); } catch (_) {}
        setStep('company');
        setSelectedCompany(null);
        setSelectedVehicle(null);
        setPosition(null);
        setLastSent(null);
        setDriverName('');
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Mode Chauffeur</Text>
                    <Text style={styles.headerSub}>Partage ta position GPS en temps réel</Text>
                </View>

                {/* ── ÉTAPE 1 : Choisir l'entreprise ── */}
                {step === 'company' && (
                    <View>
                        <Text style={styles.stepLabel}>1. Sélectionne ton entreprise</Text>
                        {companies.map(c => (
                            <TouchableOpacity key={c.id} style={styles.listItem} onPress={() => selectCompany(c)}>
                                <Text style={styles.listItemTitle}>{c.name}</Text>
                                {c.address ? <Text style={styles.listItemSub}>{c.address}</Text> : null}
                            </TouchableOpacity>
                        ))}
                        {loading && <ActivityIndicator color="#2563eb" style={{ marginTop: 16 }} />}
                    </View>
                )}

                {/* ── ÉTAPE 2 : Choisir le véhicule + nom ── */}
                {step === 'vehicle' && (
                    <View>
                        <TouchableOpacity onPress={() => setStep('company')} style={styles.backBtn}>
                            <Text style={styles.backBtnText}>← {selectedCompany?.name}</Text>
                        </TouchableOpacity>

                        <Text style={styles.stepLabel}>2. Sélectionne ton véhicule</Text>
                        {vehicles.map(v => (
                            <TouchableOpacity
                                key={v.id}
                                style={[styles.listItem, selectedVehicle?.id === v.id && styles.listItemSelected]}
                                onPress={() => setSelectedVehicle(v)}
                            >
                                <Text style={styles.listItemTitle}>{v.brand} {v.model} ({v.year})</Text>
                                <Text style={styles.listItemSub}>{v.registration_number}</Text>
                            </TouchableOpacity>
                        ))}

                        {selectedVehicle && (
                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.stepLabel}>3. Ton nom</Text>
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
                        )}
                    </View>
                )}

                {/* ── ÉTAPE 3 : Tracking actif ── */}
                {step === 'tracking' && (
                    <View style={styles.activeBox}>
                        <View style={styles.statusRow}>
                            <View style={styles.dot} />
                            <Text style={styles.statusText}>Tracking actif</Text>
                        </View>

                        <View style={styles.infoCard}>
                            <InfoRow label="Véhicule" value={`${selectedVehicle?.brand} ${selectedVehicle?.model}`} />
                            <InfoRow label="Immatriculation" value={selectedVehicle?.registration_number} />
                            <InfoRow label="Chauffeur" value={driverName} />
                            {position && (
                                <>
                                    <InfoRow label="Latitude"  value={position.latitude.toFixed(6)} />
                                    <InfoRow label="Longitude" value={position.longitude.toFixed(6)} />
                                    <InfoRow label="Vitesse"   value={`${position.speed} km/h`} />
                                </>
                            )}
                            {lastSent && (
                                <InfoRow label="Dernière mise à jour" value={lastSent.toLocaleTimeString()} />
                            )}
                        </View>

                        <Text style={styles.refreshNote}>Position envoyée toutes les 15 secondes</Text>

                        <TouchableOpacity style={[styles.btn, styles.btnRed]} onPress={handleStop}>
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
    container:        { flex: 1, backgroundColor: '#0f172a' },
    scroll:           { padding: 20 },
    header:           { marginBottom: 28 },
    headerTitle:      { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
    headerSub:        { fontSize: 14, color: '#94a3b8' },

    stepLabel:        { fontSize: 13, fontWeight: '700', color: '#60a5fa', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    listItem:         { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: '#334155' },
    listItemSelected: { borderColor: '#2563eb', backgroundColor: '#1e3a5f' },
    listItemTitle:    { color: '#f1f5f9', fontSize: 15, fontWeight: '600' },
    listItemSub:      { color: '#94a3b8', fontSize: 12, marginTop: 2 },

    backBtn:          { marginBottom: 16 },
    backBtnText:      { color: '#60a5fa', fontSize: 14, fontWeight: '600' },

    input:            {
        backgroundColor: '#1e293b', color: '#f1f5f9', borderRadius: 12,
        paddingHorizontal: 16, paddingVertical: 14, fontSize: 15,
        borderWidth: 1, borderColor: '#334155', marginBottom: 8,
    },
    errorText:        { color: '#f87171', fontSize: 13, marginBottom: 8 },

    btn:              { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    btnGreen:         { backgroundColor: '#16a34a' },
    btnRed:           { backgroundColor: '#dc2626' },
    btnDisabled:      { opacity: 0.6 },
    btnText:          { color: '#fff', fontWeight: '700', fontSize: 16 },

    activeBox:        { gap: 16 },
    statusRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot:              { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e' },
    statusText:       { color: '#22c55e', fontWeight: '700', fontSize: 16 },

    infoCard:         { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, gap: 12 },
    infoRow:          { flexDirection: 'row', justifyContent: 'space-between' },
    infoLabel:        { color: '#94a3b8', fontSize: 13 },
    infoValue:        { color: '#f1f5f9', fontSize: 13, fontWeight: '600' },

    refreshNote:      { color: '#475569', fontSize: 12, textAlign: 'center' },
});
