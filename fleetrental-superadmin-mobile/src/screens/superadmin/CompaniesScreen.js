import React, { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, RefreshControl, ActivityIndicator, SafeAreaView,
    Alert, Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCompanies, createCompany, updateCompany, deleteCompany } from '../../api';

const PRIMARY = '#4c1d95';
const ACCENT  = '#7c3aed';

const EMPTY_FORM = { name: '', email: '', phone: '', address: '' };

export default function CompaniesScreen() {
    const [companies,  setCompanies]  = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search,     setSearch]     = useState('');

    const [showModal,  setShowModal]  = useState(false);
    const [editingId,  setEditingId]  = useState(null);
    const [form,       setForm]       = useState(EMPTY_FORM);
    const [saving,     setSaving]     = useState(false);
    const [formError,  setFormError]  = useState('');

    const [detailItem, setDetailItem] = useState(null);
    const [showDetail, setShowDetail] = useState(false);

    const loaded = useRef(false);

    const loadData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else if (!loaded.current) setLoading(true);
        try {
            const data = await getCompanies();
            setCompanies(Array.isArray(data) ? data : []);
            loaded.current = true;
        } catch (e) {
            Alert.alert('Erreur', e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setFormError('');
        setShowModal(true);
    };

    const openEdit = (c) => {
        setEditingId(c.id);
        setForm({ name: c.name || '', email: c.email || '', phone: c.phone || '', address: c.address || '' });
        setFormError('');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { setFormError('Le nom est obligatoire.'); return; }
        setSaving(true);
        setFormError('');
        try {
            const payload = {
                name:    form.name.trim(),
                email:   form.email.trim() || null,
                phone:   form.phone.trim() || null,
                address: form.address.trim() || null,
            };
            if (editingId) {
                await updateCompany(editingId, payload);
            } else {
                await createCompany(payload);
            }
            setShowModal(false);
            loadData(true);
        } catch (e) {
            setFormError(e.message || 'Erreur lors de la sauvegarde.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (c) => {
        Alert.alert(
            'Supprimer l\'entreprise',
            `Supprimer "${c.name}" ? Cette action est irréversible.`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer', style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCompany(c.id);
                            loadData(true);
                        } catch (e) {
                            Alert.alert('Erreur', e.message);
                        }
                    },
                },
            ]
        );
    };

    const filtered = companies.filter(c =>
        !search || c.name.toLowerCase().includes(search.toLowerCase())
    );

    const renderItem = ({ item: c }) => (
        <View style={styles.card}>
            <View style={styles.cardTop}>
                <View style={styles.companyIcon}>
                    <Ionicons name="business-outline" size={22} color={ACCENT} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{c.name}</Text>
                    {c.email ? <Text style={styles.cardSub}>{c.email}</Text> : null}
                    {c.phone ? <Text style={styles.cardSub}>{c.phone}</Text> : null}
                </View>
                <View style={styles.countBadges}>
                    <View style={styles.badge}>
                        <Ionicons name="car-outline" size={11} color="#64748b" />
                        <Text style={styles.badgeText}>{c.vehicles_count ?? 0}</Text>
                    </View>
                    <View style={styles.badge}>
                        <Ionicons name="people-outline" size={11} color="#64748b" />
                        <Text style={styles.badgeText}>{c.users_count ?? 0}</Text>
                    </View>
                </View>
            </View>
            {c.address ? (
                <View style={styles.addressRow}>
                    <Ionicons name="location-outline" size={13} color="#94a3b8" />
                    <Text style={styles.addressText} numberOfLines={1}>{c.address}</Text>
                </View>
            ) : null}
            <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => { setDetailItem(c); setShowDetail(true); }}>
                    <Ionicons name="eye-outline" size={14} color={PRIMARY} />
                    <Text style={[styles.actionBtnText, { color: PRIMARY }]}>Détails</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(c)}>
                    <Ionicons name="create-outline" size={14} color="#d97706" />
                    <Text style={[styles.actionBtnText, { color: '#d97706' }]}>Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(c)}>
                    <Ionicons name="trash-outline" size={14} color="#dc2626" />
                    <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>Supprimer</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

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
                        placeholder="Rechercher une entreprise..."
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

            <View style={styles.summaryBar}>
                <Ionicons name="business-outline" size={16} color={ACCENT} />
                <Text style={styles.summaryText}>{companies.length} entreprise{companies.length !== 1 ? 's' : ''} enregistrée{companies.length !== 1 ? 's' : ''}</Text>
            </View>

            <FlatList
                data={filtered}
                keyExtractor={item => String(item.id)}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={[ACCENT]} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="business-outline" size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>Aucune entreprise trouvée</Text>
                        <TouchableOpacity style={styles.emptyBtn} onPress={openCreate}>
                            <Text style={styles.emptyBtnText}>Créer une entreprise</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* ── Modal Détails ── */}
            <Modal visible={showDetail} animationType="slide" transparent onRequestClose={() => setShowDetail(false)}>
                <View style={styles.detailOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowDetail(false)} />
                    <View style={styles.detailSheet}>
                        {detailItem && (
                            <>
                                <View style={styles.detailHeader}>
                                    <View style={[styles.companyIcon, { backgroundColor: '#f5f3ff' }]}>
                                        <Ionicons name="business-outline" size={22} color={ACCENT} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.detailTitle}>{detailItem.name}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setShowDetail(false)} style={{ marginLeft: 10 }}>
                                        <Ionicons name="close" size={22} color="#94a3b8" />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
                                    {[
                                        { icon: 'mail-outline',     label: 'Email',        value: detailItem.email   || '—' },
                                        { icon: 'call-outline',     label: 'Téléphone',    value: detailItem.phone   || '—' },
                                        { icon: 'location-outline', label: 'Adresse',      value: detailItem.address || '—' },
                                        { icon: 'car-outline',      label: 'Véhicules',    value: String(detailItem.vehicles_count ?? 0) },
                                        { icon: 'people-outline',   label: 'Utilisateurs', value: String(detailItem.users_count ?? 0) },
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
                        )}
                    </View>
                </View>
            </Modal>

            {/* ── Modal Créer / Modifier ── */}
            <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <SafeAreaView style={styles.modalSafe}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingId ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}</Text>
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
                                <Text style={styles.label}>Nom de l'entreprise *</Text>
                                <TextInput style={styles.input} value={form.name} onChangeText={v => setForm(p => ({...p, name: v}))} placeholder="Auto Location Maroc" placeholderTextColor="#94a3b8" />
                            </View>
                            <View style={styles.fieldWrap}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput style={styles.input} value={form.email} onChangeText={v => setForm(p => ({...p, email: v}))} placeholder="contact@entreprise.ma" keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#94a3b8" />
                            </View>
                            <View style={styles.fieldWrap}>
                                <Text style={styles.label}>Téléphone</Text>
                                <TextInput style={styles.input} value={form.phone} onChangeText={v => setForm(p => ({...p, phone: v}))} placeholder="05XXXXXXXX" keyboardType="phone-pad" placeholderTextColor="#94a3b8" />
                            </View>
                            <View style={styles.fieldWrap}>
                                <Text style={styles.label}>Adresse</Text>
                                <TextInput
                                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                    value={form.address}
                                    onChangeText={v => setForm(p => ({...p, address: v}))}
                                    placeholder="Rue, ville, pays..."
                                    placeholderTextColor="#94a3b8"
                                    multiline
                                />
                            </View>
                            <View style={{ height: 20 }} />
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                {saving
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <><Ionicons name="checkmark" size={20} color="#fff" /><Text style={styles.saveBtnText}>{editingId ? 'Enregistrer les modifications' : 'Créer l\'entreprise'}</Text></>
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
    searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    searchInput: { flex: 1, fontSize: 14, color: '#0f172a' },
    addBtn: {
        width: 46, height: 46, borderRadius: 12, backgroundColor: ACCENT,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: ACCENT, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
    },

    summaryBar: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginHorizontal: 16, marginBottom: 8,
        backgroundColor: '#f5f3ff', borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 8,
    },
    summaryText: { fontSize: 13, fontWeight: '600', color: ACCENT },

    list:  { paddingHorizontal: 16, paddingBottom: 40 },

    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
        borderWidth: 1, borderColor: '#f1f5f9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    cardTop:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
    companyIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center' },
    cardInfo:    { flex: 1 },
    cardTitle:   { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    cardSub:     { fontSize: 12, color: '#64748b', marginTop: 2 },
    countBadges: { gap: 6, alignItems: 'flex-end' },
    badge:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f8fafc', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    badgeText:   { fontSize: 12, fontWeight: '700', color: '#64748b' },

    addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    addressText: { fontSize: 12, color: '#94a3b8', flex: 1 },

    cardActions: {
        flexDirection: 'row', gap: 6, marginTop: 10,
        paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9',
    },
    actionBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 4, paddingVertical: 7, borderRadius: 8, backgroundColor: '#f8fafc',
    },
    actionBtnText: { fontSize: 12, fontWeight: '700' },

    empty:        { alignItems: 'center', paddingVertical: 60 },
    emptyText:    { color: '#94a3b8', marginTop: 10, fontSize: 15 },
    emptyBtn:     { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: ACCENT, borderRadius: 10 },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    modalSafe:   { flex: 1, backgroundColor: '#f8fafc' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    modalTitle:  { fontSize: 18, fontWeight: '800', color: PRIMARY },
    modalBody:   { flex: 1, padding: 20 },
    modalFooter: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },

    formError:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#fecaca' },
    formErrorText: { flex: 1, color: '#dc2626', fontSize: 13 },

    fieldWrap: { marginBottom: 16 },
    label:     { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
    input:     { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0f172a' },

    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 15,
        shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    detailOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
    detailSheet:   { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '65%', paddingBottom: 30 },
    detailHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    detailTitle:   { fontSize: 16, fontWeight: '800', color: '#0f172a' },
    detailBody:    { paddingHorizontal: 20, paddingTop: 8 },
    detailRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
    detailRowIcon: { width: 28, alignItems: 'center' },
    detailRowLabel:{ flex: 1, fontSize: 13, color: '#64748b', marginLeft: 8 },
    detailRowValue:{ fontSize: 13, fontWeight: '700', color: '#0f172a', maxWidth: '55%', textAlign: 'right' },
});
