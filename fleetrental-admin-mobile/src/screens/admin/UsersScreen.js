import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    StyleSheet, Alert, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUsers, updateUserRole, updateUserPermissions } from '../../api';

const ROLES = [
    { value: 'company_admin', label: 'Admin', color: '#7c3aed', bg: '#f5f3ff' },
    { value: 'fleet_manager', label: 'Fleet Mgr', color: '#0284c7', bg: '#e0f2fe' },
    { value: 'rental_agent',  label: 'Rental',   color: '#059669', bg: '#ecfdf5' },
    { value: 'mechanic',      label: 'Mécanicien', color: '#d97706', bg: '#fffbeb' },
    { value: 'employee',      label: 'Employé',  color: '#64748b', bg: '#f1f5f9' },
];

const PERMISSIONS = [
    { value: 'view_vehicles',        label: 'Voir véhicules' },
    { value: 'manage_vehicles',      label: 'Gérer véhicules' },
    { value: 'view_rentals',         label: 'Voir locations' },
    { value: 'manage_rentals',       label: 'Gérer locations' },
    { value: 'view_maintenances',    label: 'Voir maintenances' },
    { value: 'manage_maintenances',  label: 'Gérer maintenances' },
    { value: 'view_finances',        label: 'Voir finances' },
    { value: 'manage_finances',      label: 'Gérer finances' },
    { value: 'view_users',           label: 'Voir utilisateurs' },
    { value: 'manage_users',         label: 'Gérer utilisateurs' },
    { value: 'view_reports',         label: 'Voir rapports' },
    { value: 'manage_settings',      label: 'Gérer paramètres' },
];

function roleMeta(role) {
    return ROLES.find(r => r.value === role) || { label: role, color: '#64748b', bg: '#f1f5f9' };
}

export default function UsersScreen() {
    const [users, setUsers]       = useState([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState('');
    const [selected, setSelected] = useState(null); // user being edited
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving]     = useState(false);

    // editable state inside modal
    const [editRole, setEditRole]         = useState('');
    const [editPerms, setEditPerms]       = useState([]);
    const [showRolePicker, setShowRolePicker] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getUsers();
            setUsers(Array.isArray(data) ? data : (data.data || []));
        } catch (e) {
            Alert.alert('Erreur', e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    function openEdit(user) {
        setSelected(user);
        setEditRole(user.role || '');
        const perms = (user.permissions || []).map(p =>
            typeof p === 'string' ? p : p.name
        );
        setEditPerms(perms);
        setShowRolePicker(false);
        setShowModal(true);
    }

    function togglePerm(perm) {
        setEditPerms(prev =>
            prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
        );
    }

    async function handleSave() {
        if (!selected) return;
        setSaving(true);
        try {
            if (editRole !== selected.role) {
                await updateUserRole(selected.id, editRole);
            }
            await updateUserPermissions(selected.id, editPerms);
            Alert.alert('Succès', 'Modifications enregistrées.');
            setShowModal(false);
            load();
        } catch (e) {
            Alert.alert('Erreur', e.message);
        } finally {
            setSaving(false);
        }
    }

    const filtered = users.filter(u =>
        `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    );

    function renderUser({ item }) {
        const r = roleMeta(item.role);
        return (
            <TouchableOpacity style={styles.card} onPress={() => openEdit(item)} activeOpacity={0.8}>
                <View style={styles.cardLeft}>
                    <View style={[styles.avatar, { backgroundColor: r.color }]}>
                        <Text style={styles.avatarLetter}>{(item.name || '?')[0].toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.cardEmail} numberOfLines={1}>{item.email}</Text>
                    </View>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: r.bg }]}>
                    <Text style={[styles.roleText, { color: r.color }]}>{r.label}</Text>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.container}>
            {/* Search */}
            <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher un utilisateur…"
                    placeholderTextColor="#94a3b8"
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#1e3a5f" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderUser}
                    contentContainerStyle={{ padding: 16, gap: 10 }}
                    ListEmptyComponent={
                        <Text style={styles.empty}>Aucun utilisateur trouvé.</Text>
                    }
                />
            )}

            {/* Edit Modal */}
            <Modal visible={showModal} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {selected?.name || 'Utilisateur'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Role */}
                            <Text style={styles.sectionLabel}>Rôle</Text>
                            <TouchableOpacity
                                style={styles.roleSelector}
                                onPress={() => setShowRolePicker(v => !v)}
                            >
                                {(() => {
                                    const r = roleMeta(editRole);
                                    return (
                                        <>
                                            <View style={[styles.roleDot, { backgroundColor: r.color }]} />
                                            <Text style={[styles.roleSelectorText, { color: r.color }]}>
                                                {r.label || 'Sélectionner un rôle'}
                                            </Text>
                                            <Ionicons
                                                name={showRolePicker ? 'chevron-up' : 'chevron-down'}
                                                size={16} color="#94a3b8"
                                            />
                                        </>
                                    );
                                })()}
                            </TouchableOpacity>

                            {showRolePicker && (
                                <View style={styles.rolePicker}>
                                    {ROLES.map(r => (
                                        <TouchableOpacity
                                            key={r.value}
                                            style={[
                                                styles.roleOption,
                                                editRole === r.value && { backgroundColor: r.bg },
                                            ]}
                                            onPress={() => { setEditRole(r.value); setShowRolePicker(false); }}
                                        >
                                            <View style={[styles.roleDot, { backgroundColor: r.color }]} />
                                            <Text style={[styles.roleOptionText, { color: r.color }]}>
                                                {r.label}
                                            </Text>
                                            {editRole === r.value && (
                                                <Ionicons name="checkmark" size={16} color={r.color} style={{ marginLeft: 'auto' }} />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Permissions */}
                            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Permissions</Text>
                            <View style={styles.permsGrid}>
                                {PERMISSIONS.map(p => {
                                    const active = editPerms.includes(p.value);
                                    return (
                                        <TouchableOpacity
                                            key={p.value}
                                            style={[styles.permChip, active && styles.permChipActive]}
                                            onPress={() => togglePerm(p.value)}
                                        >
                                            <Ionicons
                                                name={active ? 'checkbox' : 'square-outline'}
                                                size={16}
                                                color={active ? '#1e3a5f' : '#94a3b8'}
                                                style={{ marginRight: 6 }}
                                            />
                                            <Text style={[styles.permText, active && styles.permTextActive]}>
                                                {p.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>

                        {/* Save */}
                        <TouchableOpacity
                            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving
                                ? <ActivityIndicator color="#fff" size="small" />
                                : <Text style={styles.saveBtnText}>Enregistrer</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },

    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', margin: 16, borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 10,
        borderWidth: 1, borderColor: '#e2e8f0',
    },
    searchInput: { flex: 1, fontSize: 15, color: '#0f172a' },

    card: {
        backgroundColor: '#fff', borderRadius: 14, padding: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderWidth: 1, borderColor: '#e2e8f0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
    avatar: {
        width: 44, height: 44, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center',
    },
    avatarLetter: { color: '#fff', fontSize: 18, fontWeight: '700' },
    cardName:  { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    cardEmail: { fontSize: 12, color: '#64748b', marginTop: 2 },
    roleBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
    roleText:  { fontSize: 11, fontWeight: '700' },

    empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 15 },

    overlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 20, maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', flex: 1 },

    sectionLabel: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 10 },

    roleSelector: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10,
        padding: 12, backgroundColor: '#f8fafc',
    },
    roleDot: { width: 10, height: 10, borderRadius: 5 },
    roleSelectorText: { flex: 1, fontSize: 15, fontWeight: '600' },

    rolePicker: {
        borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10,
        marginTop: 6, overflow: 'hidden',
    },
    roleOption: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    roleOptionText: { fontSize: 14, fontWeight: '600' },

    permsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    permChip: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8,
        paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#f8fafc',
    },
    permChipActive: { borderColor: '#1e3a5f', backgroundColor: '#eff6ff' },
    permText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
    permTextActive: { color: '#1e3a5f', fontWeight: '700' },

    saveBtn: {
        backgroundColor: '#1e3a5f', borderRadius: 12,
        paddingVertical: 14, alignItems: 'center', marginTop: 20,
    },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
