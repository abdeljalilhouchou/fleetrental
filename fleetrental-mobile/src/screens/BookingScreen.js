import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
    SafeAreaView, Modal,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { createReservation, getBlockedDates } from '../api';

function toISO(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

function addDays(dateStr, n) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + n);
    return toISO(d);
}

function calcDays(start, end) {
    if (!start || !end) return 0;
    const s = new Date(start), e = new Date(end);
    if (isNaN(s) || isNaN(e) || e < s) return 0;
    return Math.round((e - s) / 86400000) + 1;
}

function formatDisplay(dateStr) {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

function buildMarkedDates(startDate, endDate, blocked) {
    const marks = {};

    blocked.forEach(d => {
        marks[d] = { disabled: true, disableTouchEvent: true, color: '#fecaca', textColor: '#dc2626' };
    });

    if (!startDate) return marks;

    if (!endDate || endDate === startDate) {
        marks[startDate] = { selected: true, startingDay: true, endingDay: true, color: '#2563eb', textColor: '#fff' };
        return marks;
    }

    let current = startDate;
    while (current <= endDate) {
        const isStart = current === startDate;
        const isEnd   = current === endDate;
        marks[current] = {
            color:       isStart || isEnd ? '#2563eb' : '#93c5fd',
            textColor:   '#fff',
            startingDay: isStart,
            endingDay:   isEnd,
        };
        current = addDays(current, 1);
    }

    return marks;
}

export default function BookingScreen({ route, navigation }) {
    const { vehicle, company } = route.params;
    const dailyRate = parseFloat(vehicle.daily_rate || 0);
    const todayStr  = toISO(new Date());

    const [startDate,    setStartDate]    = useState('');
    const [endDate,      setEndDate]      = useState('');
    const [selecting,    setSelecting]    = useState(null);
    const [showCal,      setShowCal]      = useState(false);
    const [blocked,      setBlocked]      = useState([]);
    const [loadingDates, setLoadingDates] = useState(true);
    const [form, setForm] = useState({
        customer_name: '', customer_phone: '',
        customer_email: '', customer_id_number: '', notes: '',
    });
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');

    const days  = calcDays(startDate, endDate);
    const total = days * dailyRate;

    useEffect(() => {
        getBlockedDates(vehicle.id)
            .then(d => setBlocked(Array.isArray(d) ? d : []))
            .catch(() => setBlocked([]))
            .finally(() => setLoadingDates(false));
    }, [vehicle.id]);

    const openCalendar = (mode) => {
        setSelecting(mode);
        setShowCal(true);
    };

    const onDayPress = useCallback((day) => {
        const d = day.dateString;
        if (blocked.includes(d)) return;

        if (selecting === 'start') {
            setStartDate(d);
            if (endDate && endDate < d) setEndDate('');
            setSelecting('end');
        } else {
            if (d < startDate) {
                setStartDate(d);
                setEndDate(startDate);
            } else {
                setEndDate(d);
            }
            setShowCal(false);
            setSelecting(null);
        }
    }, [selecting, startDate, endDate, blocked]);

    const markedDates = buildMarkedDates(startDate, endDate, blocked);

    const field = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = async () => {
        setError('');
        if (!startDate || !endDate)      { setError('Veuillez sélectionner les dates.'); return; }
        if (!form.customer_name.trim())  { setError('Veuillez entrer votre nom.'); return; }
        if (!form.customer_phone.trim()) { setError('Veuillez entrer votre téléphone.'); return; }
        if (days < 1)                    { setError('La date de fin doit être après la date de début.'); return; }

        setLoading(true);
        try {
            const res = await createReservation({
                vehicle_id:         vehicle.id,
                customer_name:      form.customer_name.trim(),
                customer_phone:     form.customer_phone.trim(),
                customer_email:     form.customer_email.trim() || undefined,
                customer_id_number: form.customer_id_number.trim() || undefined,
                start_date:         startDate,
                end_date:           endDate,
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
            setError(e.message || "Erreur lors de l'envoi");
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

                    {/* Sélecteur de dates */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>
                            <Ionicons name="calendar-outline" size={14} /> Période de location
                        </Text>

                        {loadingDates ? (
                            <View style={styles.loadingDates}>
                                <ActivityIndicator color="#2563eb" size="small" />
                                <Text style={styles.loadingDatesText}>Chargement du calendrier...</Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.dateRow}>
                                    <TouchableOpacity
                                        style={[styles.dateBtn, startDate && styles.dateBtnActive]}
                                        onPress={() => openCalendar('start')}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="log-in-outline" size={16} color={startDate ? '#2563eb' : '#94a3b8'} />
                                        <View>
                                            <Text style={styles.dateBtnLabel}>Départ</Text>
                                            <Text style={[styles.dateBtnValue, startDate && styles.dateBtnValueActive]}>
                                                {startDate ? formatDisplay(startDate) : 'Sélectionner'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>

                                    <Ionicons name="arrow-forward" size={18} color="#cbd5e1" style={{ marginTop: 12 }} />

                                    <TouchableOpacity
                                        style={[styles.dateBtn, endDate && styles.dateBtnActive]}
                                        onPress={() => openCalendar('end')}
                                        activeOpacity={0.8}
                                        disabled={!startDate}
                                    >
                                        <Ionicons name="log-out-outline" size={16} color={endDate ? '#2563eb' : '#94a3b8'} />
                                        <View>
                                            <Text style={styles.dateBtnLabel}>Retour</Text>
                                            <Text style={[styles.dateBtnValue, endDate && styles.dateBtnValueActive]}>
                                                {endDate ? formatDisplay(endDate) : 'Sélectionner'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                {days > 0 && (
                                    <View style={styles.priceEstimate}>
                                        <Text style={styles.priceEstimateText}>
                                            {days} jour{days > 1 ? 's' : ''} × {dailyRate.toLocaleString()} MAD =
                                        </Text>
                                        <Text style={styles.priceEstimateTotal}> {total.toLocaleString()} MAD</Text>
                                    </View>
                                )}

                                <View style={styles.legend}>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: '#fecaca' }]} />
                                        <Text style={styles.legendText}>Non disponible</Text>
                                    </View>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
                                        <Text style={styles.legendText}>Votre sélection</Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Infos client */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>
                            <Ionicons name="person-outline" size={14} /> Vos informations
                        </Text>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nom complet *</Text>
                            <TextInput value={form.customer_name} onChangeText={v => field('customer_name', v)}
                                placeholder="Prénom et nom" style={styles.input} />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Téléphone *</Text>
                            <TextInput value={form.customer_phone} onChangeText={v => field('customer_phone', v)}
                                placeholder="+212 6XX XXX XXX" style={styles.input} keyboardType="phone-pad" />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email (optionnel)</Text>
                            <TextInput value={form.customer_email} onChangeText={v => field('customer_email', v)}
                                placeholder="votre@email.com" style={styles.input}
                                keyboardType="email-address" autoCapitalize="none" />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>CIN / Passeport (optionnel)</Text>
                            <TextInput value={form.customer_id_number} onChangeText={v => field('customer_id_number', v)}
                                placeholder="Numéro de pièce d'identité" style={styles.input}
                                autoCapitalize="characters" />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Notes (optionnel)</Text>
                            <TextInput value={form.notes} onChangeText={v => field('notes', v)}
                                placeholder="Demandes spécifiques..." style={[styles.input, styles.textarea]}
                                multiline numberOfLines={3} textAlignVertical="top" />
                        </View>
                    </View>

                    <View style={{ height: 20 }} />
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.88}>
                        {loading ? <ActivityIndicator color="#fff" /> : (
                            <>
                                <Ionicons name="send" size={18} color="#fff" />
                                <Text style={styles.submitText}>Envoyer la demande de réservation</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Modal calendrier */}
            <Modal visible={showCal} transparent animationType="slide" onRequestClose={() => setShowCal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {selecting === 'start' ? 'Date de départ' : 'Date de retour'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowCal(false)}>
                                <Ionicons name="close" size={24} color="#475569" />
                            </TouchableOpacity>
                        </View>

                        <Calendar
                            minDate={selecting === 'end' && startDate ? startDate : todayStr}
                            onDayPress={onDayPress}
                            markedDates={markedDates}
                            markingType="period"
                            theme={{
                                todayTextColor: '#2563eb',
                                arrowColor: '#2563eb',
                                textDayFontSize: 15,
                                textMonthFontWeight: '700',
                                textDayHeaderFontWeight: '600',
                            }}
                        />

                        <TouchableOpacity style={styles.modalClose} onPress={() => setShowCal(false)}>
                            <Text style={styles.modalCloseText}>Fermer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe:   { flex: 1, backgroundColor: '#f8fafc' },
    scroll: { padding: 16, paddingBottom: 30 },
    vehicleSummary: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#eff6ff', borderRadius: 14, padding: 14, marginBottom: 16,
        borderWidth: 1, borderColor: '#bfdbfe',
    },
    vehicleIcon:    { width: 38, height: 38, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    vehicleName:    { fontSize: 14, fontWeight: '700', color: '#1e40af' },
    vehicleCompany: { fontSize: 12, color: '#3b82f6' },
    vehicleRate:    { fontSize: 13, fontWeight: '700', color: '#1e40af' },
    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    cardTitle: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.4 },
    loadingDates:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
    loadingDatesText: { fontSize: 13, color: '#64748b' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    dateBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
        borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12,
        backgroundColor: '#f8fafc',
    },
    dateBtnActive:      { borderColor: '#93c5fd', backgroundColor: '#eff6ff' },
    dateBtnLabel:       { fontSize: 10, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' },
    dateBtnValue:       { fontSize: 14, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
    dateBtnValueActive: { color: '#2563eb' },
    priceEstimate: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10, marginTop: 4,
    },
    priceEstimateText:  { fontSize: 13, color: '#16a34a' },
    priceEstimateTotal: { fontSize: 16, fontWeight: '800', color: '#16a34a' },
    legend:     { flexDirection: 'row', gap: 16, marginTop: 10 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot:  { width: 12, height: 12, borderRadius: 6 },
    legendText: { fontSize: 11, color: '#64748b' },
    inputGroup: { marginBottom: 12 },
    label:      { fontSize: 11, fontWeight: '700', color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase' },
    input: {
        borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc',
    },
    textarea:   { height: 80 },
    errorBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#fef2f2', borderRadius: 10, padding: 10, marginBottom: 12,
        borderWidth: 1, borderColor: '#fecaca',
    },
    errorText: { color: '#dc2626', fontSize: 13, flex: 1 },
    footer:    { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    submitBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 15,
        shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
    },
    submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer:  { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 30, overflow: 'hidden' },
    modalHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalTitle:      { fontSize: 16, fontWeight: '700', color: '#0f172a' },
    modalClose:      { margin: 16, alignItems: 'center' },
    modalCloseText:  { color: '#94a3b8', fontSize: 14 },
});
