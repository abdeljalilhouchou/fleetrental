import React from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BookingConfirmScreen({ route, navigation }) {
    const { reference, vehicle, company, start_date, end_date, total, days } = route.params;

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Ma réservation FleetRental :\n🚗 ${vehicle}\n📅 ${start_date} → ${end_date} (${days} jours)\n🏢 ${company}\n📋 Référence : ${reference}\n\nSuivi : https://fleetrental.vercel.app/track/${reference}`,
            });
        } catch {}
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                {/* Icône succès */}
                <View style={styles.successIcon}>
                    <Ionicons name="checkmark-circle" size={64} color="#16a34a" />
                </View>

                <Text style={styles.title}>Demande envoyée !</Text>
                <Text style={styles.subtitle}>
                    Votre demande a bien été reçue. L'entreprise vous contactera pour confirmer.
                </Text>

                {/* Carte de réservation */}
                <View style={styles.card}>
                    <View style={styles.referenceRow}>
                        <Text style={styles.referenceLabel}>Référence de suivi</Text>
                        <Text style={styles.referenceValue}>{reference}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.row}>
                        <Ionicons name="car-outline" size={16} color="#64748b" />
                        <Text style={styles.rowText}>{vehicle}</Text>
                    </View>
                    <View style={styles.row}>
                        <Ionicons name="business-outline" size={16} color="#64748b" />
                        <Text style={styles.rowText}>{company}</Text>
                    </View>
                    <View style={styles.row}>
                        <Ionicons name="calendar-outline" size={16} color="#64748b" />
                        <Text style={styles.rowText}>{start_date} → {end_date} ({days} jour{days > 1 ? 's' : ''})</Text>
                    </View>
                    <View style={styles.row}>
                        <Ionicons name="cash-outline" size={16} color="#64748b" />
                        <Text style={styles.rowText}>Estimation : <Text style={styles.boldText}>{total?.toLocaleString()} MAD</Text></Text>
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={16} color="#2563eb" />
                    <Text style={styles.infoText}>
                        Conservez votre référence de suivi. Vous pouvez l'utiliser pour suivre l'état de votre demande.
                    </Text>
                </View>

                {/* Boutons */}
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.trackBtn} onPress={() => navigation.navigate('TrackReservation', { prefill: reference })}>
                        <Ionicons name="search" size={18} color="#2563eb" />
                        <Text style={styles.trackBtnText}>Suivre ma réservation</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                        <Ionicons name="share-social-outline" size={18} color="#fff" />
                        <Text style={styles.shareBtnText}>Partager la référence</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')}>
                        <Text style={styles.homeBtnText}>Retour à l'accueil</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
    successIcon: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    },
    title:    { fontSize: 24, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 28, lineHeight: 20 },
    card: {
        width: '100%', backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
    },
    referenceRow: { alignItems: 'center', marginBottom: 14 },
    referenceLabel: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.5 },
    referenceValue: {
        fontSize: 22, fontWeight: '800', color: '#2563eb', marginTop: 4,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 14 },
    row:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    rowText:  { fontSize: 13, color: '#374151', flex: 1 },
    boldText: { fontWeight: '700', color: '#0f172a' },
    infoBox: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: '#eff6ff', borderRadius: 12, padding: 12, marginBottom: 24, width: '100%',
        borderWidth: 1, borderColor: '#bfdbfe',
    },
    infoText: { fontSize: 12, color: '#1e40af', flex: 1, lineHeight: 18 },
    actions: { width: '100%', gap: 10 },
    trackBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#eff6ff', borderRadius: 14, paddingVertical: 14,
        borderWidth: 1, borderColor: '#bfdbfe',
    },
    trackBtnText: { color: '#2563eb', fontWeight: '700', fontSize: 15 },
    shareBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 14,
    },
    shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    homeBtn: {
        alignItems: 'center', paddingVertical: 12,
    },
    homeBtnText: { color: '#94a3b8', fontSize: 14 },
});
