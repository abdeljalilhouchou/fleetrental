import React, { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, RefreshControl, ActivityIndicator, SafeAreaView,
    Alert, Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getRentals, createRental, getVehicles, completeRental, cancelRental } from '../../api';
import StatsFilterBar from '../../components/StatsFilterBar';

const STATUS_CONFIG = {
    ongoing:   { label: 'En cours',   color: '#16a34a', bg: '#f0fdf4', icon: 'checkmark-circle' },
    active:    { label: 'Active',     color: '#16a34a', bg: '#f0fdf4', icon: 'checkmark-circle' },
    pending:   { label: 'En attente', color: '#d97706', bg: '#fffbeb', icon: 'time' },
    completed: { label: 'Terminée',   color: '#64748b', bg: '#f8fafc', icon: 'checkmark-done' },
    cancelled: { label: 'Annulée',    color: '#dc2626', bg: '#fef2f2', icon: 'close-circle' },
};

function formatDate(str) {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const EMPTY_FORM = {
    vehicle_id: '',
    customer_name: '', customer_phone: '', customer_email: '',
    start_date: '', end_date: '',
    start_mileage: '',
    daily_rate: '', deposit_amount: '',
    notes: '',
};

export default function RentalsScreen() {
    const [rentals,    setRentals]    = useState([]);
    const [vehicles,   setVehicles]   = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search,     setSearch]     = useState('');
    const [filter,     setFilter]     = useState('all');

    const [showModal,  setShowModal]  = useState(false);
    const [form,       setForm]       = useState(EMPTY_FORM);
    const [saving,     setSaving]     = useState(false);
    const [formError,  setFormError]  = useState('');
    const [showVehiclePicker, setShowVehiclePicker] = useState(false);

    // Date picker
    const [activeDateField, setActiveDateField] = useState(null); // 'start_date' | 'end_date'
    const [tempDate, setTempDate] = useState(new Date());

    // Modal terminer/annuler
    const [actionRental, setActionRental] = useState(null); // rental sélectionné pour action
    const [showActionModal, setShowActionModal] = useState(false);
    const [endMileage, setEndMileage] = useState('');
    const [paidAmount, setPaidAmount] = useState('');
    const [actionSaving, setActionSaving] = useState(false);

    // Modal détails
    const [detailItem, setDetailItem] = useState(null);
    const [showDetail, setShowDetail] = useState(false);

    // Modal identifiants locataire
    const [showCreds, setShowCreds]   = useState(false);
    const [credsData, setCredsData]   = useState(null); // { email, pin }

    const loaded = useRef(false);

    const loadData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else if (!loaded.current) setLoading(true);
        try {
            const [r, v] = await Promise.all([
                getRentals().catch(() => []),
                getVehicles().catch(() => []),
            ]);
            setRentals(r);
            setVehicles(v);
            loaded.current = true;
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    // Calcul automatique du total (affiché uniquement, le backend recalcule)
    const calcTotal = (f = form) => {
        if (!f.start_date || !f.end_date || !f.daily_rate) return '';
        const days = Math.ceil((new Date(f.end_date) - new Date(f.start_date)) / 86400000) + 1;
        if (days <= 0) return '';
        return String((days * parseFloat(f.daily_rate)).toFixed(2));
    };

    const updateForm = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setFormError('');
        setShowModal(true);
    };

    const handleCreate = async () => {
        if (!form.vehicle_id)              { setFormError('Sélectionnez un véhicule.'); return; }
        if (!form.customer_name.trim())    { setFormError('Le nom du client est obligatoire.'); return; }
        if (!form.customer_phone.trim())   { setFormError('Le téléphone est obligatoire.'); return; }
        if (!form.start_date)              { setFormError('La date de début est obligatoire.'); return; }
        if (!form.end_date)                { setFormError('La date de fin est obligatoire.'); return; }
        if (!form.daily_rate)              { setFormError('Le tarif journalier est obligatoire.'); return; }
        if (form.deposit_amount === '')    { setFormError('Le montant de la caution est obligatoire.'); return; }

        setSaving(true);
        setFormError('');
        try {
            const result = await createRental({
                vehicle_id:      parseInt(form.vehicle_id),
                customer_name:   form.customer_name.trim(),
                customer_phone:  form.customer_phone.trim(),
                customer_email:  form.customer_email.trim() || null,
                start_date:      form.start_date,
                end_date:        form.end_date,
                start_mileage:   form.start_mileage ? parseInt(form.start_mileage) : 0,
                daily_rate:      parseFloat(form.daily_rate),
                deposit_amount:  parseFloat(form.deposit_amount) || 0,
                notes:           form.notes.trim() || null,
            });
            setShowModal(false);
            loadData(true);
            if (result?.access_credentials) {
                setCredsData(result.access_credentials);
                setShowCreds(true);
            }
        } catch (e) {
            setFormError(e.message || 'Erreur lors de la création.');
        } finally {
            setSaving(false);
        }
    };

    const openActionModal = (rental) => {
        setActionRental(rental);
        setEndMileage('');
        setPaidAmount(String(rental.paid_amount || ''));
        setShowActionModal(true);
    };

    const handleComplete = async () => {
        if (!endMileage) { Alert.alert('Erreur', 'Le kilométrage de retour est obligatoire.'); return; }
        setActionSaving(true);
        try {
            await completeRental(actionRental.id, {
                end_mileage: parseInt(endMileage),
                paid_amount: paidAmount ? parseFloat(paidAmount) : undefined,
            });
            setShowActionModal(false);
            loadData(true);
        } catch (e) {
            Alert.alert('Erreur', e.message);
        } finally {
            setActionSaving(false);
        }
    };

    const handleCancel = () => {
        Alert.alert(
            'Annuler la location',
            `Confirmer l'annulation de la location de ${actionRental?.customer_name} ?`,
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Oui, annuler',
                    style: 'destructive',
                    onPress: async () => {
                        setActionSaving(true);
                        try {
                            await cancelRental(actionRental.id);
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

    const filtered = rentals.filter(r => {
        const client = r.customer_name || r.client_name || '';
        const plate  = r.vehicle?.registration_number || '';
        const matchSearch = !search ||
            `${client} ${plate}`.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' || r.status === filter;
        return matchSearch && matchFilter;
    });

    const FILTERS = [
        { value: 'all',       label: 'Toutes',    icon: 'list',             color: '#1e3a5f', bg: '#eff6ff', count: rentals.length },
        { value: 'ongoing',   label: 'En cours',  icon: 'checkmark-circle', color: '#16a34a', bg: '#f0fdf4', count: rentals.filter(r => r.status === 'ongoing').length },
        { value: 'pending',   label: 'En attente',icon: 'time',             color: '#d97706', bg: '#fffbeb', count: rentals.filter(r => r.status === 'pending').length },
        { value: 'completed', label: 'Terminées', icon: 'checkmark-done',   color: '#64748b', bg: '#f8fafc', count: rentals.filter(r => r.status === 'completed').length },
        { value: 'cancelled', label: 'Annulées',  icon: 'close-circle',     color: '#dc2626', bg: '#fef2f2', count: rentals.filter(r => r.status === 'cancelled').length },
    ];

    const selectedVehicle = vehicles.find(v => String(v.id) === String(form.vehicle_id));

    const renderRental = ({ item: r }) => {
        const s = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
        const clientName   = r.customer_name || r.client_name || 'Client inconnu';
        const vehicleLabel = r.vehicle ? `${r.vehicle.brand} ${r.vehicle.model}` : `Véhicule #${r.vehicle_id}`;
        const totalDays    = r.start_date && r.end_date
            ? Math.ceil((new Date(r.end_date) - new Date(r.start_date)) / 86400000)
            : null;

        const isOngoing = r.status === 'ongoing';
        return (
            <View style={[styles.card, { borderLeftColor: s.color, borderLeftWidth: 4 }]}>
                <View style={styles.cardTop}>
                    <View style={[styles.clientIcon, { backgroundColor: s.bg }]}>
                        <Ionicons name="person-outline" size={18} color={s.color} />
                    </View>
                    <View style={styles.cardInfo}>
                        <Text style={styles.clientName}>{clientName}</Text>
                        <Text style={styles.vehicleName}>{vehicleLabel}</Text>
                        {r.vehicle?.registration_number ? (
                            <Text style={styles.plateText}>{r.vehicle.registration_number}</Text>
                        ) : null}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                        <Ionicons name={s.icon} size={11} color={s.color} />
                        <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                    </View>
                </View>

                <View style={styles.cardMeta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={13} color="#94a3b8" />
                        <Text style={styles.metaText}>{formatDate(r.start_date)}</Text>
                        <Ionicons name="arrow-forward" size={11} color="#94a3b8" />
                        <Text style={styles.metaText}>{formatDate(r.end_date)}</Text>
                    </View>
                    {totalDays ? (
                        <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={13} color="#94a3b8" />
                            <Text style={styles.metaText}>{totalDays} jours</Text>
                        </View>
                    ) : null}
                    {r.total_price ? (
                        <View style={styles.metaItem}>
                            <Ionicons name="cash-outline" size={13} color="#94a3b8" />
                            <Text style={[styles.metaText, { color: '#16a34a', fontWeight: '700' }]}>{Number(r.total_price).toFixed(0)} MAD</Text>
                        </View>
                    ) : null}
                </View>

                <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => { setDetailItem(r); setShowDetail(true); }}>
                        <Ionicons name="eye-outline" size={14} color="#1e3a5f" />
                        <Text style={[styles.actionBtnText, { color: '#1e3a5f' }]}>Détails</Text>
                    </TouchableOpacity>
                    {isOngoing && (<>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => openActionModal(r)}>
                            <Ionicons name="checkmark-circle-outline" size={14} color="#16a34a" />
                            <Text style={[styles.actionBtnText, { color: '#16a34a' }]}>Terminer</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => {
                            setActionRental(r);
                            Alert.alert(
                                'Annuler la location',
                                `Confirmer l'annulation de la location de ${r.customer_name} ?`,
                                [
                                    { text: 'Non', style: 'cancel' },
                                    {
                                        text: 'Oui, annuler', style: 'destructive',
                                        onPress: async () => {
                                            try {
                                                await cancelRental(r.id);
                                                loadData(true);
                                            } catch (e) {
                                                Alert.alert('Erreur', e.message);
                                            }
                                        },
                                    },
                                ]
                            );
                        }}>
                            <Ionicons name="close-circle-outline" size={14} color="#dc2626" />
                            <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>Annuler</Text>
                        </TouchableOpacity>
                    </>)}
                </View>
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
            <View style={styles.topRow}>
                <View style={[styles.searchBox, { flex: 1 }]}>
                    <Ionicons name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Client, véhicule..."
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
                renderItem={renderRental}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={['#1e3a5f']} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="key-outline" size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>Aucune location trouvée</Text>
                        <TouchableOpacity style={styles.emptyBtn} onPress={openCreate}>
                            <Text style={styles.emptyBtnText}>Créer une location</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* ── Modal Détails ── */}
            <Modal visible={showDetail} animationType="slide" transparent onRequestClose={() => setShowDetail(false)}>
                <View style={styles.detailOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowDetail(false)} />
                    <View style={styles.detailSheet}>
                        {detailItem && (() => {
                            const s = STATUS_CONFIG[detailItem.status] || STATUS_CONFIG.pending;
                            const clientName = detailItem.customer_name || detailItem.client_name || '—';
                            const totalDays = detailItem.start_date && detailItem.end_date
                                ? Math.ceil((new Date(detailItem.end_date) - new Date(detailItem.start_date)) / 86400000)
                                : null;
                            return (
                                <>
                                    <View style={styles.detailHeader}>
                                        <View style={[styles.clientIcon, { backgroundColor: s.bg }]}>
                                            <Ionicons name="person-outline" size={18} color={s.color} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.detailTitle}>{clientName}</Text>
                                            <Text style={styles.detailSub}>{detailItem.vehicle?.brand} {detailItem.vehicle?.model}</Text>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                                            <Ionicons name={s.icon} size={11} color={s.color} />
                                            <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => setShowDetail(false)} style={{ marginLeft: 10 }}>
                                            <Ionicons name="close" size={22} color="#94a3b8" />
                                        </TouchableOpacity>
                                    </View>
                                    <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
                                        {[
                                            { icon: 'call-outline',        label: 'Téléphone',     value: detailItem.customer_phone || '—' },
                                            { icon: 'mail-outline',        label: 'Email',         value: detailItem.customer_email || '—' },
                                            { icon: 'car-outline',         label: 'Véhicule',      value: detailItem.vehicle ? `${detailItem.vehicle.brand} ${detailItem.vehicle.model}` : '—' },
                                            { icon: 'barcode-outline',     label: 'Immat.',        value: detailItem.vehicle?.registration_number || '—' },
                                            { icon: 'calendar-outline',    label: 'Début',         value: formatDate(detailItem.start_date) },
                                            { icon: 'calendar-outline',    label: 'Fin',           value: formatDate(detailItem.end_date) },
                                            { icon: 'time-outline',        label: 'Durée',         value: totalDays ? `${totalDays} jours` : '—' },
                                            { icon: 'speedometer-outline', label: 'Km départ',     value: detailItem.start_mileage ? `${Number(detailItem.start_mileage).toLocaleString('fr-FR')} km` : '—' },
                                            { icon: 'cash-outline',        label: 'Tarif/jour',    value: detailItem.daily_rate ? `${Number(detailItem.daily_rate).toFixed(0)} MAD` : '—' },
                                            { icon: 'shield-outline',      label: 'Caution',       value: detailItem.deposit_amount != null ? `${Number(detailItem.deposit_amount).toFixed(0)} MAD` : '—' },
                                            { icon: 'wallet-outline',      label: 'Total',         value: detailItem.total_price ? `${Number(detailItem.total_price).toFixed(0)} MAD` : '—' },
                                            { icon: 'document-text-outline',label: 'Notes',        value: detailItem.notes || '—' },
                                        ].map(row => (
                                            <View key={row.label} style={styles.detailRow}>
                                                <View style={styles.detailRowIcon}>
                                                    <Ionicons name={row.icon} size={16} color="#64748b" />
                                                </View>
                                                <Text style={styles.detailRowLabel}>{row.label}</Text>
                                                <Text style={styles.detailRowValue}>{row.value}</Text>
                                            </View>
                                        ))}
                                        <View style={{ height: 20 }} />
                                    </ScrollView>
                                </>
                            );
                        })()}
                    </View>
                </View>
            </Modal>

            {/* ── Modal Terminer / Annuler ── */}
            <Modal
                visible={showActionModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowActionModal(false)}
            >
                <KeyboardAvoidingView
                    style={styles.actionOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPress={() => setShowActionModal(false)}
                    />
                    <View style={styles.actionSheet}>
                        <View style={styles.actionHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.actionTitle}>{actionRental?.customer_name}</Text>
                                <Text style={styles.actionSub}>
                                    {actionRental?.vehicle?.brand} {actionRental?.vehicle?.model} — {actionRental?.vehicle?.registration_number}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowActionModal(false)}>
                                <Ionicons name="close" size={22} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.label, { marginBottom: 8 }]}>Kilométrage retour *</Text>
                        <TextInput
                            style={styles.input}
                            value={endMileage}
                            onChangeText={setEndMileage}
                            keyboardType="numeric"
                            returnKeyType="done"
                            placeholder={`Min: ${actionRental?.start_mileage ?? 0} km`}
                            placeholderTextColor="#94a3b8"
                        />

                        <Text style={[styles.label, { marginTop: 14, marginBottom: 8 }]}>Montant payé (MAD)</Text>
                        <TextInput
                            style={styles.input}
                            value={paidAmount}
                            onChangeText={setPaidAmount}
                            keyboardType="numeric"
                            returnKeyType="done"
                            placeholder="0"
                            placeholderTextColor="#94a3b8"
                        />

                        <View style={styles.actionBtns}>
                            <TouchableOpacity
                                style={[styles.actionBtnCancel, actionSaving && { opacity: 0.5 }]}
                                onPress={handleCancel}
                                disabled={actionSaving}
                            >
                                <Ionicons name="close-circle-outline" size={18} color="#dc2626" />
                                <Text style={styles.actionBtnCancelText}>Annuler</Text>
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
                        data={vehicles.filter(v => v.status === 'available')}
                        keyExtractor={v => String(v.id)}
                        contentContainerStyle={{ padding: 16 }}
                        ListHeaderComponent={<Text style={styles.pickerHint}>{vehicles.filter(v => v.status === 'available').length} véhicule{vehicles.filter(v => v.status === 'available').length !== 1 ? 's' : ''} disponible{vehicles.filter(v => v.status === 'available').length !== 1 ? 's' : ''}</Text>}
                        renderItem={({ item: v }) => (
                            <TouchableOpacity
                                style={[styles.vehiclePickerRow, String(form.vehicle_id) === String(v.id) && styles.vehiclePickerRowActive]}
                                onPress={() => {
                                    updateForm('vehicle_id', String(v.id));
                                    if (v.daily_rate) updateForm('daily_rate', String(v.daily_rate));
                                    if (v.current_mileage != null) updateForm('start_mileage', String(v.current_mileage));
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
                                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                    {v.daily_rate ? <Text style={styles.vehiclePickerRate}>{Number(v.daily_rate).toFixed(0)} MAD/j</Text> : null}
                                    <Text style={[styles.vehiclePickerStatus, { color: '#16a34a' }]}>Disponible</Text>
                                </View>
                                {String(form.vehicle_id) === String(v.id)
                                    ? <Ionicons name="checkmark-circle" size={20} color="#1e3a5f" style={{ marginLeft: 8 }} />
                                    : null}
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <Ionicons name="car-outline" size={48} color="#cbd5e1" />
                                <Text style={styles.emptyText}>Aucun véhicule trouvé</Text>
                            </View>
                        }
                    />
                </SafeAreaView>
              ) : (
                /* ── Vue formulaire ── */
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <SafeAreaView style={styles.modalSafe}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nouvelle location</Text>
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

                            {/* Infos client */}
                            <View style={styles.fieldWrap}>
                                <Text style={styles.label}>Nom du client *</Text>
                                <TextInput style={styles.input} value={form.customer_name} onChangeText={v => updateForm('customer_name', v)} placeholder="Mohamed Alami" placeholderTextColor="#94a3b8" />
                            </View>
                            <View style={styles.row2}>
                                <View style={[styles.fieldWrap, { flex: 1 }]}>
                                    <Text style={styles.label}>Téléphone *</Text>
                                    <TextInput style={styles.input} value={form.customer_phone} onChangeText={v => updateForm('customer_phone', v)} keyboardType="phone-pad" placeholder="06XXXXXXXX" placeholderTextColor="#94a3b8" />
                                </View>
                                <View style={[styles.fieldWrap, { flex: 1 }]}>
                                    <Text style={styles.label}>Email <Text style={{ color: '#16a34a', fontWeight: '600' }}>(accès mobile)</Text></Text>
                                    <TextInput style={styles.input} value={form.customer_email} onChangeText={v => updateForm('customer_email', v)} keyboardType="email-address" autoCapitalize="none" placeholder="email@example.com" placeholderTextColor="#94a3b8" />
                                </View>
                            </View>

                            {/* Dates */}
                            <View style={styles.row2}>
                                <View style={[styles.fieldWrap, { flex: 1 }]}>
                                    <Text style={styles.label}>Date début *</Text>
                                    <TouchableOpacity
                                        style={[styles.input, styles.dateBtn]}
                                        onPress={() => {
                                            setTempDate(form.start_date ? new Date(form.start_date) : new Date());
                                            setActiveDateField('start_date');
                                        }}
                                    >
                                        <Ionicons name="calendar-outline" size={16} color={form.start_date ? '#1e3a5f' : '#94a3b8'} />
                                        <Text style={form.start_date ? styles.dateBtnValue : styles.dateBtnPlaceholder}>
                                            {form.start_date ? formatDate(form.start_date) : 'Choisir'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={[styles.fieldWrap, { flex: 1 }]}>
                                    <Text style={styles.label}>Date fin *</Text>
                                    <TouchableOpacity
                                        style={[styles.input, styles.dateBtn]}
                                        onPress={() => {
                                            setTempDate(form.end_date ? new Date(form.end_date) : new Date());
                                            setActiveDateField('end_date');
                                        }}
                                    >
                                        <Ionicons name="calendar-outline" size={16} color={form.end_date ? '#1e3a5f' : '#94a3b8'} />
                                        <Text style={form.end_date ? styles.dateBtnValue : styles.dateBtnPlaceholder}>
                                            {form.end_date ? formatDate(form.end_date) : 'Choisir'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Date picker natif (Android dialog / iOS inline) */}
                            {activeDateField && Platform.OS === 'android' && (
                                <DateTimePicker
                                    value={tempDate}
                                    mode="date"
                                    display="default"
                                    minimumDate={activeDateField === 'end_date' && form.start_date ? new Date(form.start_date) : undefined}
                                    onChange={(event, date) => {
                                        setActiveDateField(null);
                                        if (event.type === 'set' && date) {
                                            const iso = date.toISOString().split('T')[0];
                                            updateForm(activeDateField, iso);
                                        }
                                    }}
                                />
                            )}

                            {/* Tarif + Caution */}
                            <View style={styles.row2}>
                                <View style={[styles.fieldWrap, { flex: 1 }]}>
                                    <Text style={styles.label}>Tarif/jour (MAD) *</Text>
                                    <TextInput style={styles.input} value={form.daily_rate} onChangeText={v => updateForm('daily_rate', v)} keyboardType="numeric" placeholder="300" placeholderTextColor="#94a3b8" />
                                </View>
                                <View style={[styles.fieldWrap, { flex: 1 }]}>
                                    <Text style={styles.label}>Caution (MAD) *</Text>
                                    <TextInput style={styles.input} value={form.deposit_amount} onChangeText={v => updateForm('deposit_amount', v)} keyboardType="numeric" placeholder="1000" placeholderTextColor="#94a3b8" />
                                </View>
                            </View>

                            {/* Kilométrage + Total estimé */}
                            <View style={styles.row2}>
                                <View style={[styles.fieldWrap, { flex: 1 }]}>
                                    <Text style={styles.label}>Kilométrage départ</Text>
                                    <TextInput style={styles.input} value={form.start_mileage} onChangeText={v => updateForm('start_mileage', v)} keyboardType="numeric" placeholder="45000" placeholderTextColor="#94a3b8" />
                                </View>
                                <View style={[styles.fieldWrap, { flex: 1 }]}>
                                    <Text style={styles.label}>Total estimé (MAD)</Text>
                                    <View style={[styles.input, { justifyContent: 'center' }]}>
                                        <Text style={{ color: calcTotal() ? '#16a34a' : '#94a3b8', fontWeight: '700', fontSize: 15 }}>
                                            {calcTotal() || 'Auto'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Notes */}
                            <View style={styles.fieldWrap}>
                                <Text style={styles.label}>Notes</Text>
                                <TextInput
                                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                    value={form.notes}
                                    onChangeText={v => updateForm('notes', v)}
                                    placeholder="Remarques éventuelles..."
                                    placeholderTextColor="#94a3b8"
                                    multiline
                                />
                            </View>
                            <View style={{ height: 20 }} />
                        </ScrollView>

                        {/* iOS date picker (calendrier inline) */}
                        {activeDateField && Platform.OS === 'ios' && (
                            <View style={styles.iosPickerSheet}>
                                <View style={styles.iosPickerHeader}>
                                    <TouchableOpacity onPress={() => setActiveDateField(null)}>
                                        <Text style={styles.iosPickerCancel}>Annuler</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.iosPickerTitle}>
                                        {activeDateField === 'start_date' ? 'Date début' : 'Date fin'}
                                    </Text>
                                    <TouchableOpacity onPress={() => {
                                        const iso = tempDate.toISOString().split('T')[0];
                                        updateForm(activeDateField, iso);
                                        setActiveDateField(null);
                                    }}>
                                        <Text style={styles.iosPickerDone}>OK</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={tempDate}
                                    mode="date"
                                    display="inline"
                                    minimumDate={activeDateField === 'end_date' && form.start_date ? new Date(form.start_date) : undefined}
                                    onChange={(_, date) => { if (date) setTempDate(date); }}
                                    locale="fr-FR"
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

            {/* ── Modal Identifiants Locataire ── */}
            <Modal visible={showCreds} animationType="fade" transparent onRequestClose={() => setShowCreds(false)}>
                <View style={styles.credsOverlay}>
                    <View style={styles.credsSheet}>
                        <View style={styles.credsHeader}>
                            <View style={styles.credsIconWrap}>
                                <Ionicons name="key" size={24} color="#fff" />
                            </View>
                            <Text style={styles.credsTitle}>Accès FleetRental Mobile</Text>
                            <Text style={styles.credsSub}>Remettez ces identifiants au locataire pour accéder à l'app mobile.</Text>
                        </View>
                        {credsData && (
                            <>
                                <View style={styles.credsRow}>
                                    <Ionicons name="mail-outline" size={18} color="#64748b" />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.credsLabel}>Email</Text>
                                        <Text style={styles.credsValue}>{credsData.email}</Text>
                                    </View>
                                </View>
                                <View style={styles.credsRow}>
                                    <Ionicons name="lock-closed-outline" size={18} color="#64748b" />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.credsLabel}>PIN</Text>
                                        <Text style={[styles.credsValue, styles.credsPin]}>{credsData.pin}</Text>
                                    </View>
                                </View>
                                <View style={styles.credsNote}>
                                    <Ionicons name="information-circle-outline" size={14} color="#d97706" />
                                    <Text style={styles.credsNoteText}>Le locataire peut se connecter sur l'app FleetRental avec ces identifiants.</Text>
                                </View>
                            </>
                        )}
                        <TouchableOpacity style={styles.credsBtn} onPress={() => setShowCreds(false)}>
                            <Text style={styles.credsBtnText}>Compris</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
        backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
        borderWidth: 1, borderColor: '#f1f5f9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
    clientIcon: {
        width: 42, height: 42, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
    },
    cardInfo:    { flex: 1 },
    clientName:  { fontSize: 14, fontWeight: '700', color: '#0f172a' },
    vehicleName: { fontSize: 12, color: '#64748b', marginTop: 2 },
    plateText:   { fontSize: 11, color: '#94a3b8', marginTop: 1 },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    },
    statusText: { fontSize: 11, fontWeight: '700' },

    cardMeta:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
    metaItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText:  { fontSize: 12, color: '#64748b' },

    cardActions: {
        flexDirection: 'row', gap: 6, marginTop: 12,
        paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9',
    },
    actionBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 4, paddingVertical: 7, borderRadius: 8, backgroundColor: '#f8fafc',
    },
    actionBtnText: { fontSize: 12, fontWeight: '700' },

    empty:        { alignItems: 'center', paddingVertical: 60 },
    emptyText:    { color: '#94a3b8', marginTop: 10, fontSize: 15 },
    emptyBtn:     { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#1e3a5f', borderRadius: 10 },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    // Modal
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
    vehiclePickerRate:   { fontSize: 13, fontWeight: '800', color: '#16a34a' },
    vehiclePickerStatus: { fontSize: 11, fontWeight: '600' },

    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#1e3a5f', borderRadius: 14, paddingVertical: 15,
        shadowColor: '#1e3a5f', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    dateBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
    },
    dateBtnPlaceholder: { fontSize: 14, color: '#94a3b8', flex: 1 },
    dateBtnValue:       { fontSize: 14, color: '#0f172a', fontWeight: '600', flex: 1 },

    iosPickerSheet: {
        backgroundColor: '#fff',
        borderTopWidth: 1, borderTopColor: '#e2e8f0',
    },
    iosPickerHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    iosPickerTitle:  { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    iosPickerCancel: { fontSize: 15, color: '#64748b' },
    iosPickerDone:   { fontSize: 15, color: '#1e3a5f', fontWeight: '700' },

    // Action modal (Terminer / Annuler)
    actionOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    actionSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, paddingBottom: 36,
    },
    actionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 20,
    },
    actionTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
    actionSub:   { fontSize: 12, color: '#64748b', marginTop: 3 },

    actionBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
    actionBtnCancel: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        borderWidth: 1.5, borderColor: '#dc2626', borderRadius: 12, paddingVertical: 13,
    },
    actionBtnCancelText: { color: '#dc2626', fontWeight: '700', fontSize: 14 },

    detailOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
    detailSheet: {
        backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        maxHeight: '80%', paddingBottom: 30,
    },
    detailHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    detailTitle:    { fontSize: 16, fontWeight: '800', color: '#0f172a' },
    detailSub:      { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    detailBody:     { paddingHorizontal: 20, paddingTop: 8 },
    detailRow: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#f8fafc',
    },
    detailRowIcon:  { width: 28, alignItems: 'center' },
    detailRowLabel: { flex: 1, fontSize: 13, color: '#64748b', marginLeft: 8 },
    detailRowValue: { fontSize: 13, fontWeight: '700', color: '#0f172a', maxWidth: '50%', textAlign: 'right' },
    actionBtnComplete: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 13,
    },
    actionBtnCompleteText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    // Modal identifiants locataire
    credsOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center', alignItems: 'center', padding: 24,
    },
    credsSheet: {
        backgroundColor: '#fff', borderRadius: 24, width: '100%',
        overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
    },
    credsHeader: {
        backgroundColor: '#1e3a5f', padding: 24, alignItems: 'center', gap: 8,
    },
    credsIconWrap: {
        width: 48, height: 48, borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 4,
    },
    credsTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
    credsSub:   { fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 18 },
    credsRow: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingHorizontal: 20, paddingVertical: 16,
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    credsLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
    credsValue: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
    credsPin:   { fontSize: 26, fontWeight: '900', color: '#1e3a5f', letterSpacing: 6 },
    credsNote: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        margin: 16, backgroundColor: '#fef3c7', borderRadius: 12,
        padding: 12, borderWidth: 1, borderColor: '#fde68a',
    },
    credsNoteText: { fontSize: 12, color: '#92400e', flex: 1, lineHeight: 18 },
    credsBtn: {
        margin: 20, marginTop: 8,
        backgroundColor: '#1e3a5f', borderRadius: 14, paddingVertical: 15,
        alignItems: 'center',
    },
    credsBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
