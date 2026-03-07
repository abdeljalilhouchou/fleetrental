import React, { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, RefreshControl, ActivityIndicator, SafeAreaView,
    Alert, Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getMaintenances, createMaintenance, getVehicles, completeMaintenance, deleteMaintenance } from '../../api';
import StatsFilterBar from '../../components/StatsFilterBar';

const STATUS_CONFIG = {
    scheduled:   { label: 'Planifiée', color: '#2563eb', bg: '#eff6ff', icon: 'calendar' },
    in_progress: { label: 'En cours',  color: '#d97706', bg: '#fffbeb', icon: 'construct' },
    completed:   { label: 'Terminée',  color: '#16a34a', bg: '#f0fdf4', icon: 'checkmark-circle' },
    cancelled:   { label: 'Annulée',   color: '#dc2626', bg: '#fef2f2', icon: 'close-circle' },
};

const MAINTENANCE_TYPES = [
    { value: 'oil_change',    label: 'Vidange' },
    { value: 'tire_change',   label: 'Pneus' },
    { value: 'brake_service', label: 'Freins' },
    { value: 'engine_repair', label: 'Moteur' },
    { value: 'inspection',    label: 'Contrôle' },
    { value: 'cleaning',      label: 'Nettoyage' },
    { value: 'other',         label: 'Autre' },
];

function formatDate(str) {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const EMPTY_FORM = {
    vehicle_id: '',
    type: 'oil_change',
    date: '',
    description: '',
    cost: '',
    mileage_at_maintenance: '',
};

export default function MaintenancesScreen() {
    const [maintenances, setMaintenances] = useState([]);
    const [vehicles,     setVehicles]     = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [refreshing,   setRefreshing]   = useState(false);
    const [search,       setSearch]       = useState('');
    const [filter,       setFilter]       = useState('all');

    const [showModal,         setShowModal]         = useState(false);
    const [form,              setForm]              = useState(EMPTY_FORM);
    const [saving,            setSaving]            = useState(false);
    const [formError,         setFormError]         = useState('');
    const [showVehiclePicker, setShowVehiclePicker] = useState(false);
    const [showDatePicker,    setShowDatePicker]    = useState(false);
    const [tempDate,          setTempDate]          = useState(new Date());

    // Modal action (Terminer / Supprimer)
    const [actionMaint,      setActionMaint]      = useState(null);
    const [showActionModal,  setShowActionModal]  = useState(false);
    const [actionSaving,     setActionSaving]     = useState(false);

    const loaded = useRef(false);

    const loadData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else if (!loaded.current) setLoading(true);
        try {
            const [m, v] = await Promise.all([
                getMaintenances().catch(() => []),
                getVehicles().catch(() => []),
            ]);
            setMaintenances(m);
            setVehicles(v);
            loaded.current = true;
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setFormError('');
        setShowModal(true);
    };

    const handleCreate = async () => {
        if (!form.vehicle_id)           { setFormError('Sélectionnez un véhicule.'); return; }
        if (!form.date)                 { setFormError('La date est obligatoire.'); return; }
        if (!form.cost)                 { setFormError('Le coût est obligatoire.'); return; }
        if (!form.mileage_at_maintenance) { setFormError('Le kilométrage est obligatoire.'); return; }

        setSaving(true);
        setFormError('');
        try {
            await createMaintenance({
                vehicle_id:             parseInt(form.vehicle_id),
                type:                   form.type,
                date:                   form.date,
                description:            form.description.trim() || null,
                cost:                   parseFloat(form.cost),
                mileage_at_maintenance: parseInt(form.mileage_at_maintenance),
            });
            setShowModal(false);
            loadData(true);
        } catch (e) {
            setFormError(e.message || 'Erreur lors de la création.');
        } finally {
            setSaving(false);
        }
    };

    const openActionModal = (maint) => {
        setActionMaint(maint);
        setShowActionModal(true);
    };

    const handleComplete = async () => {
        setActionSaving(true);
        try {
            await completeMaintenance(actionMaint.id);
            setShowActionModal(false);
            loadData(true);
        } catch (e) {
            Alert.alert('Erreur', e.message);
        } finally {
            setActionSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Supprimer la maintenance',
            `Confirmer la suppression de la maintenance "${MAINTENANCE_TYPES.find(t => t.value === actionMaint?.type)?.label || actionMaint?.type}" ?`,
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Oui, supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        setActionSaving(true);
                        try {
                            await deleteMaintenance(actionMaint.id);
                            setShowActionModal(false);
                            loadData(true);
                        } catch (e) {
                            Alert.alert('Erreur', e.message);
                        } finally {
                            setActionSaving(false);
                        }
                    },
                },
            ]
        );
    };

    const filtered = maintenances.filter(m => {
        const plate   = m.vehicle?.registration_number || '';
        const vehicle = m.vehicle ? `${m.vehicle.brand} ${m.vehicle.model}` : '';
        const type    = MAINTENANCE_TYPES.find(t => t.value === (m.type || m.maintenance_type))?.label || '';
        const matchSearch = !search ||
            `${vehicle} ${plate} ${type}`.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' || m.status === filter;
        return matchSearch && matchFilter;
    });

    const FILTERS = [
        { value: 'all',         label: 'Toutes',     icon: 'list',             color: '#1e3a5f', bg: '#eff6ff', count: maintenances.length },
        { value: 'scheduled',   label: 'Planifiées', icon: 'calendar',         color: '#2563eb', bg: '#eff6ff', count: maintenances.filter(m => m.status === 'scheduled').length },
        { value: 'in_progress', label: 'En cours',   icon: 'construct',        color: '#d97706', bg: '#fffbeb', count: maintenances.filter(m => m.status === 'in_progress').length },
        { value: 'completed',   label: 'Terminées',  icon: 'checkmark-circle', color: '#16a34a', bg: '#f0fdf4', count: maintenances.filter(m => m.status === 'completed').length },
        { value: 'cancelled',   label: 'Annulées',   icon: 'close-circle',     color: '#dc2626', bg: '#fef2f2', count: maintenances.filter(m => m.status === 'cancelled').length },
    ];

    const selectedVehicle = vehicles.find(v => String(v.id) === String(form.vehicle_id));

    const renderItem = ({ item: m }) => {
        const s            = STATUS_CONFIG[m.status] || STATUS_CONFIG.scheduled;
        const vehicleLabel = m.vehicle ? `${m.vehicle.brand} ${m.vehicle.model}` : `Véhicule #${m.vehicle_id}`;
        const typeLabel    = MAINTENANCE_TYPES.find(t => t.value === (m.type || m.maintenance_type))?.label || m.type || 'Maintenance';
        const isActionable = m.status === 'in_progress';

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={isActionable ? 0.75 : 1}
                onPress={isActionable ? () => openActionModal(m) : undefined}
            >
                <View style={styles.cardTop}>
                    <View style={styles.typeIcon}>
                        <Ionicons name="construct-outline" size={20} color="#d97706" />
                    </View>
                    <View style={styles.cardInfo}>
                        <Text style={styles.typeLabel}>{typeLabel}</Text>
                        <Text style={styles.vehicleName}>{vehicleLabel}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                        <Ionicons name={s.icon} size={11} color={s.color} />
                        <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                    </View>
                </View>
                <View style={styles.cardBottom}>
                    <View style={styles.dateBlock}>
                        <Ionicons name="calendar-outline" size={13} color="#94a3b8" />
                        <Text style={styles.dateText}>{formatDate(m.date || m.scheduled_date)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {m.cost ? <Text style={styles.costText}>{Number(m.cost).toFixed(0)} MAD</Text> : null}
                        {isActionable ? <Ionicons name="chevron-forward" size={14} color="#94a3b8" /> : null}
                    </View>
                </View>
                {m.description ? <Text style={styles.description} numberOfLines={2}>{m.description}</Text> : null}
            </TouchableOpacity>
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
            <View style={styles.topRow}>
                <View style={[styles.searchBox, { flex: 1 }]}>
                    <Ionicons name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Véhicule, type..."
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

            <StatsFilterBar filters={FILTERS} active={filter} onChange={setFilter} />

            <FlatList
                data={filtered}
                keyExtractor={item => String(item.id)}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={['#1e3a5f']} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="construct-outline" size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>Aucune maintenance trouvée</Text>
                        <TouchableOpacity style={styles.emptyBtn} onPress={openCreate}>
                            <Text style={styles.emptyBtnText}>Créer une maintenance</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* ── Modal action (Terminer / Supprimer) ── */}
            <Modal
                visible={showActionModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowActionModal(false)}
            >
                <KeyboardAvoidingView style={styles.actionOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowActionModal(false)} />
                    <View style={styles.actionSheet}>
                        <View style={styles.actionHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.actionTitle}>
                                    {MAINTENANCE_TYPES.find(t => t.value === actionMaint?.type)?.label || actionMaint?.type}
                                </Text>
                                <Text style={styles.actionSub}>
                                    {actionMaint?.vehicle?.brand} {actionMaint?.vehicle?.model} — {actionMaint?.vehicle?.registration_number}
                                </Text>
                                {actionMaint?.cost ? (
                                    <Text style={[styles.actionSub, { color: '#dc2626', fontWeight: '700', marginTop: 4 }]}>
                                        Coût : {Number(actionMaint.cost).toFixed(0)} MAD
                                    </Text>
                                ) : null}
                            </View>
                            <TouchableOpacity onPress={() => setShowActionModal(false)}>
                                <Ionicons name="close" size={22} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.actionBtns}>
                            <TouchableOpacity
                                style={[styles.actionBtnDelete, actionSaving && { opacity: 0.5 }]}
                                onPress={handleDelete}
                                disabled={actionSaving}
                            >
                                <Ionicons name="trash-outline" size={18} color="#dc2626" />
                                <Text style={styles.actionBtnDeleteText}>Supprimer</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtnComplete, actionSaving && { opacity: 0.5 }]}
                                onPress={handleComplete}
                                disabled={actionSaving}
                            >
                                {actionSaving
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <>
                                        <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                                        <Text style={styles.actionBtnCompleteText}>Terminer</Text>
                                      </>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* ── Modal unique (formulaire + picker intégré) ── */}
            <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
              {showVehiclePicker ? (
                /* ── Vue picker véhicule ── */
                <SafeAreaView style={styles.modalSafe}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowVehiclePicker(false)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="arrow-back" size={20} color="#1e3a5f" />
                            <Text style={{ color: '#1e3a5f', fontWeight: '600', fontSize: 15 }}>Retour</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Choisir un véhicule</Text>
                        <View style={{ width: 60 }} />
                    </View>
                    <FlatList
                        data={vehicles.filter(v => v.status !== 'rented')}
                        keyExtractor={v => String(v.id)}
                        contentContainerStyle={{ padding: 16 }}
                        ListHeaderComponent={
                            <Text style={styles.pickerHint}>
                                {vehicles.filter(v => v.status !== 'rented').length} véhicule{vehicles.filter(v => v.status !== 'rented').length !== 1 ? 's' : ''} disponibles pour maintenance
                            </Text>
                        }
                        renderItem={({ item: v }) => {
                            const statusColors = {
                                available:      '#16a34a',
                                maintenance:    '#d97706',
                                out_of_service: '#dc2626',
                                reserved:       '#7c3aed',
                            };
                            const statusLabels = {
                                available:      'Disponible',
                                maintenance:    'En maintenance',
                                out_of_service: 'Hors service',
                                reserved:       'Réservée',
                            };
                            return (
                                <TouchableOpacity
                                    style={[styles.vehiclePickerRow, String(form.vehicle_id) === String(v.id) && styles.vehiclePickerRowActive]}
                                    onPress={() => {
                                        setForm(p => ({...p, vehicle_id: String(v.id)}));
                                        setShowVehiclePicker(false);
                                    }}
                                >
                                    <View style={styles.vehiclePickerIcon}>
                                        <Ionicons name="car-sport-outline" size={20} color="#1e3a5f" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.vehiclePickerName}>{v.brand} {v.model} ({v.year})</Text>
                                        <Text style={styles.vehiclePickerPlate}>{v.registration_number}</Text>
                                    </View>
                                    <Text style={[styles.vehiclePickerStatus, { color: statusColors[v.status] || '#64748b', marginRight: 8 }]}>
                                        {statusLabels[v.status] || v.status}
                                    </Text>
                                    {String(form.vehicle_id) === String(v.id)
                                        ? <Ionicons name="checkmark-circle" size={20} color="#1e3a5f" />
                                        : null}
                                </TouchableOpacity>
                            );
                        }}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <Ionicons name="car-outline" size={48} color="#cbd5e1" />
                                <Text style={styles.emptyText}>Aucun véhicule disponible{'\n'}(tous en location active)</Text>
                            </View>
                        }
                    />
                </SafeAreaView>
              ) : (
                /* ── Vue formulaire ── */
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <SafeAreaView style={styles.modalSafe}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nouvelle maintenance</Text>
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

                            {/* Sélection véhicule */}
                            <View style={styles.fieldWrap}>
                                <Text style={styles.label}>Véhicule *</Text>
                                <TouchableOpacity
                                    style={[styles.input, styles.pickerBtn]}
                                    onPress={() => setShowVehiclePicker(true)}
                                >
                                    <Text style={selectedVehicle ? styles.pickerValue : styles.pickerPlaceholder}>
                                        {selectedVehicle
                                            ? `${selectedVehicle.brand} ${selectedVehicle.model} — ${selectedVehicle.registration_number}`
                                            : 'Sélectionner un véhicule...'}
                                    </Text>
                                    <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>

                            {/* Type de maintenance */}
                            <View style={styles.fieldWrap}>
                                <Text style={styles.label}>Type de maintenance</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        {MAINTENANCE_TYPES.map(t => (
                                            <TouchableOpacity
                                                key={t.value}
                                                style={[styles.typeChip, form.type === t.value && styles.typeChipActive]}
                                                onPress={() => setForm(p => ({...p, type: t.value}))}
                                            >
                                                <Text style={[styles.typeText, form.type === t.value && styles.typeTextActive]}>{t.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>

                            {/* Date + Kilométrage */}
                            <View style={styles.row2}>
                                <View style={[styles.fieldWrap, { flex: 1 }]}>
                                    <Text style={styles.label}>Date *</Text>
                                    <TouchableOpacity
                                        style={[styles.input, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}
                                        onPress={() => {
                                            setTempDate(form.date ? new Date(form.date) : new Date());
                                            setShowDatePicker(true);
                                        }}
                                    >
                                        <Ionicons name="calendar-outline" size={16} color={form.date ? '#1e3a5f' : '#94a3b8'} />
                                        <Text style={{ color: form.date ? '#0f172a' : '#94a3b8', fontSize: 14, fontWeight: form.date ? '600' : '400' }}>
                                            {form.date ? formatDate(form.date) : 'Choisir'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={[styles.fieldWrap, { flex: 1 }]}>
                                    <Text style={styles.label}>Kilométrage *</Text>
                                    <TextInput style={styles.input} value={form.mileage_at_maintenance} onChangeText={v => setForm(p => ({...p, mileage_at_maintenance: v}))} keyboardType="numeric" placeholder="45000" placeholderTextColor="#94a3b8" />
                                </View>
                            </View>

                            {/* Android date picker */}
                            {showDatePicker && Platform.OS === 'android' && (
                                <DateTimePicker
                                    value={tempDate}
                                    mode="date"
                                    display="default"
                                    onChange={(event, date) => {
                                        setShowDatePicker(false);
                                        if (event.type === 'set' && date) {
                                            setForm(p => ({...p, date: date.toISOString().split('T')[0]}));
                                        }
                                    }}
                                />
                            )}

                            {/* Coût */}
                            <View style={styles.fieldWrap}>
                                <Text style={styles.label}>Coût (MAD) *</Text>
                                <TextInput style={styles.input} value={form.cost} onChangeText={v => setForm(p => ({...p, cost: v}))} keyboardType="numeric" placeholder="500" placeholderTextColor="#94a3b8" />
                            </View>

                            {/* Description */}
                            <View style={styles.fieldWrap}>
                                <Text style={styles.label}>Description</Text>
                                <TextInput
                                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                    value={form.description}
                                    onChangeText={v => setForm(p => ({...p, description: v}))}
                                    placeholder="Détails de l'intervention..."
                                    placeholderTextColor="#94a3b8"
                                    multiline
                                />
                            </View>
                            <View style={{ height: 20 }} />
                        </ScrollView>

                        {/* iOS date picker */}
                        {showDatePicker && Platform.OS === 'ios' && (
                            <View style={styles.iosPickerSheet}>
                                <View style={styles.iosPickerHeader}>
                                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                        <Text style={styles.iosPickerCancel}>Annuler</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.iosPickerTitle}>Date</Text>
                                    <TouchableOpacity onPress={() => {
                                        setForm(p => ({...p, date: tempDate.toISOString().split('T')[0]}));
                                        setShowDatePicker(false);
                                    }}>
                                        <Text style={styles.iosPickerDone}>OK</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={tempDate}
                                    mode="date"
                                    display="inline"
                                    onChange={(_, date) => { if (date) setTempDate(date); }}
                                    accentColor="#1e3a5f"
                                    themeVariant="light"
                                />
                            </View>
                        )}

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
              )}
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
        backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
        borderWidth: 1, borderColor: '#f1f5f9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    typeIcon: {
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: '#fffbeb', alignItems: 'center', justifyContent: 'center', marginRight: 10,
    },
    cardInfo:    { flex: 1 },
    typeLabel:   { fontSize: 14, fontWeight: '700', color: '#0f172a' },
    vehicleName: { fontSize: 12, color: '#64748b', marginTop: 2 },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    },
    statusText: { fontSize: 11, fontWeight: '700' },

    cardBottom:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dateBlock:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
    dateText:    { fontSize: 12, color: '#475569' },
    costText:    { fontSize: 13, fontWeight: '800', color: '#dc2626' },
    description: { fontSize: 12, color: '#94a3b8', marginTop: 8, lineHeight: 18 },

    empty:        { alignItems: 'center', paddingVertical: 60 },
    emptyText:    { color: '#94a3b8', marginTop: 10, fontSize: 15 },
    emptyBtn:     { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#1e3a5f', borderRadius: 10 },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    modalSafe:   { flex: 1, backgroundColor: '#f8fafc' },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 16,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    },
    modalTitle:  { fontSize: 18, fontWeight: '800', color: '#1e3a5f' },
    modalBody:   { flex: 1, padding: 20 },
    modalFooter: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },

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

    pickerBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    pickerPlaceholder: { color: '#94a3b8', fontSize: 15, flex: 1 },
    pickerValue:       { color: '#0f172a', fontSize: 14, flex: 1, fontWeight: '600' },
    pickerHint:        { fontSize: 12, color: '#94a3b8', marginBottom: 12 },

    typeChip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    },
    typeChipActive: { backgroundColor: '#1e3a5f', borderColor: '#1e3a5f' },
    typeText:       { fontSize: 13, fontWeight: '600', color: '#64748b' },
    typeTextActive: { color: '#fff' },

    vehiclePickerRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
        borderWidth: 1, borderColor: '#e2e8f0',
    },
    vehiclePickerRowActive: { borderColor: '#1e3a5f', backgroundColor: '#f0f4ff' },
    vehiclePickerIcon: {
        width: 42, height: 42, borderRadius: 10,
        backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    vehiclePickerName:   { fontSize: 14, fontWeight: '700', color: '#0f172a' },
    vehiclePickerPlate:  { fontSize: 12, color: '#64748b', marginTop: 2 },
    vehiclePickerStatus: { fontSize: 11, fontWeight: '600' },

    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#1e3a5f', borderRadius: 14, paddingVertical: 15,
        shadowColor: '#1e3a5f', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    iosPickerSheet: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
    iosPickerHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    iosPickerTitle:  { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    iosPickerCancel: { fontSize: 15, color: '#64748b' },
    iosPickerDone:   { fontSize: 15, color: '#1e3a5f', fontWeight: '700' },

    // Action modal
    actionOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    actionSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, paddingBottom: 36,
    },
    actionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 24,
    },
    actionTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
    actionSub:   { fontSize: 12, color: '#64748b', marginTop: 3 },
    actionBtns:  { flexDirection: 'row', gap: 10 },
    actionBtnDelete: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        borderWidth: 1.5, borderColor: '#dc2626', borderRadius: 12, paddingVertical: 13,
    },
    actionBtnDeleteText: { color: '#dc2626', fontWeight: '700', fontSize: 14 },
    actionBtnComplete: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 13,
    },
    actionBtnCompleteText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
