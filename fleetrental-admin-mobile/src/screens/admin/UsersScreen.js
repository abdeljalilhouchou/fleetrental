import React, { useState, useCallback, useContext, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    StyleSheet, Alert, ActivityIndicator, Modal, ScrollView,
    KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    getUsers, createUser, updateUser, deleteUser,
    resetUserPassword, updateUserPermissions, getUserPermissions,
} from '../../api';
import { AuthContext } from '../../context/AuthContext';

const ROLES = [
    { value: 'company_admin', label: 'Company Admin',         color: '#7c3aed', bg: '#f5f3ff' },
    { value: 'fleet_manager', label: 'Gestionnaire de flotte', color: '#0284c7', bg: '#e0f2fe' },
    { value: 'rental_agent',  label: 'Agent de location',     color: '#059669', bg: '#ecfdf5' },
    { value: 'mechanic',      label: 'Mécanicien',            color: '#d97706', bg: '#fffbeb' },
    { value: 'employee',      label: 'Employé',               color: '#64748b', bg: '#f1f5f9' },
];

const MODULE_LABELS = {
    vehicles:     'Véhicules',
    rentals:      'Locations',
    maintenances: 'Maintenances',
    users:        'Utilisateurs',
    finances:     'Finances',
    reminders:    'Rappels',
};

function roleMeta(role) {
    return ROLES.find(r => r.value === role) || { label: role, color: '#64748b', bg: '#f1f5f9' };
}

const EMPTY_CREATE = { name: '', email: '', password: '', role: 'employee' };

export default function UsersScreen() {
    const { user: me } = useContext(AuthContext);

    const [users,   setUsers]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [search,  setSearch]  = useState('');

    // ── Modal édition ──
    const [selected,       setSelected]       = useState(null);
    const [showEditModal,  setShowEditModal]  = useState(false);
    const [editName,       setEditName]       = useState('');
    const [editEmail,      setEditEmail]      = useState('');
    const [editRole,       setEditRole]       = useState('');
    const [newPassword,    setNewPassword]    = useState('');
    const [showNewPass,    setShowNewPass]    = useState(false);
    const [showRolePicker, setShowRolePicker] = useState(false);
    const [saving,         setSaving]         = useState(false);

    // ── Modal création ──
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm,      setCreateForm]      = useState(EMPTY_CREATE);
    const [showCreatePass,  setShowCreatePass]  = useState(false);
    const [showCreateRole,  setShowCreateRole]  = useState(false);
    const [creating,        setCreating]        = useState(false);
    const [createError,     setCreateError]     = useState('');

    // ── Modal permissions ──
    const [showPermModal, setShowPermModal] = useState(false);
    const [permUser,      setPermUser]      = useState(null);
    const [permGroups,    setPermGroups]    = useState({}); // { module: [{name, display_name, description, state, _baseState?}] }
    const [permLoading,   setPermLoading]   = useState(false);
    const [permSaving,    setPermSaving]    = useState(false);
    const [permError,     setPermError]     = useState('');

    const loaded = useRef(false);

    const load = useCallback(async () => {
        if (!loaded.current) setLoading(true);
        try {
            const data = await getUsers();
            setUsers(Array.isArray(data) ? data : (data.data || []));
            loaded.current = true;
        } catch (e) {
            Alert.alert('Erreur', e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { load(); }, []));

    // ── Édition ────────────────────────────────────────────────────────────────

    function openEdit(user) {
        setSelected(user);
        setEditName(user.name || '');
        setEditEmail(user.email || '');
        setEditRole(user.role || '');
        setNewPassword('');
        setShowNewPass(false);
        setShowRolePicker(false);
        setShowEditModal(true);
    }

    async function handleSave() {
        if (!editName.trim())  { Alert.alert('Erreur', 'Le nom est obligatoire.'); return; }
        if (!editEmail.trim()) { Alert.alert('Erreur', "L'email est obligatoire."); return; }
        setSaving(true);
        try {
            await updateUser(selected.id, { name: editName.trim(), email: editEmail.trim(), role: editRole });
            if (newPassword.trim()) {
                await resetUserPassword(selected.id, newPassword.trim());
            }
            setShowEditModal(false);
            load();
            Alert.alert('Succès', 'Modifications enregistrées.');
        } catch (e) {
            Alert.alert('Erreur', e.message);
        } finally {
            setSaving(false);
        }
    }

    function handleDelete() {
        Alert.alert(
            "Supprimer l'utilisateur",
            `Confirmer la suppression de "${selected?.name}" ?\nCette action est irréversible.`,
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Oui, supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        setSaving(true);
                        try {
                            await deleteUser(selected.id);
                            setShowEditModal(false);
                            load();
                        } catch (e) {
                            Alert.alert('Erreur', e.message);
                        } finally {
                            setSaving(false);
                        }
                    },
                },
            ]
        );
    }

    // ── Création ───────────────────────────────────────────────────────────────

    async function handleCreate() {
        if (!createForm.name.trim())     { setCreateError('Le nom est obligatoire.'); return; }
        if (!createForm.email.trim())    { setCreateError("L'email est obligatoire."); return; }
        if (!createForm.password.trim()) { setCreateError('Le mot de passe est obligatoire (min. 6 caractères).'); return; }
        setCreating(true);
        setCreateError('');
        try {
            await createUser({
                name:     createForm.name.trim(),
                email:    createForm.email.trim(),
                password: createForm.password.trim(),
                role:     createForm.role,
            });
            setShowCreateModal(false);
            setCreateForm(EMPTY_CREATE);
            load();
        } catch (e) {
            setCreateError(e.message);
        } finally {
            setCreating(false);
        }
    }

    // ── Permissions ─────────────────────────────────────────────────────────────

    function canManagePerms(u) {
        if (!me || u.id === me.id) return false;
        if (me.role === 'company_admin') return u.role !== 'super_admin' && u.role !== 'company_admin';
        return false;
    }

    async function handleOpenPerms(u) {
        setPermUser(u);
        setPermGroups({});
        setPermError('');
        setPermLoading(true);
        setShowPermModal(true);
        try {
            const data = await getUserPermissions(u.id);
            setPermGroups(data);
        } catch (e) {
            setPermError(e.message);
        } finally {
            setPermLoading(false);
        }
    }

    function togglePermState(module, permName) {
        setPermGroups(prev => ({
            ...prev,
            [module]: prev[module].map(p => {
                if (p.name !== permName) return p;
                // Cycle identique au web : inherited_denied→granted, inherited_granted→revoked, granted→revoked, revoked→inherited
                let next;
                if (p.state === 'granted')           next = 'revoked';
                else if (p.state === 'revoked')      next = p._baseState || 'inherited_denied';
                else                                  next = p.state === 'inherited_granted' ? 'revoked' : 'granted';
                return { ...p, state: next, _baseState: p._baseState || p.state };
            }),
        }));
    }

    function resetPermState(module, permName) {
        setPermGroups(prev => ({
            ...prev,
            [module]: prev[module].map(p => {
                if (p.name !== permName) return p;
                const base = p._baseState || p.state;
                return { ...p, state: base, _baseState: undefined };
            }),
        }));
    }

    async function handleSavePerms() {
        setPermSaving(true);
        setPermError('');
        const overrides = Object.values(permGroups).flat().map(p => {
            let state;
            if (p.state === 'granted')      state = 'granted';
            else if (p.state === 'revoked') state = 'revoked';
            else                             state = 'inherited';
            return { name: p.name, state };
        });
        try {
            await updateUserPermissions(permUser.id, overrides);
            setShowPermModal(false);
            Alert.alert('Succès', 'Permissions mises à jour.');
        } catch (e) {
            setPermError(e.message);
        } finally {
            setPermSaving(false);
        }
    }

    // ── Render ──────────────────────────────────────────────────────────────────

    const filtered = users.filter(u =>
        `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    );

    function renderUser({ item }) {
        const r      = roleMeta(item.role);
        const isSelf = item.id === me?.id;
        return (
            <View style={styles.card}>
                <TouchableOpacity
                    style={styles.cardLeft}
                    onPress={isSelf ? undefined : () => openEdit(item)}
                    activeOpacity={isSelf ? 1 : 0.7}
                >
                    <View style={[styles.avatar, { backgroundColor: r.color }]}>
                        <Text style={styles.avatarLetter}>{(item.name || '?')[0].toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                            {isSelf && (
                                <View style={styles.selfBadge}>
                                    <Text style={styles.selfBadgeText}>Vous</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.cardEmail} numberOfLines={1}>{item.email}</Text>
                    </View>
                </TouchableOpacity>

                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <View style={[styles.roleBadge, { backgroundColor: r.bg }]}>
                        <Text style={[styles.roleText, { color: r.color }]}>{r.label}</Text>
                    </View>
                    {!isSelf && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            {canManagePerms(item) && (
                                <TouchableOpacity onPress={() => handleOpenPerms(item)}>
                                    <Ionicons name="shield-checkmark-outline" size={18} color="#7c3aed" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={() => openEdit(item)}>
                                <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            {/* Top bar */}
            <View style={styles.topRow}>
                <View style={[styles.searchBox, { flex: 1 }]}>
                    <Ionicons name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Rechercher un utilisateur…"
                        placeholderTextColor="#94a3b8"
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search ? (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={16} color="#94a3b8" />
                        </TouchableOpacity>
                    ) : null}
                </View>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => { setCreateForm(EMPTY_CREATE); setCreateError(''); setShowCreateModal(true); }}
                >
                    <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1e3a5f" />
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderUser}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>Aucun utilisateur trouvé.</Text>}
                />
            )}

            {/* ── Modal Édition ── */}
            <Modal visible={showEditModal} animationType="slide" transparent onRequestClose={() => setShowEditModal(false)}>
                <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowEditModal(false)} />
                    <View style={styles.sheet}>
                        {/* Header */}
                        <View style={styles.sheetHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.sheetTitle}>{selected?.name}</Text>
                                <Text style={styles.sheetSub}>{selected?.email}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            {/* Informations */}
                            <Text style={styles.sectionLabel}>Informations</Text>
                            <TextInput
                                style={styles.input}
                                value={editName}
                                onChangeText={setEditName}
                                placeholder="Nom complet"
                                placeholderTextColor="#94a3b8"
                            />
                            <TextInput
                                style={[styles.input, { marginTop: 8 }]}
                                value={editEmail}
                                onChangeText={setEditEmail}
                                placeholder="Email"
                                placeholderTextColor="#94a3b8"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            {/* Rôle */}
                            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>Rôle</Text>
                            <TouchableOpacity style={styles.roleSelector} onPress={() => setShowRolePicker(v => !v)}>
                                <View style={[styles.roleDot, { backgroundColor: roleMeta(editRole).color }]} />
                                <Text style={[styles.roleSelectorText, { color: roleMeta(editRole).color }]}>
                                    {roleMeta(editRole).label || 'Sélectionner…'}
                                </Text>
                                <Ionicons name={showRolePicker ? 'chevron-up' : 'chevron-down'} size={16} color="#94a3b8" />
                            </TouchableOpacity>
                            {showRolePicker && (
                                <View style={styles.rolePicker}>
                                    {ROLES.map(r => (
                                        <TouchableOpacity
                                            key={r.value}
                                            style={[styles.roleOption, editRole === r.value && { backgroundColor: r.bg }]}
                                            onPress={() => { setEditRole(r.value); setShowRolePicker(false); }}
                                        >
                                            <View style={[styles.roleDot, { backgroundColor: r.color }]} />
                                            <Text style={[styles.roleOptionText, { color: r.color }]}>{r.label}</Text>
                                            {editRole === r.value && <Ionicons name="checkmark" size={16} color={r.color} style={{ marginLeft: 'auto' }} />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Nouveau mot de passe */}
                            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>Nouveau mot de passe</Text>
                            <View style={styles.passRow}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="Laisser vide pour ne pas changer"
                                    placeholderTextColor="#94a3b8"
                                    secureTextEntry={!showNewPass}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNewPass(v => !v)}>
                                    <Ionicons name={showNewPass ? 'eye-off' : 'eye'} size={20} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>

                            {/* Supprimer */}
                            <TouchableOpacity
                                style={[styles.deleteBtn, saving && { opacity: 0.5 }]}
                                onPress={handleDelete}
                                disabled={saving}
                            >
                                <Ionicons name="trash-outline" size={18} color="#dc2626" />
                                <Text style={styles.deleteBtnText}>Supprimer cet utilisateur</Text>
                            </TouchableOpacity>

                            <View style={{ height: 16 }} />
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving
                                ? <ActivityIndicator color="#fff" size="small" />
                                : <><Ionicons name="checkmark" size={18} color="#fff" /><Text style={styles.saveBtnText}>Enregistrer</Text></>
                            }
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* ── Modal Création ── */}
            <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <SafeAreaView style={styles.createSafe}>
                        <View style={styles.createHeader}>
                            <Text style={styles.createTitle}>Nouvel utilisateur</Text>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ padding: 20 }} keyboardShouldPersistTaps="handled">
                            {createError ? (
                                <View style={styles.errorBox}>
                                    <Ionicons name="alert-circle" size={15} color="#dc2626" />
                                    <Text style={styles.errorText}>{createError}</Text>
                                </View>
                            ) : null}

                            <Text style={styles.label}>Nom complet *</Text>
                            <TextInput
                                style={styles.input}
                                value={createForm.name}
                                onChangeText={v => setCreateForm(f => ({ ...f, name: v }))}
                                placeholder="Mohamed Alami"
                                placeholderTextColor="#94a3b8"
                            />

                            <Text style={[styles.label, { marginTop: 14 }]}>Email *</Text>
                            <TextInput
                                style={styles.input}
                                value={createForm.email}
                                onChangeText={v => setCreateForm(f => ({ ...f, email: v }))}
                                placeholder="email@exemple.com"
                                placeholderTextColor="#94a3b8"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <Text style={[styles.label, { marginTop: 14 }]}>Mot de passe *</Text>
                            <View style={styles.passRow}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    value={createForm.password}
                                    onChangeText={v => setCreateForm(f => ({ ...f, password: v }))}
                                    placeholder="Min. 6 caractères"
                                    placeholderTextColor="#94a3b8"
                                    secureTextEntry={!showCreatePass}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCreatePass(v => !v)}>
                                    <Ionicons name={showCreatePass ? 'eye-off' : 'eye'} size={20} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.label, { marginTop: 14 }]}>Rôle *</Text>
                            <TouchableOpacity style={styles.roleSelector} onPress={() => setShowCreateRole(v => !v)}>
                                <View style={[styles.roleDot, { backgroundColor: roleMeta(createForm.role).color }]} />
                                <Text style={[styles.roleSelectorText, { color: roleMeta(createForm.role).color }]}>
                                    {roleMeta(createForm.role).label}
                                </Text>
                                <Ionicons name={showCreateRole ? 'chevron-up' : 'chevron-down'} size={16} color="#94a3b8" />
                            </TouchableOpacity>
                            {showCreateRole && (
                                <View style={styles.rolePicker}>
                                    {ROLES.map(r => (
                                        <TouchableOpacity
                                            key={r.value}
                                            style={[styles.roleOption, createForm.role === r.value && { backgroundColor: r.bg }]}
                                            onPress={() => { setCreateForm(f => ({ ...f, role: r.value })); setShowCreateRole(false); }}
                                        >
                                            <View style={[styles.roleDot, { backgroundColor: r.color }]} />
                                            <Text style={[styles.roleOptionText, { color: r.color }]}>{r.label}</Text>
                                            {createForm.role === r.value && <Ionicons name="checkmark" size={16} color={r.color} style={{ marginLeft: 'auto' }} />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            <View style={{ height: 20 }} />
                        </ScrollView>

                        <View style={styles.createFooter}>
                            <TouchableOpacity
                                style={[styles.saveBtn, creating && { opacity: 0.6 }]}
                                onPress={handleCreate}
                                disabled={creating}
                            >
                                {creating
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <><Ionicons name="person-add-outline" size={18} color="#fff" /><Text style={styles.saveBtnText}>Créer l'utilisateur</Text></>
                                }
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </KeyboardAvoidingView>
            </Modal>

            {/* ── Modal Permissions ── */}
            <Modal visible={showPermModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPermModal(false)}>
                <SafeAreaView style={styles.createSafe}>
                    {/* Header */}
                    <View style={styles.createHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.createTitle}>Permissions</Text>
                            <Text style={styles.permSubtitle}>
                                {permUser?.name} — {roleMeta(permUser?.role).label}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowPermModal(false)}>
                            <Ionicons name="close" size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    {/* Légende */}
                    <View style={styles.legendRow}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendIcon, { backgroundColor: '#dcfce7' }]}>
                                <Ionicons name="checkmark" size={11} color="#16a34a" />
                            </View>
                            <Text style={styles.legendText}>Forcé actif</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendIcon, { backgroundColor: '#fee2e2' }]}>
                                <Ionicons name="close" size={11} color="#dc2626" />
                            </View>
                            <Text style={styles.legendText}>Forcé inactif</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendIcon, { backgroundColor: '#f1f5f9' }]}>
                                <Ionicons name="remove" size={11} color="#94a3b8" />
                            </View>
                            <Text style={styles.legendText}>Hérité du rôle</Text>
                        </View>
                    </View>

                    {/* Contenu */}
                    {permLoading ? (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color="#7c3aed" />
                        </View>
                    ) : (
                        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
                            {permError ? (
                                <View style={styles.errorBox}>
                                    <Ionicons name="alert-circle" size={15} color="#dc2626" />
                                    <Text style={styles.errorText}>{permError}</Text>
                                </View>
                            ) : null}

                            {Object.entries(permGroups).map(([module, perms]) => (
                                <View key={module} style={{ marginBottom: 20 }}>
                                    <Text style={styles.moduleLabel}>
                                        {MODULE_LABELS[module] || module}
                                    </Text>
                                    <View style={styles.moduleCard}>
                                        {perms.map((perm, idx) => {
                                            const isOverride        = perm.state === 'granted' || perm.state === 'revoked';
                                            const isActive          = perm.state === 'granted' || perm.state === 'inherited_granted';
                                            const toggleBg =
                                                perm.state === 'granted'           ? '#dcfce7' :
                                                perm.state === 'revoked'           ? '#fee2e2' :
                                                isActive                           ? '#f0fdf4' :
                                                                                     '#f1f5f9';
                                            const toggleIcon =
                                                perm.state === 'granted'  ? { name: 'checkmark', color: '#16a34a' } :
                                                perm.state === 'revoked'  ? { name: 'close',     color: '#dc2626' } :
                                                isActive                  ? { name: 'checkmark', color: '#86efac' } :
                                                                            { name: 'remove',    color: '#94a3b8' };

                                            return (
                                                <View
                                                    key={perm.name}
                                                    style={[styles.permRow, idx > 0 && styles.permRowBorder]}
                                                >
                                                    <View style={{ flex: 1 }}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                            <Text style={styles.permName}>{perm.display_name}</Text>
                                                            {isOverride && (
                                                                <View style={styles.overrideBadge}>
                                                                    <Text style={styles.overrideText}>override</Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                        {perm.description ? (
                                                            <Text style={styles.permDesc} numberOfLines={2}>{perm.description}</Text>
                                                        ) : null}
                                                    </View>

                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 10 }}>
                                                        {isOverride && (
                                                            <TouchableOpacity onPress={() => resetPermState(module, perm.name)}>
                                                                <Text style={styles.resetBtn}>reset</Text>
                                                            </TouchableOpacity>
                                                        )}
                                                        <TouchableOpacity
                                                            style={[styles.toggleBtn, { backgroundColor: toggleBg }]}
                                                            onPress={() => togglePermState(module, perm.name)}
                                                        >
                                                            <Ionicons name={toggleIcon.name} size={14} color={toggleIcon.color} />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    )}

                    {/* Footer */}
                    <View style={styles.createFooter}>
                        <TouchableOpacity
                            style={[styles.permSaveBtn, (permSaving || permLoading) && { opacity: 0.6 }]}
                            onPress={handleSavePerms}
                            disabled={permSaving || permLoading}
                        >
                            {permSaving
                                ? <ActivityIndicator color="#fff" size="small" />
                                : <><Ionicons name="shield-checkmark-outline" size={18} color="#fff" /><Text style={styles.saveBtnText}>Enregistrer les permissions</Text></>
                            }
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe:   { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    topRow: { flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 10, gap: 10 },
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

    list:  { paddingHorizontal: 16, paddingBottom: 40, gap: 8 },
    empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 15 },

    card: {
        backgroundColor: '#fff', borderRadius: 14, padding: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderWidth: 1, borderColor: '#e2e8f0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    cardLeft:     { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
    avatar:       { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    avatarLetter: { color: '#fff', fontSize: 18, fontWeight: '700' },
    cardName:     { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    cardEmail:    { fontSize: 12, color: '#64748b', marginTop: 2 },
    roleBadge:    { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    roleText:     { fontSize: 11, fontWeight: '700' },
    selfBadge:    { backgroundColor: '#e0f2fe', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    selfBadgeText:{ fontSize: 10, fontWeight: '700', color: '#0284c7' },

    // Edit sheet
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 20, maxHeight: '92%',
    },
    sheetHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 20,
    },
    sheetTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
    sheetSub:   { fontSize: 13, color: '#64748b', marginTop: 2 },

    sectionLabel: { fontSize: 12, fontWeight: '700', color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    label:        { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },

    input: {
        backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
        paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0f172a',
    },

    roleSelector: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12,
        padding: 12, backgroundColor: '#f8fafc',
    },
    roleDot:         { width: 10, height: 10, borderRadius: 5 },
    roleSelectorText:{ flex: 1, fontSize: 15, fontWeight: '600' },
    rolePicker:      { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, marginTop: 6, overflow: 'hidden' },
    roleOption: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    roleOptionText: { fontSize: 14, fontWeight: '600' },

    passRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    eyeBtn:  { padding: 12, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },

    deleteBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderWidth: 1.5, borderColor: '#fecaca', borderRadius: 12,
        paddingVertical: 13, marginTop: 20, backgroundColor: '#fef2f2',
    },
    deleteBtnText: { color: '#dc2626', fontWeight: '700', fontSize: 14 },

    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#1e3a5f', borderRadius: 12, paddingVertical: 14,
        marginTop: 12,
        shadowColor: '#1e3a5f', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
    },
    permSaveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 14,
        shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
    },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    // Create modal
    createSafe:   { flex: 1, backgroundColor: '#f8fafc' },
    createHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 16,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    },
    createTitle:   { fontSize: 18, fontWeight: '800', color: '#1e3a5f' },
    permSubtitle:  { fontSize: 12, color: '#64748b', marginTop: 2 },
    createFooter:  { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },

    errorBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 16,
        borderWidth: 1, borderColor: '#fecaca',
    },
    errorText: { flex: 1, color: '#dc2626', fontSize: 13 },

    // Permissions modal
    legendRow: {
        flexDirection: 'row', gap: 16, paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendIcon: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    legendText: { fontSize: 11, color: '#64748b' },

    moduleLabel: {
        fontSize: 11, fontWeight: '800', color: '#94a3b8',
        textTransform: 'uppercase', letterSpacing: 0.8,
        marginBottom: 8,
    },
    moduleCard: {
        backgroundColor: '#fff', borderRadius: 14,
        borderWidth: 1, borderColor: '#e2e8f0',
        overflow: 'hidden',
    },
    permRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 12,
    },
    permRowBorder: { borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    permName:      { fontSize: 14, fontWeight: '600', color: '#1e293b' },
    permDesc:      { fontSize: 11, color: '#94a3b8', marginTop: 2 },
    overrideBadge: {
        backgroundColor: '#ede9fe', borderRadius: 4,
        paddingHorizontal: 6, paddingVertical: 2,
    },
    overrideText: { fontSize: 10, fontWeight: '700', color: '#7c3aed' },
    toggleBtn: {
        width: 32, height: 32, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center',
    },
    resetBtn: { fontSize: 11, color: '#94a3b8', textDecorationLine: 'underline' },
});
