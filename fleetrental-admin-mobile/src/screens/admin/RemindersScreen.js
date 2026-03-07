import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, RefreshControl,
    ActivityIndicator, SafeAreaView, TouchableOpacity,
    Modal, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
    getReminders, createReminder, updateReminder, deleteReminder,
    renewReminder, getVehicles,
} from '../../api';

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    overdue:  { label: 'En retard', color: '#dc2626', bg: '#fef2f2', icon: 'alert-circle' },
    upcoming: { label: 'Bientôt',   color: '#d97706', bg: '#fffbeb', icon: 'time' },
    ok:       { label: 'À jour',    color: '#16a34a', bg: '#f0fdf4', icon: 'checkmark-circle' },
};

const TYPES = [
    { value: 'oil_change',    label: 'Vidange huile' },
    { value: 'tire_change',   label: 'Changement pneus' },
    { value: 'brake_service', label: 'Vérification freins' },
    { value: 'engine_repair', label: 'Révision moteur' },
    { value: 'inspection',    label: 'Contrôle technique' },
    { value: 'cleaning',      label: 'Nettoyage' },
    { value: 'other',         label: 'Autre' },
];

function formatDate(str) {
    if (!str) return null;
    return new Date(str).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Formulaire (Créer / Modifier) ─────────────────────────────────────────────

function ReminderFormModal({ visible, reminder, vehicles, onClose, onSaved }) {
    const editing = !!reminder;

    const [vehicleId,     setVehicleId]     = useState('');
    const [type,          setType]          = useState('oil_change');
    const [description,   setDescription]   = useState('');
    const [nextDueDate,   setNextDueDate]   = useState('');
    const [nextDueMileage,setNextDueMileage]= useState('');
    const [saving,        setSaving]        = useState(false);

    // Pickers internes
    const [showVehiclePicker, setShowVehiclePicker] = useState(false);
    const [showTypePicker,    setShowTypePicker]    = useState(false);

    React.useEffect(() => {
        if (visible) {
            if (reminder) {
                setVehicleId(String(reminder.vehicle_id || ''));
                setType(reminder.type || 'oil_change');
                setDescription(reminder.description || '');
                setNextDueDate(reminder.next_due_date ? reminder.next_due_date.slice(0, 10) : '');
                setNextDueMileage(reminder.next_due_mileage ? String(reminder.next_due_mileage) : '');
            } else {
                setVehicleId('');
                setType('oil_change');
                setDescription('');
                setNextDueDate('');
                setNextDueMileage('');
            }
        }
    }, [visible, reminder]);

    const selectedVehicle = vehicles.find(v => String(v.id) === String(vehicleId));
    const selectedType    = TYPES.find(t => t.value === type) || TYPES[0];

    const handleSave = async () => {
        if (!vehicleId) { Alert.alert('Champ requis', 'Veuillez sélectionner un véhicule.'); return; }
        if (!type)      { Alert.alert('Champ requis', 'Veuillez sélectionner un type.'); return; }
        if (!nextDueDate && !nextDueMileage) {
            Alert.alert('Champ requis', 'Ajoutez au moins une échéance (date ou kilométrage).');
            return;
        }

        const payload = {
            vehicle_id:       Number(vehicleId),
            type,
            description:      description.trim() || null,
            next_due_date:    nextDueDate || null,
            next_due_mileage: nextDueMileage ? Number(nextDueMileage) : null,
        };

        setSaving(true);
        try {
            if (editing) {
                await updateReminder(reminder.id, payload);
            } else {
                await createReminder(payload);
            }
            onSaved();
        } catch (e) {
            Alert.alert('Erreur', e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={fm.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={fm.sheet}>
                    {/* Header */}
                    <View style={fm.header}>
                        <Text style={fm.title}>{editing ? 'Modifier le rappel' : 'Nouveau rappel'}</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                            <Ionicons name="close" size={22} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={fm.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        {/* Véhicule */}
                        <Text style={fm.label}>Véhicule *</Text>
                        <TouchableOpacity style={fm.picker} onPress={() => setShowVehiclePicker(true)}>
                            <Ionicons name="car-outline" size={16} color="#94a3b8" />
                            <Text style={[fm.pickerText, !selectedVehicle && { color: '#94a3b8' }]}>
                                {selectedVehicle
                                    ? `${selectedVehicle.brand} ${selectedVehicle.model} — ${selectedVehicle.immatriculation || ''}`
                                    : 'Sélectionner un véhicule'}
                            </Text>
                            <Ionicons name="chevron-down" size={14} color="#94a3b8" />
                        </TouchableOpacity>

                        {/* Type */}
                        <Text style={fm.label}>Type *</Text>
                        <TouchableOpacity style={fm.picker} onPress={() => setShowTypePicker(true)}>
                            <Ionicons name="build-outline" size={16} color="#94a3b8" />
                            <Text style={fm.pickerText}>{selectedType.label}</Text>
                            <Ionicons name="chevron-down" size={14} color="#94a3b8" />
                        </TouchableOpacity>

                        {/* Description */}
                        <Text style={fm.label}>Description (optionnel)</Text>
                        <TextInput
                            style={[fm.input, fm.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Notes sur ce rappel..."
                            placeholderTextColor="#cbd5e1"
                            multiline
                            numberOfLines={3}
                        />

                        {/* Échéances */}
                        <Text style={fm.sectionTitle}>Échéances</Text>

                        <Text style={fm.label}>Date d'échéance (AAAA-MM-JJ)</Text>
                        <TextInput
                            style={fm.input}
                            value={nextDueDate}
                            onChangeText={setNextDueDate}
                            placeholder="ex: 2025-06-15"
                            placeholderTextColor="#cbd5e1"
                            keyboardType="numbers-and-punctuation"
                        />

                        <Text style={fm.label}>Kilométrage d'échéance</Text>
                        <TextInput
                            style={fm.input}
                            value={nextDueMileage}
                            onChangeText={setNextDueMileage}
                            placeholder="ex: 150000"
                            placeholderTextColor="#cbd5e1"
                            keyboardType="numeric"
                        />

                        <View style={{ height: 20 }} />
                    </ScrollView>

                    {/* Footer */}
                    <View style={fm.footer}>
                        <TouchableOpacity style={fm.cancelBtn} onPress={onClose} disabled={saving}>
                            <Text style={fm.cancelText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[fm.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                            {saving
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Text style={fm.saveText}>{editing ? 'Enregistrer' : 'Créer'}</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Picker véhicule */}
            <Modal visible={showVehiclePicker} transparent animationType="slide" onRequestClose={() => setShowVehiclePicker(false)}>
                <View style={pk.overlay}>
                    <View style={pk.sheet}>
                        <View style={pk.header}>
                            <Text style={pk.title}>Choisir un véhicule</Text>
                            <TouchableOpacity onPress={() => setShowVehiclePicker(false)}>
                                <Ionicons name="close" size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {vehicles.map(v => (
                                <TouchableOpacity
                                    key={v.id}
                                    style={[pk.item, String(v.id) === String(vehicleId) && pk.itemActive]}
                                    onPress={() => { setVehicleId(String(v.id)); setShowVehiclePicker(false); }}
                                >
                                    <Text style={[pk.itemText, String(v.id) === String(vehicleId) && pk.itemTextActive]}>
                                        {v.brand} {v.model}
                                    </Text>
                                    <Text style={pk.itemSub}>{v.immatriculation}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Picker type */}
            <Modal visible={showTypePicker} transparent animationType="slide" onRequestClose={() => setShowTypePicker(false)}>
                <View style={pk.overlay}>
                    <View style={pk.sheet}>
                        <View style={pk.header}>
                            <Text style={pk.title}>Type de rappel</Text>
                            <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                                <Ionicons name="close" size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {TYPES.map(t => (
                                <TouchableOpacity
                                    key={t.value}
                                    style={[pk.item, t.value === type && pk.itemActive]}
                                    onPress={() => { setType(t.value); setShowTypePicker(false); }}
                                >
                                    <Text style={[pk.itemText, t.value === type && pk.itemTextActive]}>{t.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </Modal>
    );
}

// ── Modal Renouvellement ───────────────────────────────────────────────────────

function RenewModal({ visible, reminder, onClose, onRenewed }) {
    const [mileageInterval, setMileageInterval] = useState('');
    const [dateMonths,      setDateMonths]      = useState('');
    const [saving,          setSaving]          = useState(false);

    React.useEffect(() => {
        if (visible) { setMileageInterval(''); setDateMonths(''); }
    }, [visible]);

    const handleRenew = async () => {
        if (!mileageInterval && !dateMonths) {
            Alert.alert('Requis', 'Entrez un intervalle de kilométrage ou un nombre de mois.');
            return;
        }
        const payload = {};
        if (mileageInterval) payload.mileage_interval = Number(mileageInterval);
        if (dateMonths)      payload.date_months      = Number(dateMonths);

        setSaving(true);
        try {
            await renewReminder(reminder.id, payload);
            onRenewed();
        } catch (e) {
            Alert.alert('Erreur', e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView style={rn.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={rn.sheet}>
                    <View style={rn.header}>
                        <Ionicons name="refresh-circle" size={22} color="#16a34a" />
                        <Text style={rn.title}>Renouveler le rappel</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                            <Ionicons name="close" size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                    <Text style={rn.sub}>
                        Définissez la prochaine échéance à partir des valeurs actuelles du véhicule.
                    </Text>

                    <Text style={rn.label}>Intervalle kilométrique (km)</Text>
                    <TextInput
                        style={rn.input}
                        value={mileageInterval}
                        onChangeText={setMileageInterval}
                        placeholder="ex: 10000"
                        placeholderTextColor="#cbd5e1"
                        keyboardType="numeric"
                    />

                    <Text style={rn.label}>Dans combien de mois</Text>
                    <TextInput
                        style={rn.input}
                        value={dateMonths}
                        onChangeText={setDateMonths}
                        placeholder="ex: 6"
                        placeholderTextColor="#cbd5e1"
                        keyboardType="numeric"
                    />

                    <View style={rn.footer}>
                        <TouchableOpacity style={rn.cancelBtn} onPress={onClose} disabled={saving}>
                            <Text style={rn.cancelText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[rn.renewBtn, saving && { opacity: 0.6 }]} onPress={handleRenew} disabled={saving}>
                            {saving
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <><Ionicons name="refresh" size={15} color="#fff" /><Text style={rn.renewText}>Renouveler</Text></>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// ── Écran principal ────────────────────────────────────────────────────────────

export default function RemindersScreen() {
    const [reminders,  setReminders]  = useState([]);
    const [vehicles,   setVehicles]   = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter,     setFilter]     = useState('all');

    const [formVisible,   setFormVisible]   = useState(false);
    const [editReminder,  setEditReminder]  = useState(null);  // null = create
    const [renewVisible,  setRenewVisible]  = useState(false);
    const [renewReminder, setRenewReminderState] = useState(null);

    const loaded = useRef(false);

    const load = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else if (!loaded.current) setLoading(true);
        try {
            const [rem, veh] = await Promise.all([getReminders(), getVehicles()]);
            setReminders(Array.isArray(rem) ? rem : []);
            setVehicles(Array.isArray(veh) ? veh : (veh?.data || []));
            loaded.current = true;
        } catch (_) {}
        finally { setLoading(false); setRefreshing(false); }
    };

    useFocusEffect(useCallback(() => { load(); }, []));

    const filtered = filter === 'all' ? reminders : reminders.filter(r => r.computed_status === filter);

    const counts = {
        all:      reminders.length,
        overdue:  reminders.filter(r => r.computed_status === 'overdue').length,
        upcoming: reminders.filter(r => r.computed_status === 'upcoming').length,
        ok:       reminders.filter(r => r.computed_status === 'ok').length,
    };

    const handleDelete = (r) => {
        Alert.alert(
            'Supprimer le rappel',
            `Supprimer le rappel "${TYPES.find(t => t.value === r.type)?.label || r.type}" ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer', style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteReminder(r.id);
                            load(true);
                        } catch (e) {
                            Alert.alert('Erreur', e.message);
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item: r }) => {
        const s = STATUS_CONFIG[r.computed_status] || STATUS_CONFIG.ok;
        const v = r.vehicle;
        const typeLabel = TYPES.find(t => t.value === r.type)?.label || r.type || 'Rappel';

        return (
            <View style={[styles.card, { borderLeftColor: s.color, borderLeftWidth: 4 }]}>
                {/* Top */}
                <View style={styles.cardTop}>
                    <View style={[styles.typeIcon, { backgroundColor: s.bg }]}>
                        <Ionicons name="notifications-outline" size={20} color={s.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.typeLabel}>{typeLabel}</Text>
                        <Text style={styles.vehicleLabel}>
                            {v ? `${v.brand} ${v.model}` : '—'}{v?.immatriculation ? ` · ${v.immatriculation}` : ''}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                        <Ionicons name={s.icon} size={12} color={s.color} />
                        <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                    </View>
                </View>

                {r.description ? (
                    <Text style={styles.description} numberOfLines={2}>{r.description}</Text>
                ) : null}

                <View style={styles.cardFooter}>
                    {r.next_due_date && (
                        <View style={styles.footerItem}>
                            <Ionicons name="calendar-outline" size={13} color="#94a3b8" />
                            <Text style={styles.footerText}>Échéance : {formatDate(r.next_due_date)}</Text>
                        </View>
                    )}
                    {r.next_due_mileage && (
                        <View style={styles.footerItem}>
                            <Ionicons name="speedometer-outline" size={13} color="#94a3b8" />
                            <Text style={styles.footerText}>
                                {Number(r.next_due_mileage).toLocaleString('fr-FR')} km
                                {v?.current_mileage ? ` (actuel: ${Number(v.current_mileage).toLocaleString('fr-FR')} km)` : ''}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Actions */}
                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => { setRenewReminderState(r); setRenewVisible(true); }}
                    >
                        <Ionicons name="refresh-outline" size={14} color="#16a34a" />
                        <Text style={[styles.actionBtnText, { color: '#16a34a' }]}>Renouveler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => { setEditReminder(r); setFormVisible(true); }}
                    >
                        <Ionicons name="create-outline" size={14} color="#2563eb" />
                        <Text style={[styles.actionBtnText, { color: '#2563eb' }]}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleDelete(r)}
                    >
                        <Ionicons name="trash-outline" size={14} color="#dc2626" />
                        <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>Supprimer</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (loading) return (
        <View style={styles.center}><ActivityIndicator size="large" color="#1e3a5f" /></View>
    );

    return (
        <SafeAreaView style={styles.safe}>
            {/* Filtres */}
            <View style={styles.filterRow}>
                {[
                    { key: 'all',      label: 'Tous',      color: '#1e3a5f' },
                    { key: 'overdue',  label: 'En retard', color: '#dc2626' },
                    { key: 'upcoming', label: 'Bientôt',   color: '#d97706' },
                    { key: 'ok',       label: 'À jour',    color: '#16a34a' },
                ].map(f => (
                    <TouchableOpacity
                        key={f.key}
                        style={[styles.filterChip, filter === f.key && { backgroundColor: f.color }]}
                        onPress={() => setFilter(f.key)}
                    >
                        <Text style={[styles.filterText, filter === f.key && { color: '#fff' }]}>
                            {f.label}{counts[f.key] > 0 ? ` (${counts[f.key]})` : ''}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filtered}
                keyExtractor={item => String(item.id)}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={['#1e3a5f']} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="notifications-off-outline" size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>Aucun rappel{filter !== 'all' ? ' dans cette catégorie' : ''}</Text>
                    </View>
                }
            />

            {/* FAB Créer */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => { setEditReminder(null); setFormVisible(true); }}
                activeOpacity={0.85}
            >
                <Ionicons name="add" size={26} color="#fff" />
            </TouchableOpacity>

            {/* Modals */}
            <ReminderFormModal
                visible={formVisible}
                reminder={editReminder}
                vehicles={vehicles}
                onClose={() => setFormVisible(false)}
                onSaved={() => { setFormVisible(false); load(true); }}
            />
            <RenewModal
                visible={renewVisible}
                reminder={renewReminder}
                onClose={() => setRenewVisible(false)}
                onRenewed={() => { setRenewVisible(false); load(true); }}
            />
        </SafeAreaView>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safe:   { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    filterRow: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 8, flexWrap: 'wrap' },
    filterChip: {
        paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    },
    filterText: { fontSize: 12, fontWeight: '600', color: '#64748b' },

    list: { paddingHorizontal: 16, paddingBottom: 100 },

    card: {
        backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
        borderWidth: 1, borderColor: '#f1f5f9',
    },
    cardTop:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    typeIcon:    { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    typeLabel:   { fontSize: 14, fontWeight: '700', color: '#0f172a' },
    vehicleLabel:{ fontSize: 12, color: '#64748b', marginTop: 2 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText:  { fontSize: 11, fontWeight: '700' },
    description: { fontSize: 12, color: '#94a3b8', marginBottom: 8, lineHeight: 18 },

    cardFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    footerText: { fontSize: 12, color: '#64748b' },

    cardActions: {
        flexDirection: 'row', gap: 6, marginTop: 12,
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
        backgroundColor: '#1e3a5f',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#1e3a5f', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35, shadowRadius: 8, elevation: 8,
    },
});

// Formulaire styles
const fm = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: {
        backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    title: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
    body:  { paddingHorizontal: 20, paddingTop: 16 },

    label: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
    sectionTitle: { fontSize: 14, fontWeight: '800', color: '#1e3a5f', marginTop: 20, marginBottom: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },

    picker: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 13, backgroundColor: '#f8fafc',
    },
    pickerText: { flex: 1, fontSize: 14, color: '#0f172a' },

    input: {
        borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc',
    },
    textArea: { height: 80, textAlignVertical: 'top' },

    footer: {
        flexDirection: 'row', gap: 10, padding: 20,
        borderTopWidth: 1, borderTopColor: '#f1f5f9',
    },
    cancelBtn: {
        flex: 1, paddingVertical: 14, borderRadius: 12,
        borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center',
    },
    cancelText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
    saveBtn: {
        flex: 2, paddingVertical: 14, borderRadius: 12,
        backgroundColor: '#1e3a5f', alignItems: 'center',
    },
    saveText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

// Picker styles
const pk = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    sheet: {
        backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
        maxHeight: '60%', paddingBottom: 30,
    },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    title:        { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    item:         { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
    itemActive:   { backgroundColor: '#eff6ff' },
    itemText:     { fontSize: 14, color: '#334155', fontWeight: '600' },
    itemTextActive:{ color: '#2563eb', fontWeight: '700' },
    itemSub:      { fontSize: 12, color: '#94a3b8', marginTop: 2 },
});

// Renew modal styles
const rn = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: {
        backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    title:  { flex: 1, fontSize: 17, fontWeight: '800', color: '#0f172a' },
    sub:    { fontSize: 13, color: '#94a3b8', lineHeight: 20, marginBottom: 20 },

    label: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc',
    },
    footer: { flexDirection: 'row', gap: 10, marginTop: 24 },
    cancelBtn: {
        flex: 1, paddingVertical: 14, borderRadius: 12,
        borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center',
    },
    cancelText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
    renewBtn: {
        flex: 2, paddingVertical: 14, borderRadius: 12,
        backgroundColor: '#16a34a', alignItems: 'center',
        flexDirection: 'row', justifyContent: 'center', gap: 8,
    },
    renewText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
