import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, SafeAreaView, ScrollView, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { trackReservation } from '../api';

const STATUS_CONFIG = {
    pending:   { label: 'En attente', icon: 'time-outline',          color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
    confirmed: { label: 'Confirmée',  icon: 'checkmark-circle',      color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
    rejected:  { label: 'Refusée',   icon: 'close-circle',           color: '#dc2626', bg: '#fee2e2', border: '#fecaca' },
    cancelled: { label: 'Annulée',   icon: 'ban-outline',            color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' },
};

export default function TrackReservationScreen({ route, navigation }) {
    const prefill = route.params?.prefill || '';
    const [ref, setRef] = useState(prefill);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (prefill) handleSearch(prefill);
    }, []);

    const handleSearch = async (refOverride) => {
        const searchRef = (refOverride || ref).trim().toUpperCase();
        if (!searchRef) { setError('Veuillez entrer une référence'); return; }

        setLoading(true);
        setError('');
        setResult(null);
        try {
            const data = await trackReservation(searchRef);
            setResult(data);
        } catch (e) {
            setError('Réservation introuvable. Vérifiez votre référence.');
        } finally {
            setLoading(false);
        }
    };

    const cfg = result ? STATUS_CONFIG[result.status] || STATUS_CONFIG.pending : null;

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                {/* Barre de recherche */}
                <View style={styles.searchCard}>
                    <Text style={styles.searchTitle}>Saisissez votre référence</Text>
                    <Text style={styles.searchSub}>Format : FLT-2026-XXXXX</Text>
                    <View style={styles.searchRow}>
                        <TextInput
                            value={ref}
                            onChangeText={v => setRef(v.toUpperCase())}
                            placeholder="FLT-2026-00042"
                            placeholderTextColor="#94a3b8"
                            style={styles.searchInput}
                            autoCapitalize="characters"
                            onSubmitEditing={() => handleSearch()}
                        />
                        <TouchableOpacity
                            style={styles.searchBtn}
                            onPress={() => handleSearch()}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" size="small" />
                                : <Ionicons name="search" size={20} color="#fff" />
                            }
                        </TouchableOpacity>
                    </View>
                    {error ? (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle" size={14} color="#dc2626" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}
                </View>

                {/* Résultat */}
                {result && cfg && (
                    <View style={styles.resultCard}>
                        {/* Statut */}
                        <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                            <Ionicons name={cfg.icon} size={22} color={cfg.color} />
                            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>

                        {/* Référence */}
                        <Text style={styles.refValue}>{result.reference}</Text>
                        <Text style={styles.refSub}>Bonjour, {result.customer_name}</Text>

                        <View style={styles.divider} />

                        {/* Véhicule */}
                        <View style={styles.infoRow}>
                            <View style={styles.infoIcon}>
                                <Ionicons name="car" size={16} color="#2563eb" />
                            </View>
                            <View>
                                <Text style={styles.infoLabel}>Véhicule</Text>
                                <Text style={styles.infoValue}>{result.vehicle?.brand} {result.vehicle?.model} {result.vehicle?.year}</Text>
                            </View>
                        </View>

                        {/* Entreprise */}
                        <View style={styles.infoRow}>
                            <View style={styles.infoIcon}>
                                <Ionicons name="business" size={16} color="#2563eb" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>Loueur</Text>
                                <Text style={styles.infoValue}>{result.company?.name}</Text>
                                {result.company?.phone ? (
                                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${result.company.phone}`)}>
                                        <Text style={styles.phoneLink}>{result.company.phone}</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        </View>

                        {/* Dates */}
                        <View style={styles.infoRow}>
                            <View style={styles.infoIcon}>
                                <Ionicons name="calendar" size={16} color="#2563eb" />
                            </View>
                            <View>
                                <Text style={styles.infoLabel}>Période</Text>
                                <Text style={styles.infoValue}>{result.start_date} → {result.end_date}</Text>
                                <Text style={styles.infoSub}>{result.days} jour{result.days > 1 ? 's' : ''}</Text>
                            </View>
                        </View>

                        {/* Prix estimé */}
                        {result.total_price > 0 && (
                            <View style={styles.infoRow}>
                                <View style={styles.infoIcon}>
                                    <Ionicons name="cash" size={16} color="#2563eb" />
                                </View>
                                <View>
                                    <Text style={styles.infoLabel}>Montant estimé</Text>
                                    <Text style={[styles.infoValue, { color: '#2563eb', fontWeight: '800' }]}>
                                        {parseFloat(result.total_price).toLocaleString()} MAD
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Motif de refus */}
                        {result.status === 'rejected' && result.rejection_reason && (
                            <View style={styles.rejectBox}>
                                <Text style={styles.rejectLabel}>Motif du refus</Text>
                                <Text style={styles.rejectText}>{result.rejection_reason}</Text>
                            </View>
                        )}

                        {/* Message selon statut */}
                        {result.status === 'pending' && (
                            <View style={styles.pendingBox}>
                                <Ionicons name="information-circle-outline" size={16} color="#d97706" />
                                <Text style={styles.pendingText}>
                                    Votre demande est en cours de traitement. L'entreprise vous contactera bientôt.
                                </Text>
                            </View>
                        )}
                        {result.status === 'confirmed' && (
                            <View style={styles.confirmedBox}>
                                <Ionicons name="checkmark-circle-outline" size={16} color="#16a34a" />
                                <Text style={styles.confirmedText}>
                                    Votre réservation est confirmée ! Présentez-vous le {result.start_date}.
                                </Text>
                            </View>
                        )}

                        <Text style={styles.createdAt}>Demande reçue le {result.created_at}</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    scroll: { padding: 16 },
    searchCard: {
        backgroundColor: '#fff', borderRadius: 18, padding: 20, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    },
    searchTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
    searchSub:   { fontSize: 13, color: '#64748b', marginBottom: 14 },
    searchRow:   { flexDirection: 'row', gap: 8 },
    searchInput: {
        flex: 1, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 15, fontWeight: '700', color: '#0f172a', backgroundColor: '#f8fafc',
        letterSpacing: 1,
    },
    searchBtn: {
        width: 48, backgroundColor: '#2563eb', borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    errorBox: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#fef2f2', borderRadius: 10, padding: 10, marginTop: 10,
    },
    errorText: { color: '#dc2626', fontSize: 13, flex: 1 },
    resultCard: {
        backgroundColor: '#fff', borderRadius: 18, padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 16,
    },
    statusText: { fontSize: 16, fontWeight: '800' },
    refValue: { fontSize: 22, fontWeight: '800', color: '#1e40af', textAlign: 'center', letterSpacing: 1 },
    refSub:   { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 4, marginBottom: 16 },
    divider:  { height: 1, backgroundColor: '#f1f5f9', marginBottom: 16 },
    infoRow:  { flexDirection: 'row', gap: 12, marginBottom: 14 },
    infoIcon: {
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    infoLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
    infoValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
    infoSub:   { fontSize: 12, color: '#64748b' },
    phoneLink: { fontSize: 13, color: '#2563eb', fontWeight: '600', marginTop: 2 },
    rejectBox: {
        backgroundColor: '#fef2f2', borderRadius: 12, padding: 12,
        borderWidth: 1, borderColor: '#fecaca', marginTop: 4, marginBottom: 14,
    },
    rejectLabel: { fontSize: 11, fontWeight: '700', color: '#dc2626', textTransform: 'uppercase', marginBottom: 4 },
    rejectText:  { fontSize: 13, color: '#991b1b' },
    pendingBox: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: '#fef3c7', borderRadius: 12, padding: 12,
        borderWidth: 1, borderColor: '#fde68a', marginBottom: 12,
    },
    pendingText: { fontSize: 13, color: '#92400e', flex: 1, lineHeight: 18 },
    confirmedBox: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: '#dcfce7', borderRadius: 12, padding: 12,
        borderWidth: 1, borderColor: '#bbf7d0', marginBottom: 12,
    },
    confirmedText: { fontSize: 13, color: '#14532d', flex: 1, lineHeight: 18 },
    createdAt: { fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 8 },
});
