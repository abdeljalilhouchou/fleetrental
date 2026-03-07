import React, { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, RefreshControl, ActivityIndicator, SafeAreaView,
    Alert, Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getVehicles, createVehicle, updateVehicleStatus } from '../../api';
import StatsFilterBar from '../../components/StatsFilterBar';

const STATUS_CONFIG = {
    available:      { label: 'Disponible',  color: '#16a34a', bg: '#f0fdf4', icon: 'checkmark-circle' },
    rented:         { label: 'Louée',        color: '#2563eb', bg: '#eff6ff', icon: 'time' },
    maintenance:    { label: 'Maintenance',  color: '#d97706', bg: '#fffbeb', icon: 'construct' },
    out_of_service: { label: 'Hors service', color: '#dc2626', bg: '#fef2f2', icon: 'close-circle' },
    reserved:       { label: 'Réservée',     color: '#7c3aed', bg: '#f5f3ff', icon: 'bookmark' },
};

const STATUS_OPTIONS = [
    { value: 'available',      label: 'Disponible' },
    { value: 'maintenance',    label: 'Maintenance' },
    { value: 'out_of_service', label: 'Hors service' },
];

const VEHICLE_TYPES = ['Voiture', 'SUV', 'Utilitaire', 'Camion', 'Moto', 'Minibus', 'Autre'];

const ARABIC_LETTERS = ['أ','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','ه','و','ي'];

function displayPlate(value) {
    if (!value) return '—';
    return value.replace(/\s*([\u0600-\u06FF])\s*/, ' | $1 | ');
}

const EMPTY_FORM = {
    brand: '', model: '', year: String(new Date().getFullYear()),
    plate_nums: '', plate_letter: 'أ', plate_region: '',
    current_mileage: '0', vehicle_type: 'Voiture',
    daily_rate: '', color: '', vin: '', status: 'available',
};

export default function VehiclesScreen() {
    const [vehicles,   setVehicles]   = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search,     setSearch]     = useState('');
    const [filter,     setFilter]     = useState('all');

    // Modal création
    const [showModal,  setShowModal]  = useState(false);
    const [form,       setForm]       = useState(EMPTY_FORM);
    const [saving,     setSaving]     = useState(false);
    const [formError,  setFormError]  = useState('');

    const loaded = useRef(false);

    const loadVehicles = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else if (!loaded.current) setLoading(true);
        try {
            const data = await getVehicles();
            setVehicles(data);
            loaded.current = true;
        } catch (e) {
            Alert.alert('Erreur', e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { loadVehicles(); }, []));

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setFormError('');
        setShowModal(true);
    };

    const handleCreate = async () => {
        if (!form.brand.trim() || !form.model.trim() || !form.plate_nums.trim() || !form.plate_region.trim()) {
            setFormError('Marque, modèle et immatriculation sont obligatoires.');
            return;
        }
        const registration_number = `${form.plate_nums} ${form.plate_letter} ${form.plate_region}`;
        setSaving(true);
        setFormError('');
        try {
            await createVehicle({
                brand:               form.brand.trim(),
                model:               form.model.trim(),
                year:                parseInt(form.year) || new Date().getFullYear(),
                registration_number,
                vin:                 form.vin.trim() || null,
                current_mileage:     parseInt(form.current_mileage) || 0,
                vehicle_type:        form.vehicle_type,
                daily_rate:          form.daily_rate ? parseFloat(form.daily_rate) : null,
                color:               form.color.trim() || null,
                status:              form.status,
            });
            setShowModal(false);
            loadVehicles(true);
        } catch (e) {
            setFormError(e.message || 'Erreur lors de la création.');
        } finally {
            setSaving(false);
        }
    };

    const changeStatus = (vehicle) => {
        Alert.alert(
            'Changer le statut',
            `${vehicle.brand} ${vehicle.model}`,
            [
                ...STATUS_OPTIONS.filter(o => o.value !== vehicle.status).map(o => ({
                    text: o.label,
                    onPress: async () => {
                        try {
                            await updateVehicleStatus(vehicle.id, o.value);
                            loadVehicles(true);
                        } catch (e) {
                            Alert.alert('Erreur', e.message);
                        }
                    },
                })),
                { text: 'Annuler', style: 'cancel' },
            ]
        );
    };

    const filtered = vehicles.filter(v => {
        const matchSearch = !search ||
            `${v.brand} ${v.model} ${v.registration_number}`.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' || v.status === filter;
        return matchSearch && matchFilter;
    });

    const FILTERS = [
        { value: 'all',            label: 'Tous',         icon: 'car-sport',      color: '#1e3a5f', bg: '#eff6ff', count: vehicles.length },
        { value: 'available',      label: 'Disponibles',  icon: 'checkmark-circle', color: '#16a34a', bg: '#f0fdf4', count: vehicles.filter(v => v.status === 'available').length },
        { value: 'rented',         label: 'Louées',       icon: 'key',            color: '#2563eb', bg: '#eff6ff', count: vehicles.filter(v => v.status === 'rented').length },
        { value: 'maintenance',    label: 'Maintenance',  icon: 'construct',      color: '#d97706', bg: '#fffbeb', count: vehicles.filter(v => v.status === 'maintenance').length },
        { value: 'out_of_service', label: 'Hors service', icon: 'close-circle',   color: '#dc2626', bg: '#fef2f2', count: vehicles.filter(v => v.status === 'out_of_service').length },
    ];

    const renderVehicle = ({ item: v }) => {
        const s = STATUS_CONFIG[v.status] || STATUS_CONFIG.available;
        return (
            <View style={styles.card}>
                <View style={styles.cardLeft}>
                    <View style={styles.carIcon}>
                        <Ionicons name="car-sport-outline" size={22} color="#1e3a5f" />
                    </View>
                    <View style={styles.cardInfo}>
                        <Text style={styles.cardTitle}>{v.brand} {v.model}</Text>
                        <Text style={styles.cardPlate}>{displayPlate(v.registration_number)}</Text>
                        <Text style={styles.cardSub}>{v.year} · {v.current_mileage?.toLocaleString()} km</Text>
                        {v.daily_rate ? (
                            <Text style={styles.cardRate}>{Number(v.daily_rate).toFixed(0)} MAD/jour</Text>
                        ) : null}
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.statusBadge, { backgroundColor: s.bg }]}
                    onPress={() => changeStatus(v)}
                    activeOpacity={0.7}
                >
                    <Ionicons name={s.icon} size={12} color={s.color} />
                    <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1e3a5f" />
                <Text style={styles.loadingText}>Chargement...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            {/* Recherche + bouton ajouter */}
            <View style={styles.topRow}>
                <View style={[styles.searchBox, { flex: 1 }]}>
                    <Ionicons name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Marque, modèle, immat."
                        placeholderTextColor="#94a3b8"
                        style={styles.searchInput}
                    />
                    {search ? (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={16} color="#94a3b8" />
                        </TouchableOpacity>
                    ) : null}
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
                    <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Filtres stats */}
            <StatsFilterBar filters={FILTERS} active={filter} onChange={setFilter} />

            <FlatList
                data={filtered}
                keyExtractor={item => String(item.id)}
                renderItem={renderVehicle}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => loadVehicles(true)} colors={['#1e3a5f']} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="car-outline" size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>Aucun véhicule trouvé</Text>
                        <TouchableOpacity style={styles.emptyBtn} onPress={openCreate}>
                            <Text style={styles.emptyBtnText}>Ajouter un véhicule</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* ── Modal création ── */}
            <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <SafeAreaView style={styles.modalSafe}>
                        {/* Header modal */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nouveau véhicule</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
                            {formError ? (
                                <View style={styles.formError}>
                                    <Ionicons name="alert-circle" size={15} color="#dc2626" />
                                    <Text style={styles.formErrorText}>{formError}</Text>
                                </View>
                            ) : null}

                            {/* Marque + Modèle */}
                            <View style={styles.row2}>
                                <View style={[styles.fieldWrap, { flex: 1 }]}>
                                    <Text style={styles.label}>Marque *</Text>
                                    <TextInput style={styles.input} value={form.brand} onChangeText={v => setForm(p => ({...p, brand: v}))} placeholder="Toyota" placeholderTextColor="#94a3b8" />
                                </View>
                                <View style={[styles.fieldWrap, { flex: 1 }]}>
                                    <Text style={styles.label}>Modèle *</Text>
                                    <TextInput style={styles.input} value={form.model} onChangeText={v => setForm(p => ({...p, model: v}))} placeholder="Corolla" placeholderTextColor="#94a3b8" />
                                </View>
                            </View>

                            {/* Année + Couleur */}
                            <View style={styles.row2}>
                                <View style={[styles.fieldWrap, { flex: 1 }]}>
                                    <Text style={styles.label}>Année</Text>
                                    <TextInput style={styles.input} value={form.year} onChangeText={v => setForm(p => ({...p, year: v}))} keyboardType="numeric" placeholder="2024" placeholderTextColor="#94a3b8" />
                                </View>
                                <View style={[styles.fieldWrap, { flex: 1 }]}>
                                    <Text style={styles.label}>Couleur</Text>
                                    <TextInput style={styles.input} value={form.color} onChangeText={v => setForm(p => ({...p, color: v}))} placeholder="Blanc" placeholderTextColor="#94a3b8" />
                                </View>
                            </View>

                            {/* Immatriculation marocaine */}
                            <View style={styles.fieldWrap}>
                                <Text style={styles.label}>Immatriculation *</Text>
                                <View style={styles.plateRow}>
                                    <TextInput
                                        style={[styles.input, styles.plateNums]}
                                        value={form.plate_nums}
                                        onChangeText={v => setForm(p => ({...p, plate_nums: v.replace(/\D/g, '').slice(0,5)}))}
                                        keyboardType="numeric"
                                        placeholder="12345"
                                        placeholderTextColor="#94a3b8"
                                        maxLength={5}
                                    />
                                    <View style={styles.plateSep}><Text style={styles.plateSepText}>|</Text></View>
                                    {/* Sélecteur lettre arabe */}
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.letterScroll}>
                                        {ARABIC_LETTERS.map(l => (
                                            <TouchableOpacity
                                                key={l}
                                                style={[styles.letterBtn, form.plate_letter === l && styles.letterBtnActive]}
                                                onPress={() => setForm(p => ({...p, plate_letter: l}))}
                                            >
                                                <Text style={[styles.letterText, form.plate_letter === l && styles.letterTextActive]}>{l}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                    <View style={styles.plateSep}><Text style={styles.plateSepText}>|</Text></View>
                                    <TextInput
                                        style={[styles.input, styles.plateRegion]}
                                        value={form.plate_region}
                                        onChangeText={v => setForm(p => ({...p, plate_region: v.replace(/\D/g, '').slice(0,2)}))}
                                        keyboardType="numeric"
                                        placeholder="46"
                                        placeholderTextColor="#94a3b8"
                                        maxLength={2}
                                    />
                                </View>
                                <Text style={styles.platePreview}>
                                    {form.plate_nums || '?'} | {form.plate_letter} | {form.plate_region || '?'}
                                </Text>
                            </View>

                            {/* VIN */}
                            <View style={styles.fieldWrap}>
                                <Text style={styles.label}>N° de châssis / VIN (optionnel)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={form.vin}
                                    onChangeText={v => setForm(p => ({...p, vin: v.toUpperCase()}))}
                                    placeholder="ex: VF1AA000012345678"
                                    placeholderTextColor="#94a3b8"
                                    autoCapitalize="characters"
                                    maxLength={17}
                                />
                            </View>

                            {/* Kilométrage + Tarif */}
                            <View style={styles.row2}>
                                <View style={[styles.fieldWrap, { flex: 1 }]}>
                                    <Text style={styles.label}>Kilométrage</Text>
                                    <TextInput style={styles.input} value={form.current_mileage} onChangeText={v => setForm(p => ({...p, current_mileage: v}))} keyboardType="numeric" placeholder="0" placeholderTextColor="#94a3b8" />
                                </View>
                                <View style={[styles.fieldWrap, { flex: 1 }]}>
                                    <Text style={styles.label}>Tarif/jour (MAD)</Text>
                                    <TextInput style={styles.input} value={form.daily_rate} onChangeText={v => setForm(p => ({...p, daily_rate: v}))} keyboardType="numeric" placeholder="300" placeholderTextColor="#94a3b8" />
                                </View>
                            </View>

                            {/* Type de véhicule */}
                            <View style={styles.fieldWrap}>
                                <Text style={styles.label}>Type de véhicule</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        {VEHICLE_TYPES.map(t => (
                                            <TouchableOpacity
                                                key={t}
                                                style={[styles.typeChip, form.vehicle_type === t && styles.typeChipActive]}
                                                onPress={() => setForm(p => ({...p, vehicle_type: t}))}
                                            >
                                                <Text style={[styles.typeText, form.vehicle_type === t && styles.typeTextActive]}>{t}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>

                            {/* Statut initial */}
                            <View style={styles.fieldWrap}>
                                <Text style={styles.label}>Statut initial</Text>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    {[
                                        { value: 'available',   label: 'Disponible' },
                                        { value: 'maintenance', label: 'Maintenance' },
                                    ].map(s => (
                                        <TouchableOpacity
                                            key={s.value}
                                            style={[styles.typeChip, form.status === s.value && styles.typeChipActive]}
                                            onPress={() => setForm(p => ({...p, status: s.value}))}
                                        >
                                            <Text style={[styles.typeText, form.status === s.value && styles.typeTextActive]}>{s.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={{ height: 20 }} />
                        </ScrollView>

                        {/* Bouton enregistrer */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                                onPress={handleCreate}
                                disabled={saving}
                            >
                                {saving
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <><Ionicons name="checkmark" size={20} color="#fff" /><Text style={styles.saveBtnText}>Enregistrer</Text></>
                                }
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe:        { flex: 1, backgroundColor: '#f8fafc' },
    center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { marginTop: 10, color: '#64748b' },

    topRow:    { flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 10, gap: 10 },
    searchBox: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 11,
        backgroundColor: '#fff', borderRadius: 12,
        borderWidth: 1, borderColor: '#e2e8f0',
    },
    searchInput: { flex: 1, fontSize: 14, color: '#0f172a' },
    addBtn: {
        width: 46, height: 46, borderRadius: 12,
        backgroundColor: '#1e3a5f',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#1e3a5f', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
    },

    list:  { paddingHorizontal: 16, paddingBottom: 40 },

    card: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
        borderWidth: 1, borderColor: '#f1f5f9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    cardLeft:  { flexDirection: 'row', alignItems: 'center', flex: 1 },
    carIcon: {
        width: 46, height: 46, borderRadius: 12,
        backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    cardInfo:  { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    cardPlate: { fontSize: 13, color: '#475569', marginTop: 2, fontWeight: '600' },
    cardSub:   { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    cardRate:  { fontSize: 12, fontWeight: '700', color: '#16a34a', marginTop: 3 },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginLeft: 8,
    },
    statusText: { fontSize: 11, fontWeight: '700' },

    empty:       { alignItems: 'center', paddingVertical: 60 },
    emptyText:   { color: '#94a3b8', marginTop: 10, fontSize: 15 },
    emptyBtn:    { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#1e3a5f', borderRadius: 10 },
    emptyBtnText:{ color: '#fff', fontWeight: '700', fontSize: 14 },

    // Modal
    modalSafe:   { flex: 1, backgroundColor: '#f8fafc' },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 16,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#1e3a5f' },
    modalBody:  { flex: 1, padding: 20 },
    modalFooter:{ padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },

    formError: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 16,
        borderWidth: 1, borderColor: '#fecaca',
    },
    formErrorText: { flex: 1, color: '#dc2626', fontSize: 13 },

    row2:      { flexDirection: 'row', gap: 12 },
    fieldWrap: { marginBottom: 16 },
    label:     { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
    input: {
        backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
        paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 15, color: '#0f172a',
    },

    // Plaque marocaine
    plateRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
    plateNums:   { width: 80, textAlign: 'center' },
    plateRegion: { width: 56, textAlign: 'center' },
    plateSep:    { paddingHorizontal: 4 },
    plateSepText:{ fontSize: 18, color: '#94a3b8', fontWeight: '300' },
    letterScroll:{ flexGrow: 0 },
    letterBtn: {
        width: 36, height: 44, borderRadius: 8, backgroundColor: '#f1f5f9',
        alignItems: 'center', justifyContent: 'center', marginRight: 4,
    },
    letterBtnActive: { backgroundColor: '#1e3a5f' },
    letterText:      { fontSize: 18, color: '#475569' },
    letterTextActive:{ color: '#fff' },
    platePreview: {
        marginTop: 8, fontSize: 14, fontWeight: '700', color: '#1e3a5f',
        textAlign: 'center', letterSpacing: 1,
    },

    // Chips type/statut
    typeChip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    },
    typeChipActive: { backgroundColor: '#1e3a5f', borderColor: '#1e3a5f' },
    typeText:       { fontSize: 13, fontWeight: '600', color: '#64748b' },
    typeTextActive: { color: '#fff' },

    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#1e3a5f', borderRadius: 14, paddingVertical: 15,
        shadowColor: '#1e3a5f', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
