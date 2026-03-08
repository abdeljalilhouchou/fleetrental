import React, { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, RefreshControl, ActivityIndicator, SafeAreaView,
    Alert, Modal, ScrollView, KeyboardAvoidingView, Platform,
    Animated, PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getRentals, createRental, getVehicles, completeRental, cancelRental, archiveRental, unarchiveRental } from '../../api';
import StatsFilterBar from '../../components/StatsFilterBar';

const PRIMARY = '#4c1d95';
const ACCENT  = '#7c3aed';

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

// ── Swipeable row (glisser à droite pour archiver) ────────────────────────────
function SwipeableRow({ children, onSwipe, disabled }) {
    const translateX = useRef(new Animated.Value(0)).current;
    const THRESHOLD  = 100;

    const panResponder = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder:  (_, g) => !disabled && Math.abs(g.dx) > 5 && g.dx > 0,
        onPanResponderMove: (_, g) => {
            if (g.dx > 0) translateX.setValue(g.dx);
        },
        onPanResponderRelease: (_, g) => {
            if (g.dx >= THRESHOLD) {
                Animated.timing(translateX, { toValue: 400, useNativeDriver: true, duration: 200 }).start(() => {
                    translateX.setValue(0);
                    onSwipe && onSwipe();
                });
            } else {
                Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
            }
        },
        onPanResponderTerminate: () => {
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        },
    })).current;

    return (
        <View style={{ position: 'relative', overflow: 'hidden', borderRadius: 14, marginBottom: 10 }}>
            <View style={[StyleSheet.absoluteFill, styles.swipeBg]}>
                <Ionicons name="archive" size={24} color="#fff" />
                <Text style={styles.swipeBgText}>Archiver</Text>
            </View>
            <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
                {children}
            </Animated.View>
        </View>
    );
}

export default function RentalsScreen() {
    const [rentals,      setRentals]      = useState([]);
    const [archived,     setArchived]     = useState([]);
    const [vehicles,     setVehicles]     = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [refreshing,   setRefreshing]   = useState(false);
    const [search,       setSearch]       = useState('');
    const [filter,       setFilter]       = useState('all');
    const [showArchived, setShowArchived] = useState(false);

    const [showModal,         setShowModal]         = useState(false);
    const [form,              setForm]              = useState(EMPTY_FORM);
    const [saving,            setSaving]            = useState(false);
    const [formError,         setFormError]         = useState('');
    const [showVehiclePicker, setShowVehiclePicker] = useState(false);
    const [dateField,         setDateField]         = useState(null);
    const [showDatePicker,    setShowDatePicker]    = useState(false);
    const [tempDate,          setTempDate]          = useState(new Date());
    const [detailItem,        setDetailItem]        = useState(null);
    const [showDetail,        setShowDetail]        = useState(false);

    const loaded = useRef(false);

    const loadData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else if (!loaded.current) setLoading(true);
        try {
            const [active, arch, v] = await Promise.all([
                getRentals(false).catch(() => []),
                getRentals(true).catch(() => []),
                getVehicles().catch(() => []),
            ]);
            setRentals(active);
            setArchived(arch);
            setVehicles(v);
            loaded.current = true;
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const handleArchive = (rental) => {
        Alert.alert(
            'Archiver la location',
            `Archiver la location de "${rental.customer_name}" ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Archiver',
                    onPress: async () => {
                        try {
                            await archiveRental(rental.id);
                            loadData(true);
                        } catch (e) {
                            Alert.alert('Erreur', e.message);
                        }
                    },
                },
            ]
        );
    };

    const handleUnarchive = async (rental) => {
        try {
            await unarchiveRental(rental.id);
            loadData(true);
        } catch (e) {
            Alert.alert('Erreur', e.message);
        }
    };

    const handleComplete = (rental) => {
        Alert.alert(
            'Terminer la location',
            `Terminer la location de "${rental.customer_name}" ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Terminer',
                    onPress: async () => {
                        try { await completeRental(rental.id); loadData(true); }
                        catch (e) { Alert.alert('Erreur', e.message); }
                    },
                },
            ]
        );
    };

    const handleCancel = (rental) => {
        Alert.alert(
            'Annuler la location',
            `Annuler la location de "${rental.customer_name}" ?`,
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Oui, annuler', style: 'destructive',
                    onPress: async () => {
                        try { await cancelRental(rental.id); loadData(true); }
                        catch (e) { Alert.alert('Erreur', e.message); }
                    },
                },
            ]
        );
    };

    const handleCreate = async () => {
        if (!form.vehicle_id)        { setFormError('Sélectionnez un véhicule.'); return; }
        if (!form.customer_name.trim()) { setFormError('Le nom du client est obligatoire.'); return; }
        if (!form.start_date)        { setFormError('La date de début est obligatoire.'); return; }
        if (!form.end_date)          { setFormError('La date de fin est obligatoire.'); return; }

        const payload = {
            vehicle_id:      parseInt(form.vehicle_id),
            customer_name:   form.customer_name.trim(),
            customer_phone:  form.customer_phone.trim() || null,
            customer_email:  form.customer_email.trim() || null,
            start_date:      form.start_date,
            end_date:        form.end_date,
            start_mileage:   form.start_mileage ? parseInt(form.start_mileage) : null,
            daily_rate:      form.daily_rate ? parseFloat(form.daily_rate) : null,
            deposit_amount:  form.deposit_amount ? parseFloat(form.deposit_amount) : null,
            notes:           form.notes.trim() || null,
        };

        setSaving(true);
        setFormError('');
        try {
            await createRental(payload);
            setShowModal(false);
            loadData(true);
        } catch (e) {
            setFormError(e.message || 'Erreur lors de la création.');
        } finally {
            setSaving(false);
        }
    };

    const openDatePicker = (field) => {
        setDateField(field);
        setTempDate(form[field] ? new Date(form[field]) : new Date());
        setShowDatePicker(true);
    };

    const displayList = showArchived ? archived : rentals;

    const filtered = displayList.filter(r => {
        const matchSearch = !search ||
            `${r.customer_name} ${r.vehicle?.brand} ${r.vehicle?.model} ${r.vehicle?.registration_number}`
                .toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' || r.status === filter;
        return matchSearch && matchFilter;
    });

    const FILTERS = showArchived ? [
        { value: 'all',       label: 'Toutes',    icon: 'archive',         color: '#64748b', bg: '#f8fafc', count: archived.length },
        { value: 'completed', label: 'Terminées', icon: 'checkmark-done',  color: '#16a34a', bg: '#f0fdf4', count: archived.filter(r => r.status === 'completed').length },
        { value: 'cancelled', label: 'Annulées',  icon: 'close-circle',    color: '#dc2626', bg: '#fef2f2', count: archived.filter(r => r.status === 'cancelled').length },
    ] : [
        { value: 'all',       label: 'Toutes',    icon: 'list',            color: PRIMARY,   bg: '#f5f3ff', count: rentals.length },
        { value: 'ongoing',   label: 'En cours',  icon: 'checkmark-circle',color: '#16a34a', bg: '#f0fdf4', count: rentals.filter(r => r.status === 'ongoing').length },
        { value: 'pending',   label: 'En attente',icon: 'time',            color: '#d97706', bg: '#fffbeb', count: rentals.filter(r => r.status === 'pending').length },
        { value: 'completed', label: 'Terminées', icon: 'checkmark-done',  color: '#64748b', bg: '#f8fafc', count: rentals.filter(r => r.status === 'completed').length },
        { value: 'cancelled', label: 'Annulées',  icon: 'close-circle',    color: '#dc2626', bg: '#fef2f2', count: rentals.filter(r => r.status === 'cancelled').length },
    ];

    const selectedVehicle = vehicles.find(v => String(v.id) === String(form.vehicle_id));

    const renderCard = (r) => {
        const s      = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
        const isOngoing = r.status === 'ongoing' || r.status === 'active';
        const days   = r.start_date && r.end_date
            ? Math.max(1, Math.round((new Date(r.end_date) - new Date(r.start_date)) / 86400000))
            : null;

        const card = (
            <View style={[styles.card, { borderLeftColor: s.color, borderLeftWidth: 4, marginBottom: showArchived ? 10 : 0, borderRadius: 14 }]}>
                <View style={styles.cardTop}>
                    <View style={[styles.iconBox, { backgroundColor: s.bg }]}>
                        <Ionicons name="key-outline" size={20} color={s.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardName}>{r.customer_name}</Text>
                        <Text style={styles.cardVehicle}>
                            {r.vehicle ? `${r.vehicle.brand} ${r.vehicle.model}` : `Véh. #${r.vehicle_id}`}
                        </Text>
                        {r.vehicle?.registration_number ? (
                            <Text style={styles.cardPlate}>{r.vehicle.registration_number}</Text>
                        ) : null}
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                            <Ionicons name={s.icon} size={11} color={s.color} />
                            <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                        </View>
                        {r.daily_rate && days ? (
                            <Text style={styles.totalText}>{(Number(r.daily_rate) * days).toFixed(0)} MAD</Text>
                        ) : null}
                    </View>
                </View>

                <View style={styles.cardMeta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={13} color="#94a3b8" />
                        <Text style={styles.metaText}>{formatDate(r.start_date)} → {formatDate(r.end_date)}</Text>
                    </View>
                    {r.daily_rate ? (
                        <View style={styles.metaItem}>
                            <Ionicons name="cash-outline" size={13} color="#94a3b8" />
                            <Text style={styles.metaText}>{Number(r.daily_rate).toFixed(0)} MAD/j</Text>
                        </View>
                    ) : null}
                </View>

                <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => { setDetailItem(r); setShowDetail(true); }}>
                        <Ionicons name="eye-outline" size={14} color={PRIMARY} />
                        <Text style={[styles.actionBtnText, { color: PRIMARY }]}>Détails</Text>
                    </TouchableOpacity>
                    {showArchived ? (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleUnarchive(r)}>
                            <Ionicons name="arrow-undo-outline" size={14} color="#2563eb" />
                            <Text style={[styles.actionBtnText, { color: '#2563eb' }]}>Désarchiver</Text>
                        </TouchableOpacity>
                    ) : (
                        <>
                            {isOngoing && (
                                <TouchableOpacity style={styles.actionBtn} onPress={() => handleComplete(r)}>
                                    <Ionicons name="checkmark-circle-outline" size={14} color="#16a34a" />
                                    <Text style={[styles.actionBtnText, { color: '#16a34a' }]}>Terminer</Text>
                                </TouchableOpacity>
                            )}
                            {isOngoing && (
                                <TouchableOpacity style={styles.actionBtn} onPress={() => handleCancel(r)}>
                                    <Ionicons name="close-circle-outline" size={14} color="#dc2626" />
                                    <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>Annuler</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            </View>
        );

        if (!showArchived && !isOngoing) {
            return (
                <SwipeableRow key={r.id} onSwipe={() => handleArchive(r)}>
                    {card}
                </SwipeableRow>
            );
        }
        return <View key={r.id}>{card}</View>;
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={ACCENT} />
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
                <TouchableOpacity
                    style={[styles.archiveToggle, showArchived && styles.archiveToggleActive]}
                    onPress={() => { setShowArchived(v => !v); setFilter('all'); }}
                >
                    <Ionicons name="archive" size={18} color={showArchived ? '#fff' : '#64748b'} />
                    {archived.length > 0 && (
                        <View style={styles.archiveBadge}>
                            <Text style={styles.archiveBadgeText}>{archived.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <StatsFilterBar filters={FILTERS} active={filter} onChange={setFilter} />

            {!showArchived && (
                <Text style={styles.swipeHint}>
                    <Ionicons name="arrow-forward" size={11} color="#94a3b8" /> Glisser → pour archiver (locations terminées/annulées)
                </Text>
            )}

            <FlatList
                data={filtered}
                keyExtractor={item => String(item.id)}
                renderItem={({ item }) => renderCard(item)}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={[ACCENT]} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name={showArchived ? 'archive-outline' : 'key-outline'} size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>{showArchived ? 'Aucune location archivée' : 'Aucune location trouvée'}</Text>
                    </View>
                }
            />

            {!showArchived && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => { setForm(EMPTY_FORM); setFormError(''); setShowModal(true); }}
                    activeOpacity={0.85}
                >
                    <Ionicons name="add" size={26} color="#fff" />
                </TouchableOpacity>
            )}

            {/* ── Modal Détails ── */}
            <Modal visible={showDetail} animationType="slide" transparent onRequestClose={() => setShowDetail(false)}>
                <View style={styles.detailOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowDetail(false)} />
                    <View style={styles.detailSheet}>
                        {detailItem && (() => {
                            const s = STATUS_CONFIG[detailItem.status] || STATUS_CONFIG.pending;
                            return (
                                <>
                                    <View style={styles.detailHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.detailTitle}>{detailItem.customer_name}</Text>
                                            <Text style={styles.detailSub}>
                                                {detailItem.vehicle ? `${detailItem.vehicle.brand} ${detailItem.vehicle.model}` : `Véhicule #${detailItem.vehicle_id}`}
                                            </Text>
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
                                            { icon: 'call-outline',          label: 'Téléphone',    value: detailItem.customer_phone || '—' },
                                            { icon: 'mail-outline',          label: 'Email',        value: detailItem.customer_email || '—' },
                                            { icon: 'car-outline',           label: 'Véhicule',     value: detailItem.vehicle ? `${detailItem.vehicle.brand} ${detailItem.vehicle.model}` : '—' },
                                            { icon: 'barcode-outline',       label: 'Immat.',       value: detailItem.vehicle?.registration_number || '—' },
                                            { icon: 'calendar-outline',      label: 'Début',        value: formatDate(detailItem.start_date) },
                                            { icon: 'calendar-outline',      label: 'Fin',          value: formatDate(detailItem.end_date) },
                                            { icon: 'cash-outline',          label: 'Tarif/jour',   value: detailItem.daily_rate ? `${Number(detailItem.daily_rate).toFixed(0)} MAD` : '—' },
                                            { icon: 'shield-outline',        label: 'Caution',      value: detailItem.deposit_amount ? `${Number(detailItem.deposit_amount).toFixed(0)} MAD` : '—' },
                                            { icon: 'speedometer-outline',   label: 'Km départ',    value: detailItem.start_mileage ? `${Number(detailItem.start_mileage).toLocaleString('fr-FR')} km` : '—' },
                                            { icon: 'document-text-outline', label: 'Notes',        value: detailItem.notes || '—' },
                                        ].map(row => (
                                            <View key={row.label + row.icon} style={styles.detailRow}>
                                                <View style={styles.detailRowIcon}>
                                                    <Ionicons name={row.icon} size={16} color="#64748b" />
                                                </View>
                                                <Text style={styles.detailRowLabel}>{row.label}</Text>
                                                <Text style={[styles.detailRowValue, { flex: 1, textAlign: 'right' }]}>{row.value}</Text>
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

            {/* ── Modal Créer ── */}
            <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
              {showVehiclePicker ? (
                <SafeAreaView style={styles.modalSafe}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowVehiclePicker(false)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="arrow-back" size={20} color={PRIMARY} />
                            <Text style={{ color: PRIMARY, fontWeight: '600', fontSize: 15 }}>Retour</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Choisir un véhicule</Text>
                        <View style={{ width: 60 }} />
                    </View>
                    <FlatList
                        data={vehicles.filter(v => v.status === 'available')}
                        keyExtractor={v => String(v.id)}
                        contentContainerStyle={{ padding: 16 }}
                        renderItem={({ item: v }) => (
                            <TouchableOpacity
                                style={[styles.vehiclePickerRow, String(form.vehicle_id) === String(v.id) && styles.vehiclePickerRowActive]}
                                onPress={() => { setForm(p => ({...p, vehicle_id: String(v.id), daily_rate: v.daily_rate ? String(v.daily_rate) : p.daily_rate})); setShowVehiclePicker(false); }}
                            >
                                <View style={styles.vehiclePickerIcon}>
                                    <Ionicons name="car-sport-outline" size={20} color={PRIMARY} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.vehiclePickerName}>{v.brand} {v.model} ({v.year})</Text>
                                    <Text style={styles.vehiclePickerPlate}>{v.registration_number}</Text>
                                </View>
                                {v.daily_rate ? <Text style={{ fontSize: 12, color: '#16a34a', fontWeight: '700', marginRight: 8 }}>{Number(v.daily_rate).toFixed(0)} MAD/j</Text> : null}
                                {String(form.vehicle_id) === String(v.id) ? <Ionicons name="checkmark-circle" size={20} color={PRIMARY} /> : null}
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <Ionicons name="car-outline" size={48} color="#cbd5e1" />
                                <Text style={styles.emptyText}>Aucun véhicule disponible</Text>
                            </View>
                        }
                    />
                </SafeAreaView>
              ) : (
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

                            <View style={styles.fieldWrap}>
                                <Text style={styles.label}>Véhicule *</Text>
                                <TouchableOpacity style={[styles.input, styles.pickerBtn]} onPress={() => setShowVehiclePicker(true)}>
                                    <Text style={selectedVehicle ? styles.pickerValue : styles.pickerPlaceholder}>
                                        {selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model} — ${selectedVehicle.registration_number}` : 'Sélectionner un véhicule disponible...'}
                                    </Text>
                                    <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.fieldWrap}>
                                <Text style={styles.label}>Nom du client *</Text>
                                <TextInput style={styles.input} value={form.customer_name} onChangeText={v => setForm(p => ({...p, customer_name: v}))} placeholder="Mohamed Alami" placeholderTextColor="#94a3b8" />
                            </View>

                            <View style={styles.row2}>
                                <View style={[styles.fieldWrap, { flex: 1 }]}>
                                    <Text style={styles.label}>Téléphone</Text>
                                    <TextInput style={styles.input} value={form.customer_phone} onChangeText={v => setForm(p => ({...p, customer_phone: v}))} keyboardType="phone-pad" placeholder="06..." placeholderTextColor="#94a3b8" />
                                </View>
                                <View style={[styles.fieldWrap, { flex: 1 }]}>
                                    <Text style={styles.label}>Email</Text>
                                    <TextInput style={styles.input} value={form.customer_email} onChangeText={v => setForm(p => ({...p, customer_email: v}))} keyboardType="email-address" autoCapitalize="none" placeholder="email@..." placeholderTextColor="#94a3b8" />
                                </View>
                            </View>

                            <View style={styles.row2}>
                                <View style={[styles.fieldWrap, { flex: 1 }]}>
                                    <Text style={styles.label}>Début *</Text>
                                    <TouchableOpacity style={[styles.input, { flexDirection: 'row', alignItems: 'center', gap: 8 }]} onPress={() => openDatePicker('start_date')}>
                                        <Ionicons name="calendar-outline" size={16} color={form.start_date ? PRIMARY : '#94a3b8'} />
                                        <Text style={{ color: form.start_date ? '#0f172a' : '#94a3b8', fontSize: 14, fontWeight: form.start_date ? '600' : '400' }}>
                                            {form.start_date ? formatDate(form.start_date) : 'Choisir'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={[styles.fieldWrap, { flex: 1 }]}>
                                    <Text style={styles.label}>Fin *</Text>
                                    <TouchableOpacity style={[styles.input, { flexDirection: 'row', alignItems: 'center', gap: 8 }]} onPress={() => openDatePicker('end_date')}>
                                        <Ionicons name="calendar-outline" size={16} color={form.end_date ? PRIMARY : '#94a3b8'} />
                                        <Text style={{ color: form.end_date ? '#0f172a' : '#94a3b8', fontSize: 14, fontWeight: form.end_date ? '600' : '400' }}>
                                            {form.end_date ? formatDate(form.end_date) : 'Choisir'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {showDatePicker && Platform.OS === 'android' && (
                                <DateTimePicker
                                    value={tempDate}
                                    mode="date"
                                    display="default"
                                    onChange={(event, date) => {
                                        setShowDatePicker(false);
                                        if (event.type === 'set' && date && dateField) {
                                            setForm(p => ({...p, [dateField]: date.toISOString().split('T')[0]}));
                                        }
                                    }}
                                />
                            )}

                            <View style={styles.row2}>
                                <View style={[styles.fieldWrap, { flex: 1 }]}>
                                    <Text style={styles.label}>Tarif/jour (MAD)</Text>
                                    <TextInput style={styles.input} value={form.daily_rate} onChangeText={v => setForm(p => ({...p, daily_rate: v}))} keyboardType="numeric" placeholder="300" placeholderTextColor="#94a3b8" />
                                </View>
                                <View style={[styles.fieldWrap, { flex: 1 }]}>
                                    <Text style={styles.label}>Caution (MAD)</Text>
                                    <TextInput style={styles.input} value={form.deposit_amount} onChangeText={v => setForm(p => ({...p, deposit_amount: v}))} keyboardType="numeric" placeholder="2000" placeholderTextColor="#94a3b8" />
                                </View>
                            </View>

                            <View style={styles.fieldWrap}>
                                <Text style={styles.label}>Kilométrage départ</Text>
                                <TextInput style={styles.input} value={form.start_mileage} onChangeText={v => setForm(p => ({...p, start_mileage: v}))} keyboardType="numeric" placeholder="45000" placeholderTextColor="#94a3b8" />
                            </View>

                            <View style={styles.fieldWrap}>
                                <Text style={styles.label}>Notes</Text>
                                <TextInput
                                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                    value={form.notes}
                                    onChangeText={v => setForm(p => ({...p, notes: v}))}
                                    placeholder="Remarques..."
                                    placeholderTextColor="#94a3b8"
                                    multiline
                                />
                            </View>
                            <View style={{ height: 20 }} />
                        </ScrollView>

                        {showDatePicker && Platform.OS === 'ios' && (
                            <View style={styles.iosPickerSheet}>
                                <View style={styles.iosPickerHeader}>
                                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                        <Text style={styles.iosPickerCancel}>Annuler</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.iosPickerTitle}>{dateField === 'start_date' ? 'Date de début' : 'Date de fin'}</Text>
                                    <TouchableOpacity onPress={() => {
                                        if (dateField) setForm(p => ({...p, [dateField]: tempDate.toISOString().split('T')[0]}));
                                        setShowDatePicker(false);
                                    }}>
                                        <Text style={styles.iosPickerDone}>OK</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker value={tempDate} mode="date" display="inline" onChange={(_, date) => { if (date) setTempDate(date); }} accentColor={PRIMARY} themeVariant="light" />
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
                                    : <><Ionicons name="checkmark" size={20} color="#fff" /><Text style={styles.saveBtnText}>Créer la location</Text></>
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

    topRow:    { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 16, marginBottom: 10, gap: 10 },
    searchBox: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 11,
        backgroundColor: '#fff', borderRadius: 12,
        borderWidth: 1, borderColor: '#e2e8f0',
    },
    searchInput:  { flex: 1, fontSize: 14, color: '#0f172a' },
    archiveToggle: {
        width: 46, height: 46, borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative',
    },
    archiveToggleActive: { backgroundColor: '#64748b' },
    archiveBadge: {
        position: 'absolute', top: -4, right: -4,
        backgroundColor: '#dc2626', borderRadius: 8,
        minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 3,
    },
    archiveBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

    swipeHint: { fontSize: 11, color: '#94a3b8', marginHorizontal: 16, marginBottom: 8 },

    list: { paddingHorizontal: 16, paddingBottom: 100 },

    swipeBg: {
        backgroundColor: '#16a34a', flexDirection: 'row', alignItems: 'center',
        justifyContent: 'flex-start', paddingLeft: 20, gap: 8, borderRadius: 14,
    },
    swipeBgText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    card: {
        backgroundColor: '#fff', padding: 14,
        borderWidth: 1, borderColor: '#f1f5f9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    cardTop:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
    iconBox:     { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    cardName:    { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    cardVehicle: { fontSize: 12, color: '#64748b', marginTop: 2 },
    cardPlate:   { fontSize: 11, color: '#94a3b8', marginTop: 1 },
    totalText:   { fontSize: 13, fontWeight: '700', color: '#16a34a' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText:  { fontSize: 11, fontWeight: '700' },

    cardMeta:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 4 },
    metaItem:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText:    { fontSize: 12, color: '#64748b' },

    cardActions: {
        flexDirection: 'row', gap: 6, marginTop: 10,
        paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9',
    },
    actionBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 4, paddingVertical: 7, borderRadius: 8, backgroundColor: '#f8fafc',
    },
    actionBtnText: { fontSize: 12, fontWeight: '700' },

    empty:     { alignItems: 'center', paddingVertical: 60 },
    emptyText: { color: '#94a3b8', marginTop: 10, fontSize: 15 },

    fab: {
        position: 'absolute', bottom: 28, right: 20,
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: PRIMARY,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35, shadowRadius: 8, elevation: 8,
    },

    modalSafe:   { flex: 1, backgroundColor: '#f8fafc' },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 16,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    },
    modalTitle:  { fontSize: 18, fontWeight: '800', color: PRIMARY },
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
        paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0f172a',
    },

    pickerBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    pickerPlaceholder: { color: '#94a3b8', fontSize: 15, flex: 1 },
    pickerValue:       { color: '#0f172a', fontSize: 14, flex: 1, fontWeight: '600' },

    vehiclePickerRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    vehiclePickerRowActive: { borderColor: PRIMARY, backgroundColor: '#f5f3ff' },
    vehiclePickerIcon:      { width: 42, height: 42, borderRadius: 10, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    vehiclePickerName:      { fontSize: 14, fontWeight: '700', color: '#0f172a' },
    vehiclePickerPlate:     { fontSize: 12, color: '#64748b', marginTop: 2 },

    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 15,
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    iosPickerSheet:  { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
    iosPickerHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    iosPickerTitle:  { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    iosPickerCancel: { fontSize: 15, color: '#64748b' },
    iosPickerDone:   { fontSize: 15, color: PRIMARY, fontWeight: '700' },

    detailOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
    detailSheet: {
        backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        maxHeight: '80%', paddingBottom: 30,
    },
    detailHeader: {
        flexDirection: 'row', alignItems: 'center',
        padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    detailTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
    detailSub:   { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    detailBody:  { paddingHorizontal: 20, paddingTop: 8 },
    detailRow: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 13,
        borderBottomWidth: 1, borderBottomColor: '#f8fafc',
    },
    detailRowIcon:  { width: 28, alignItems: 'center' },
    detailRowLabel: { flex: 1, fontSize: 13, color: '#64748b', marginLeft: 8 },
    detailRowValue: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
});
