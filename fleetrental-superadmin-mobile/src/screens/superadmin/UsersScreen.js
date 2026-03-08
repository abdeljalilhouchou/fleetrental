import React, { useState, useCallback, useRef, useEffect, useContext } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    StyleSheet, Alert, ActivityIndicator, Modal, ScrollView,
    KeyboardAvoidingView, Platform, SafeAreaView, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    getUsers, createUser, updateUser, deleteUser, resetUserPassword,
    getUserPermissions, updateUserPermissions, toggleUserActive,
    getCompanies,
} from '../../api';
import { AuthContext } from '../../context/AuthContext';

const PRIMARY = '#4c1d95';
const ACCENT  = '#7c3aed';

// ─── Config ───────────────────────────────────────────────────────────────────
const ROLES = [
    { value: 'super_admin',   label: 'Super Admin',            color: PRIMARY,   bg: '#f5f3ff' },
    { value: 'company_admin', label: 'Company Admin',          color: ACCENT,    bg: '#ede9fe' },
    { value: 'fleet_manager', label: 'Gest. Flotte',           color: '#0284c7', bg: '#e0f2fe' },
    { value: 'rental_agent',  label: 'Agent Location',         color: '#059669', bg: '#ecfdf5' },
    { value: 'mechanic',      label: 'Mécanicien',             color: '#d97706', bg: '#fffbeb' },
    { value: 'employee',      label: 'Employé',                color: '#64748b', bg: '#f1f5f9' },
];

const MODULE_CONFIG = {
    vehicles:     { label: 'Véhicules',    icon: 'car-sport',     color: '#3b82f6', bg: '#eff6ff' },
    rentals:      { label: 'Locations',    icon: 'document-text', color: '#7c3aed', bg: '#f5f3ff' },
    maintenances: { label: 'Maintenances', icon: 'construct',     color: '#f97316', bg: '#fff7ed' },
    users:        { label: 'Utilisateurs', icon: 'people',        color: '#16a34a', bg: '#f0fdf4' },
    finances:     { label: 'Finances',     icon: 'cash',          color: '#059669', bg: '#ecfdf5' },
    reminders:    { label: 'Rappels',      icon: 'notifications', color: '#d97706', bg: '#fffbeb' },
};

// granted → revoked → inherited
const STATE_CONFIG = {
    granted:          { label: 'Accordé',  color: '#16a34a', bg: '#f0fdf4', icon: 'add-circle' },
    revoked:          { label: 'Révoqué',  color: '#dc2626', bg: '#fef2f2', icon: 'remove-circle' },
    inherited_granted:{ label: 'Hérité ✓', color: '#0284c7', bg: '#e0f2fe', icon: 'checkmark-circle' },
    inherited_denied: { label: 'Hérité ✗', color: '#94a3b8', bg: '#f1f5f9', icon: 'ellipse-outline' },
};

function nextState(current) {
    if (current === 'inherited_granted' || current === 'inherited_denied' || current === 'inherited') return 'granted';
    if (current === 'granted') return 'revoked';
    return 'inherited'; // depuis revoked
}

function toApiState(state) {
    if (state === 'granted') return 'granted';
    if (state === 'revoked') return 'revoked';
    return 'inherited';
}

function roleMeta(role) {
    return ROLES.find(r => r.value === role) || { label: role, color: '#64748b', bg: '#f1f5f9' };
}

// ─── Composant: bouton cycle état permission ──────────────────────────────────
function StateChip({ state, onChange, disabled }) {
    const cfg = STATE_CONFIG[state] || STATE_CONFIG.inherited_denied;
    return (
        <TouchableOpacity
            onPress={() => !disabled && onChange(nextState(state))}
            disabled={disabled}
            style={[styles.stateChip, { backgroundColor: cfg.bg }, disabled && { opacity: 0.5 }]}
        >
            <Ionicons name={cfg.icon} size={11} color={cfg.color} />
            <Text style={[styles.stateChipText, { color: cfg.color }]}>{cfg.label}</Text>
        </TouchableOpacity>
    );
}

// ─── Onglet Permissions ───────────────────────────────────────────────────────
function PermissionsTab({ user }) {
    const [permsByModule, setPermsByModule] = useState({});
    const [localStates, setLocalStates]     = useState({});
    const [originalStates, setOriginalStates] = useState({});
    const [loading, setLoading]             = useState(true);
    const [saving, setSaving]               = useState(false);

    const isDirty = JSON.stringify(localStates) !== JSON.stringify(originalStates);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const data = await getUserPermissions(user.id);
                setPermsByModule(data);
                const states = {};
                Object.values(data).flat().forEach(p => { states[p.name] = p.state; });
                setLocalStates(states);
                setOriginalStates({ ...states });
            } catch (e) {
                Alert.alert('Erreur', e.message);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [user.id]);

    function handleChange(permName, newState) {
        setLocalStates(prev => ({ ...prev, [permName]: newState }));
    }

    async function handleSave() {
        setSaving(true);
        try {
            const overrides = Object.entries(localStates).map(([name, state]) => ({
                name, state: toApiState(state),
            }));
            await updateUserPermissions(user.id, overrides);
            setOriginalStates({ ...localStates });
            Alert.alert('Succès', 'Permissions sauvegardées.');
        } catch (e) {
            Alert.alert('Erreur', e.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <View style={styles.tabCenter}><ActivityIndicator color={ACCENT} /></View>;

    const isSuperAdmin = user.role === 'super_admin';
    const modules = Object.keys(permsByModule);

    return (
        <View style={{ flex: 1 }}>
            {/* Légende */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.legendBar} contentContainerStyle={styles.legendContent}>
                <Text style={styles.legendTitle}>Légende : </Text>
                {Object.entries(STATE_CONFIG).map(([key, cfg]) => (
                    <View key={key} style={[styles.legendChip, { backgroundColor: cfg.bg }]}>
                        <Ionicons name={cfg.icon} size={9} color={cfg.color} />
                        <Text style={[styles.legendText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                ))}
            </ScrollView>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 80 }}>
                {modules.map(mod => {
                    const cfg = MODULE_CONFIG[mod] || { label: mod, icon: 'ellipse', color: '#94a3b8', bg: '#f8fafc' };
                    const perms = permsByModule[mod];
                    return (
                        <View key={mod} style={[styles.moduleCard, { borderLeftColor: cfg.color, borderLeftWidth: 3 }]}>
                            <View style={styles.moduleHeader}>
                                <View style={[styles.moduleIcon, { backgroundColor: cfg.bg }]}>
                                    <Ionicons name={cfg.icon} size={14} color={cfg.color} />
                                </View>
                                <Text style={styles.moduleLabel}>{cfg.label}</Text>
                            </View>
                            {perms.map((perm, idx) => (
                                <View key={perm.name} style={[styles.permRow, idx < perms.length - 1 && styles.permDivider]}>
                                    <Text style={styles.permName} numberOfLines={2}>{perm.display_name}</Text>
                                    <StateChip
                                        state={localStates[perm.name] || perm.state}
                                        onChange={(s) => handleChange(perm.name, s)}
                                        disabled={isSuperAdmin}
                                    />
                                </View>
                            ))}
                        </View>
                    );
                })}
            </ScrollView>

            {/* Barre sauvegarde — visible uniquement quand il y a des modifications */}
            {isDirty && !isSuperAdmin && (
                <View style={styles.permSaveBar}>
                    <View style={styles.permSaveBarInner}>
                        <Ionicons name="warning" size={16} color="#fbbf24" />
                        <Text style={styles.permSaveBarText}>Modifications non sauvegardées</Text>
                    </View>
                    <View style={styles.permSaveBarActions}>
                        <TouchableOpacity onPress={() => setLocalStates({ ...originalStates })} style={styles.permDiscardBtn}>
                            <Text style={styles.permDiscardText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={saving}
                            style={[styles.permSaveBtn, saving && { opacity: 0.6 }]}
                        >
                            {saving
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <><Ionicons name="checkmark" size={14} color="#fff" /><Text style={styles.permSaveBtnText}>Enregistrer</Text></>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

// ─── Modal Gérer utilisateur ──────────────────────────────────────────────────
function ManageUserModal({ user, companies, onClose, onRefresh }) {
    const [activeTab, setActiveTab] = useState('info');

    // Info tab state
    const [editName,   setEditName]   = useState(user.name   || '');
    const [editEmail,  setEditEmail]  = useState(user.email  || '');
    const [editRole,   setEditRole]   = useState(user.role   || '');
    const [editCompany, setEditCompany] = useState(user.company_id || '');
    const [isActive,   setIsActive]   = useState(user.is_active !== false);
    const [showRolePicker, setShowRolePicker] = useState(false);
    const [showCompanyPicker, setShowCompanyPicker] = useState(false);
    const [savingInfo, setSavingInfo] = useState(false);

    // Password state
    const [newPwd, setNewPwd]     = useState('');
    const [showPwd, setShowPwd]   = useState(false);
    const [savingPwd, setSavingPwd] = useState(false);

    // Delete
    const [deleting, setDeleting] = useState(false);

    const origIsActive = user.is_active !== false;
    const isInfoDirty = editName !== user.name || editEmail !== user.email ||
        editRole !== user.role || isActive !== origIsActive ||
        String(editCompany || '') !== String(user.company_id || '');

    async function handleSaveInfo() {
        if (!editName.trim() || !editEmail.trim()) {
            Alert.alert('Erreur', 'Nom et email sont requis.');
            return;
        }
        setSavingInfo(true);
        try {
            await updateUser(user.id, {
                name: editName.trim(),
                email: editEmail.trim(),
                role: editRole,
                company_id: editCompany || null,
            });
            if (isActive !== origIsActive) {
                await toggleUserActive(user.id);
            }
            onRefresh();
            Alert.alert('Succès', 'Informations enregistrées.');
        } catch (e) {
            Alert.alert('Erreur', e.message);
        } finally {
            setSavingInfo(false);
        }
    }

    async function handleResetPwd() {
        if (!newPwd || newPwd.length < 8) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }
        setSavingPwd(true);
        try {
            await resetUserPassword(user.id, newPwd);
            setNewPwd('');
            Alert.alert('Succès', 'Mot de passe réinitialisé.');
        } catch (e) {
            Alert.alert('Erreur', e.message);
        } finally {
            setSavingPwd(false);
        }
    }

    function handleDelete() {
        Alert.alert(
            'Supprimer',
            `Supprimer "${user.name}" ? Cette action est irréversible.`,
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            await deleteUser(user.id);
                            onClose();
                            onRefresh();
                        } catch (e) {
                            Alert.alert('Erreur', e.message);
                        } finally {
                            setDeleting(false);
                        }
                    },
                },
            ]
        );
    }

    return (
        <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={styles.manageModal}>
                {/* Header */}
                <View style={styles.manageHeader}>
                    <View style={[styles.manageAvatar, { backgroundColor: roleMeta(user.role).color }]}>
                        <Text style={styles.manageAvatarLetter}>{(user.name || '?')[0].toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.manageName} numberOfLines={1}>{user.name}</Text>
                        <Text style={styles.manageEmail} numberOfLines={1}>{user.email}</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={22} color="#64748b" />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={styles.tabs}>
                    {[{ id: 'info', label: 'Informations' }, { id: 'permissions', label: 'Permissions' }].map(tab => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                            onPress={() => setActiveTab(tab.id)}
                        >
                            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── Onglet Informations ── */}
                {activeTab === 'info' && (
                    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.infoContent} keyboardShouldPersistTaps="handled">
                            <Text style={styles.sectionLabel}>INFORMATIONS</Text>

                            <Text style={styles.fieldLabel}>Nom complet</Text>
                            <TextInput
                                style={styles.input}
                                value={editName}
                                onChangeText={setEditName}
                                placeholder="Nom complet"
                                placeholderTextColor="#94a3b8"
                            />

                            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={editEmail}
                                onChangeText={setEditEmail}
                                placeholder="email@exemple.com"
                                placeholderTextColor="#94a3b8"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Rôle</Text>
                            <TouchableOpacity style={styles.picker} onPress={() => { setShowRolePicker(v => !v); setShowCompanyPicker(false); }}>
                                <View style={[styles.dot, { backgroundColor: roleMeta(editRole).color }]} />
                                <Text style={[styles.pickerText, { color: roleMeta(editRole).color }]}>{roleMeta(editRole).label}</Text>
                                <Ionicons name={showRolePicker ? 'chevron-up' : 'chevron-down'} size={16} color="#94a3b8" />
                            </TouchableOpacity>
                            {showRolePicker && (
                                <View style={styles.pickerList}>
                                    {ROLES.map(r => (
                                        <TouchableOpacity
                                            key={r.value}
                                            style={[styles.pickerItem, editRole === r.value && { backgroundColor: r.bg }]}
                                            onPress={() => { setEditRole(r.value); setShowRolePicker(false); }}
                                        >
                                            <View style={[styles.dot, { backgroundColor: r.color }]} />
                                            <Text style={[styles.pickerItemText, { color: r.color }]}>{r.label}</Text>
                                            {editRole === r.value && <Ionicons name="checkmark" size={15} color={r.color} style={{ marginLeft: 'auto' }} />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Entreprise</Text>
                            <TouchableOpacity style={styles.picker} onPress={() => { setShowCompanyPicker(v => !v); setShowRolePicker(false); }}>
                                <Ionicons name="business-outline" size={16} color="#94a3b8" />
                                <Text style={[styles.pickerText, { color: '#475569' }]}>
                                    {editCompany ? (companies.find(c => String(c.id) === String(editCompany))?.name || '—') : '— Aucune —'}
                                </Text>
                                <Ionicons name={showCompanyPicker ? 'chevron-up' : 'chevron-down'} size={16} color="#94a3b8" />
                            </TouchableOpacity>
                            {showCompanyPicker && (
                                <View style={styles.pickerList}>
                                    <TouchableOpacity
                                        style={[styles.pickerItem, !editCompany && { backgroundColor: '#f5f3ff' }]}
                                        onPress={() => { setEditCompany(''); setShowCompanyPicker(false); }}
                                    >
                                        <Text style={{ fontSize: 14, color: '#64748b' }}>— Aucune —</Text>
                                    </TouchableOpacity>
                                    {companies.map(c => (
                                        <TouchableOpacity
                                            key={c.id}
                                            style={[styles.pickerItem, String(editCompany) === String(c.id) && { backgroundColor: '#f5f3ff' }]}
                                            onPress={() => { setEditCompany(c.id); setShowCompanyPicker(false); }}
                                        >
                                            <Ionicons name="business" size={14} color={PRIMARY} />
                                            <Text style={[styles.pickerItemText, { color: '#0f172a' }]}>{c.name}</Text>
                                            {String(editCompany) === String(c.id) && <Ionicons name="checkmark" size={15} color={PRIMARY} style={{ marginLeft: 'auto' }} />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Toggle actif */}
                            <View style={styles.activeRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.activeLabel}>Compte actif</Text>
                                    <Text style={styles.activeDesc}>L'utilisateur peut se connecter</Text>
                                </View>
                                <Switch
                                    value={isActive}
                                    onValueChange={setIsActive}
                                    trackColor={{ false: '#e2e8f0', true: PRIMARY }}
                                    thumbColor="#fff"
                                    ios_backgroundColor="#e2e8f0"
                                />
                            </View>

                            {isInfoDirty && (
                                <TouchableOpacity
                                    style={[styles.saveInfoBtn, savingInfo && { opacity: 0.6 }]}
                                    onPress={handleSaveInfo}
                                    disabled={savingInfo}
                                >
                                    {savingInfo
                                        ? <ActivityIndicator color="#fff" size="small" />
                                        : <><Ionicons name="save-outline" size={16} color="#fff" /><Text style={styles.saveBtnText}>Enregistrer les informations</Text></>
                                    }
                                </TouchableOpacity>
                            )}

                            {/* Reset mot de passe */}
                            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>RÉINITIALISER LE MOT DE PASSE</Text>
                            <View style={styles.pwdRow}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    value={newPwd}
                                    onChangeText={setNewPwd}
                                    placeholder="Nouveau mot de passe (min. 8)"
                                    placeholderTextColor="#94a3b8"
                                    secureTextEntry={!showPwd}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPwd(v => !v)}>
                                    <Ionicons name={showPwd ? 'eye-off' : 'eye'} size={20} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                                style={[styles.pwdBtn, (!newPwd || savingPwd) && { opacity: 0.5 }]}
                                onPress={handleResetPwd}
                                disabled={!newPwd || savingPwd}
                            >
                                {savingPwd
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <><Ionicons name="key-outline" size={15} color="#fff" /><Text style={styles.pwdBtnText}>Réinitialiser</Text></>
                                }
                            </TouchableOpacity>

                            {/* Supprimer */}
                            <TouchableOpacity
                                style={[styles.deleteBtn, deleting && { opacity: 0.5 }]}
                                onPress={handleDelete}
                                disabled={deleting}
                            >
                                <Ionicons name="trash-outline" size={16} color="#dc2626" />
                                <Text style={styles.deleteBtnText}>Supprimer cet utilisateur</Text>
                            </TouchableOpacity>

                            <View style={{ height: 30 }} />
                        </ScrollView>
                    </KeyboardAvoidingView>
                )}

                {/* ── Onglet Permissions ── */}
                {activeTab === 'permissions' && <PermissionsTab user={user} />}
            </SafeAreaView>
        </Modal>
    );
}

// ─── Modal Création utilisateur ───────────────────────────────────────────────
function CreateUserModal({ companies, onClose, onRefresh }) {
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'company_admin', company_id: '' });
    const [showPwd, setShowPwd]   = useState(false);
    const [showRole, setShowRole] = useState(false);
    const [showComp, setShowComp] = useState(false);
    const [saving, setSaving]     = useState(false);
    const [error, setError]       = useState('');

    async function handleCreate() {
        setError('');
        if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
            setError('Nom, email et mot de passe sont requis.');
            return;
        }
        setSaving(true);
        try {
            await createUser({
                name:       form.name.trim(),
                email:      form.email.trim(),
                password:   form.password.trim(),
                role:       form.role,
                company_id: form.company_id || null,
            });
            onRefresh();
            onClose();
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    const selRole = roleMeta(form.role);
    const selComp = companies.find(c => String(c.id) === String(form.company_id));

    return (
        <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={styles.manageModal}>
                <View style={styles.manageHeader}>
                    <Text style={styles.createTitle}>Nouvel utilisateur</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={22} color="#64748b" />
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.infoContent} keyboardShouldPersistTaps="handled">
                        {error ? (
                            <View style={styles.errorBox}>
                                <Ionicons name="alert-circle" size={14} color="#dc2626" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <Text style={styles.fieldLabel}>Nom complet *</Text>
                        <TextInput
                            style={styles.input}
                            value={form.name}
                            onChangeText={v => setForm(f => ({ ...f, name: v }))}
                            placeholder="Mohamed Alami"
                            placeholderTextColor="#94a3b8"
                        />

                        <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Email *</Text>
                        <TextInput
                            style={styles.input}
                            value={form.email}
                            onChangeText={v => setForm(f => ({ ...f, email: v }))}
                            placeholder="email@exemple.com"
                            placeholderTextColor="#94a3b8"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Mot de passe *</Text>
                        <View style={styles.pwdRow}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                value={form.password}
                                onChangeText={v => setForm(f => ({ ...f, password: v }))}
                                placeholder="Min. 8 caractères"
                                placeholderTextColor="#94a3b8"
                                secureTextEntry={!showPwd}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPwd(v => !v)}>
                                <Ionicons name={showPwd ? 'eye-off' : 'eye'} size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Rôle</Text>
                        <TouchableOpacity style={styles.picker} onPress={() => { setShowRole(v => !v); setShowComp(false); }}>
                            <View style={[styles.dot, { backgroundColor: selRole.color }]} />
                            <Text style={[styles.pickerText, { color: selRole.color }]}>{selRole.label}</Text>
                            <Ionicons name={showRole ? 'chevron-up' : 'chevron-down'} size={16} color="#94a3b8" />
                        </TouchableOpacity>
                        {showRole && (
                            <View style={styles.pickerList}>
                                {ROLES.map(r => (
                                    <TouchableOpacity
                                        key={r.value}
                                        style={[styles.pickerItem, form.role === r.value && { backgroundColor: r.bg }]}
                                        onPress={() => { setForm(f => ({ ...f, role: r.value })); setShowRole(false); }}
                                    >
                                        <View style={[styles.dot, { backgroundColor: r.color }]} />
                                        <Text style={[styles.pickerItemText, { color: r.color }]}>{r.label}</Text>
                                        {form.role === r.value && <Ionicons name="checkmark" size={15} color={r.color} style={{ marginLeft: 'auto' }} />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Entreprise</Text>
                        <TouchableOpacity style={styles.picker} onPress={() => { setShowComp(v => !v); setShowRole(false); }}>
                            <Ionicons name="business-outline" size={16} color="#94a3b8" />
                            <Text style={[styles.pickerText, { color: '#475569' }]}>
                                {selComp ? selComp.name : '— Aucune —'}
                            </Text>
                            <Ionicons name={showComp ? 'chevron-up' : 'chevron-down'} size={16} color="#94a3b8" />
                        </TouchableOpacity>
                        {showComp && (
                            <View style={styles.pickerList}>
                                <TouchableOpacity
                                    style={[styles.pickerItem, !form.company_id && { backgroundColor: '#f5f3ff' }]}
                                    onPress={() => { setForm(f => ({ ...f, company_id: '' })); setShowComp(false); }}
                                >
                                    <Text style={{ fontSize: 14, color: '#64748b' }}>— Aucune —</Text>
                                </TouchableOpacity>
                                {companies.map(c => (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={[styles.pickerItem, String(form.company_id) === String(c.id) && { backgroundColor: '#f5f3ff' }]}
                                        onPress={() => { setForm(f => ({ ...f, company_id: c.id })); setShowComp(false); }}
                                    >
                                        <Ionicons name="business" size={14} color={PRIMARY} />
                                        <Text style={[styles.pickerItemText, { color: '#0f172a' }]}>{c.name}</Text>
                                        {String(form.company_id) === String(c.id) && <Ionicons name="checkmark" size={15} color={PRIMARY} style={{ marginLeft: 'auto' }} />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.saveInfoBtn, { marginTop: 24 }, saving && { opacity: 0.6 }]}
                            onPress={handleCreate}
                            disabled={saving}
                        >
                            {saving
                                ? <ActivityIndicator color="#fff" size="small" />
                                : <><Ionicons name="person-add-outline" size={16} color="#fff" /><Text style={styles.saveBtnText}>Créer l'utilisateur</Text></>
                            }
                        </TouchableOpacity>
                        <View style={{ height: 30 }} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}

// ─── Écran principal ──────────────────────────────────────────────────────────
export default function UsersScreen() {
    const { user: me } = useContext(AuthContext);

    const [users,      setUsers]      = useState([]);
    const [companies,  setCompanies]  = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [search,     setSearch]     = useState('');
    const [filterRole, setFilterRole] = useState('');

    const [selectedUser, setSelectedUser] = useState(null);
    const [showCreate,   setShowCreate]   = useState(false);
    const loaded = useRef(false);

    const load = useCallback(async () => {
        if (!loaded.current) setLoading(true);
        try {
            const [usersData, companiesData] = await Promise.all([getUsers(), getCompanies()]);
            setUsers(Array.isArray(usersData) ? usersData : (usersData.data || []));
            setCompanies(Array.isArray(companiesData) ? companiesData : (companiesData.data || []));
            loaded.current = true;
        } catch (e) {
            Alert.alert('Erreur', e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { load(); }, []));

    // Rôles uniques pour le filtre
    const uniqueRoles = [...new Set(users.map(u => u.role))];

    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        const matchSearch = !search || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
        const matchRole   = !filterRole || u.role === filterRole;
        return matchSearch && matchRole;
    });

    function renderUser({ item }) {
        const r      = roleMeta(item.role);
        const isSelf = item.id === me?.id;
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={isSelf ? undefined : () => setSelectedUser(item)}
                activeOpacity={isSelf ? 1 : 0.75}
            >
                <View style={[styles.avatar, { backgroundColor: r.color }]}>
                    <Text style={styles.avatarLetter}>{(item.name || '?')[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                        {isSelf && <View style={styles.selfBadge}><Text style={styles.selfBadgeText}>Vous</Text></View>}
                    </View>
                    <Text style={styles.cardEmail} numberOfLines={1}>{item.email}</Text>
                    {item.company?.name && (
                        <View style={styles.companyRow}>
                            <Ionicons name="business-outline" size={11} color="#94a3b8" />
                            <Text style={styles.companyText} numberOfLines={1}>{item.company.name}</Text>
                        </View>
                    )}
                </View>
                <View style={{ alignItems: 'flex-end', gap: 5 }}>
                    <View style={[styles.roleBadge, { backgroundColor: r.bg }]}>
                        <Text style={[styles.roleText, { color: r.color }]}>{r.label}</Text>
                    </View>
                    <View style={[styles.activeBadge, { backgroundColor: item.is_active !== false ? '#f0fdf4' : '#fef2f2' }]}>
                        <View style={[styles.activeDot, { backgroundColor: item.is_active !== false ? '#16a34a' : '#dc2626' }]} />
                        <Text style={[styles.activeText, { color: item.is_active !== false ? '#16a34a' : '#dc2626' }]}>
                            {item.is_active !== false ? 'Actif' : 'Inactif'}
                        </Text>
                    </View>
                    {!isSelf && <Ionicons name="chevron-forward" size={14} color="#cbd5e1" />}
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            {/* Barre recherche + bouton créer */}
            <View style={styles.topRow}>
                <View style={[styles.searchBox, { flex: 1 }]}>
                    <Ionicons name="search" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Rechercher…"
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
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
                    <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Filtre rôle */}
            {uniqueRoles.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
                    <TouchableOpacity
                        style={[styles.filterChip, !filterRole && { backgroundColor: PRIMARY, borderColor: PRIMARY }]}
                        onPress={() => setFilterRole('')}
                    >
                        <Text style={[styles.filterChipText, !filterRole && { color: '#fff' }]}>Tous</Text>
                    </TouchableOpacity>
                    {uniqueRoles.map(role => {
                        const r = roleMeta(role);
                        const active = filterRole === role;
                        return (
                            <TouchableOpacity
                                key={role}
                                style={[styles.filterChip, active && { backgroundColor: r.color, borderColor: r.color }]}
                                onPress={() => setFilterRole(active ? '' : role)}
                            >
                                <Text style={[styles.filterChipText, active && { color: '#fff' }]}>{r.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={ACCENT} /></View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderUser}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>Aucun utilisateur trouvé.</Text>}
                />
            )}

            {selectedUser && (
                <ManageUserModal
                    user={selectedUser}
                    companies={companies}
                    onClose={() => setSelectedUser(null)}
                    onRefresh={load}
                />
            )}

            {showCreate && (
                <CreateUserModal
                    companies={companies}
                    onClose={() => setShowCreate(false)}
                    onRefresh={load}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe:   { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    topRow: { flexDirection: 'row', alignItems: 'center', margin: 14, marginBottom: 8, gap: 10 },
    searchBox: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 10,
        backgroundColor: '#fff', borderRadius: 12,
        borderWidth: 1, borderColor: '#e2e8f0',
    },
    searchInput: { flex: 1, fontSize: 14, color: '#0f172a' },
    addBtn: {
        width: 44, height: 44, borderRadius: 12, backgroundColor: PRIMARY,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
    },

    filterBar:    { maxHeight: 52, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    filterContent:{ paddingHorizontal: 12, paddingVertical: 8, gap: 6, flexDirection: 'row' },
    filterChip: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
        borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#fff',
    },
    filterChipText: { fontSize: 12, fontWeight: '700', color: '#64748b' },

    list:  { paddingHorizontal: 14, paddingBottom: 40, gap: 8, paddingTop: 8 },
    empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 15 },

    card: {
        backgroundColor: '#fff', borderRadius: 14, padding: 14,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderWidth: 1, borderColor: '#e2e8f0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    avatar:       { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    avatarLetter: { color: '#fff', fontSize: 18, fontWeight: '700' },
    cardName:     { fontSize: 14, fontWeight: '700', color: '#0f172a' },
    cardEmail:    { fontSize: 12, color: '#64748b' },
    companyRow:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
    companyText:  { fontSize: 11, color: '#94a3b8' },
    roleBadge:    { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
    roleText:     { fontSize: 10, fontWeight: '700' },
    activeBadge:  { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 },
    activeDot:    { width: 6, height: 6, borderRadius: 3 },
    activeText:   { fontSize: 10, fontWeight: '700' },
    selfBadge:    { backgroundColor: '#e0f2fe', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
    selfBadgeText:{ fontSize: 10, fontWeight: '700', color: '#0284c7' },

    // Modal gérer
    manageModal:  { flex: 1, backgroundColor: '#f8fafc' },
    manageHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 18, paddingVertical: 14,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    },
    manageAvatar:       { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
    manageAvatarLetter: { color: '#fff', fontSize: 17, fontWeight: '700' },
    manageName:         { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    manageEmail:        { fontSize: 12, color: '#64748b', marginTop: 1 },
    closeBtn:           { padding: 6 },
    createTitle:        { flex: 1, fontSize: 17, fontWeight: '800', color: PRIMARY },

    tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    tab: { flex: 1, paddingVertical: 13, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: PRIMARY },
    tabText:   { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
    tabTextActive: { color: PRIMARY },

    infoContent: { padding: 16 },
    sectionLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
    fieldLabel:   { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 6 },
    input: {
        backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
        paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#0f172a',
    },
    picker: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12,
        padding: 12, backgroundColor: '#f8fafc',
    },
    dot:          { width: 10, height: 10, borderRadius: 5 },
    pickerText:   { flex: 1, fontSize: 14, fontWeight: '600' },
    pickerList:   { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, marginTop: 4, overflow: 'hidden', backgroundColor: '#fff' },
    pickerItem:   { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    pickerItemText:{ flex: 1, fontSize: 13, fontWeight: '600' },

    activeRow: {
        flexDirection: 'row', alignItems: 'center',
        padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc', marginTop: 16,
    },
    activeLabel: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
    activeDesc:  { fontSize: 11, color: '#94a3b8', marginTop: 2 },

    saveInfoBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 13, marginTop: 16,
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
    },
    saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

    pwdRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    eyeBtn: { padding: 12, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    pwdBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: '#f59e0b', borderRadius: 12, paddingVertical: 11, marginTop: 10,
    },
    pwdBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

    deleteBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderWidth: 1.5, borderColor: '#fecaca', borderRadius: 12,
        paddingVertical: 12, marginTop: 20, backgroundColor: '#fef2f2',
    },
    deleteBtnText: { color: '#dc2626', fontWeight: '700', fontSize: 13 },

    // Permissions tab
    tabCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    legendBar:    { maxHeight: 44, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    legendContent:{ paddingHorizontal: 12, paddingVertical: 8, gap: 5, flexDirection: 'row', alignItems: 'center' },
    legendTitle:  { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
    legendChip:   { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
    legendText:   { fontSize: 10, fontWeight: '700' },

    moduleCard: {
        backgroundColor: '#fff', borderRadius: 14, padding: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
    },
    moduleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    moduleIcon:   { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
    moduleLabel:  { fontSize: 13, fontWeight: '700', color: '#0f172a' },

    permRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, gap: 8 },
    permDivider:{ borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    permName:   { flex: 1, fontSize: 12, fontWeight: '600', color: '#334155' },

    stateChip:     { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
    stateChipText: { fontSize: 10, fontWeight: '700' },

    permSaveBar: {
        backgroundColor: '#1e293b',
        paddingHorizontal: 14, paddingVertical: 12,
        borderTopWidth: 2, borderTopColor: '#f59e0b',
        gap: 8,
    },
    permSaveBarInner:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
    permSaveBarActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    permSaveBarText:    { flex: 1, fontSize: 12, color: '#fbbf24', fontWeight: '700' },
    permDiscardBtn:     { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    permDiscardText:    { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
    permSaveBtn:        { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#16a34a', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
    permSaveBtnText:    { fontSize: 12, color: '#fff', fontWeight: '700' },

    errorBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 14,
        borderWidth: 1, borderColor: '#fecaca',
    },
    errorText: { flex: 1, color: '#dc2626', fontSize: 12 },
});
