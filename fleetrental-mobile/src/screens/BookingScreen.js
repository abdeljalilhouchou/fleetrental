import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
    SafeAreaView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createReservation } from '../api';

const today = () => new Date().toISOString().split('T')[0];
const tomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
};

function calcDays(start, end) {
    const s = new Date(start), e = new Date(end);
    if (isNaN(s) || isNaN(e) || e < s) return 0;
    return Math.round((e - s) / 86400000) + 1;
}

export default function BookingScreen({ route, navigation }) {
    const { vehicle, company } = route.params;
    const dailyRate = parseFloat(vehicle.daily_rate || 0);

    const [form, setForm] = useState({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        customer_id_number: '',
        start_date: today(),
        end_date: tomorrow(),
        notes: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const days = calcDays(form.start_date, form.end_date);
    const total = days * dailyRate;

    const field = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = async () => {
        setError('');
        if (!form.customer_name.trim()) { setError('Veuillez entrer votre nom.'); return; }
        if (!form.customer_phone.trim()) { setError('Veuillez entrer votre numéro de téléphone.'); return; }
        if (days < 1) { setError('La date de fin doit être après la date de début.'); return; }

        setLoading(true);
        try {
            const res = await createReservation({
                vehicle_id:         vehicle.id,
                customer_name:      form.customer_name.trim(),
                customer_phone:     form.customer_phone.trim(),
                customer_email:     form.customer_email.trim() || undefined,
                customer_id_number: form.customer_id_number.trim() || undefined,
                start_date:         form.start_date,
                end_date:           form.end_date,
                notes:              form.notes.trim() || undefined,
            });

            navigation.replace('BookingConfirm', {
                reference:  res.reference,
                vehicle:    res.vehicle,
                company:    res.company,
                start_date: res.start_date,
                end_date:   res.end_date,
                total,
                days,
            });
        } catch (e) {
            setError(e.message || 'Erreur lors de l\'envoi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* Résumé véhicule */}
                    <View style={styles.vehicleSummary}>
                        <View style={styles.vehicleIcon}>
                            <Ionicons name="car" size={20} color="#2563eb" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.vehicleName}>{vehicle.brand} {vehicle.model} {vehicle.year}</Text>
                            <Text style={styles.vehicleCompany}>{company?.name}</Text>
                        </View>
                        <Text style={styles.vehicleRate}>{dailyRate.toLocaleString()} MAD/j</Text>
                    </View>

                    {error ? (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle" size={14} color="#dc2626" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {/* Dates */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>
                            <Ionicons name="calendar-outline" size={14} /> Période de location
                        </Text>
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.label}>Date début</Text>
                                <TextInput
                                    value={form.start_date}
                                    onChangeText={v => field('start_date', v)}
                                    placeholder="AAAA-MM-JJ"
                                    style={styles.input}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.label}>Date fin</Text>
                                <TextInput
                                    value={form.end_date}
                                    onChangeText={v => field('end_date', v)}
                                    placeholder="AAAA-MM-JJ"
                                    style={styles.input}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        {days > 0 && (
                            <View style={styles.priceEstimate}>
                                <Text style={styles.priceEstimateText}>
                                    {days} jour{days > 1 ? 's' : ''} × {dailyRate.toLocaleString()} MAD =
                                </Text>
                                <Text style={styles.priceEstimateTotal}> {total.toLocaleString()} MAD</Text>
                            </View>
                        )}
                    </View>

                    {/* Infos client */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>
                            <Ionicons name="person-outline" size={14} /> Vos informations
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nom complet *</Text>
                            <TextInput
                                value={form.customer_name}
                                onChangeText={v => field('customer_name', v)}
                                placeholder="Prénom et nom"
                                style={styles.input}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Téléphone *</Text>
                            <TextInput
                                value={form.customer_phone}
                                onChangeText={v => field('customer_phone', v)}
                                placeholder="+212 6XX XXX XXX"
                                style={styles.input}
                                keyboardType="phone-pad"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email (optionnel)</Text>
                            <TextInput
                                value={form.customer_email}
                                onChangeText={v => field('customer_email', v)}
                                placeholder="votre@email.com"
                                style={styles.input}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>CIN / Passeport (optionnel)</Text>
                            <TextInput
                                value={form.customer_id_number}
                                onChangeText={v => field('customer_id_number', v)}
                                placeholder="Numéro de pièce d'identité"
                                style={styles.input}
                                autoCapitalize="characters"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Notes (optionnel)</Text>
                            <TextInput
                                value={form.notes}
                                onChangeText={v => field('notes', v)}
                                placeholder="Demandes spécifiques..."
                                style={[styles.input, styles.textarea]}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    <View style={{ height: 20 }} />
                </ScrollView>

                {/* Bouton envoyer */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.88}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="send" size={18} color="#fff" />
                                <Text style={styles.submitText}>Envoyer la demande de réservation</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    scroll: { padding: 16, paddingBottom: 30 },
    vehicleSummary: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#eff6ff', borderRadius: 14, padding: 14, marginBottom: 16,
        borderWidth: 1, borderColor: '#bfdbfe',
    },
    vehicleIcon: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    },
    vehicleName:    { fontSize: 14, fontWeight: '700', color: '#1e40af' },
    vehicleCompany: { fontSize: 12, color: '#3b82f6' },
    vehicleRate:    { fontSize: 13, fontWeight: '700', color: '#1e40af' },
    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    cardTitle: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.4 },
    row:        { flexDirection: 'row' },
    inputGroup: { marginBottom: 12 },
    label:      { fontSize: 11, fontWeight: '700', color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase' },
    input: {
        borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc',
    },
    textarea: { height: 80 },
    priceEstimate: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        marginTop: 8, backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10,
    },
    priceEstimateText:  { fontSize: 13, color: '#16a34a' },
    priceEstimateTotal: { fontSize: 16, fontWeight: '800', color: '#16a34a' },
    errorBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#fef2f2', borderRadius: 10, padding: 10, marginBottom: 12,
        borderWidth: 1, borderColor: '#fecaca',
    },
    errorText: { color: '#dc2626', fontSize: 13, flex: 1 },
    footer: {
        padding: 16, backgroundColor: '#fff',
        borderTopWidth: 1, borderTopColor: '#f1f5f9',
    },
    submitBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 15,
        shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
    },
    submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
