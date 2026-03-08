import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, Switch,
    StyleSheet, ActivityIndicator, SafeAreaView, Alert,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRoles, getAllPermissions, updateRolePermissions } from '../../api';

const PRIMARY = '#4c1d95';
const ACCENT  = '#7c3aed';

// ─── Config modules ───────────────────────────────────────────────────────────
const MODULE_CONFIG = {
    vehicles:     { label: 'Véhicules',     icon: 'car-sport',      color: '#3b82f6', bg: '#eff6ff' },
    rentals:      { label: 'Locations',     icon: 'document-text',  color: '#7c3aed', bg: '#f5f3ff' },
    maintenances: { label: 'Maintenances',  icon: 'construct',      color: '#f97316', bg: '#fff7ed' },
    users:        { label: 'Utilisateurs',  icon: 'people',         color: '#16a34a', bg: '#f0fdf4' },
    finances:     { label: 'Finances',      icon: 'cash',           color: '#059669', bg: '#ecfdf5' },
    reminders:    { label: 'Rappels',       icon: 'notifications',  color: '#d97706', bg: '#fffbeb' },
};

const ROLE_CONFIG = {
    company_admin: { icon: 'business',    color: '#3b82f6', label: 'Admin Entreprise' },
    fleet_manager: { icon: 'speedometer', color: '#6366f1', label: 'Gest. Flotte'    },
    rental_agent:  { icon: 'clipboard',   color: '#7c3aed', label: 'Agent Location'  },
    mechanic:      { icon: 'construct',   color: '#f97316', label: 'Mécanicien'      },
    employee:      { icon: 'person',      color: '#16a34a', label: 'Employé'         },
    super_admin:   { icon: 'shield-checkmark', color: PRIMARY, label: 'Super Admin'  },
};

function setsEqual(a, b) {
    if (a.size !== b.size) return false;
    for (const x of a) if (!b.has(x)) return false;
    return true;
}

// ─── Composant Module ─────────────────────────────────────────────────────────
function ModuleSection({ module, permissions, activePerms, onToggle, onToggleAll, isSystem }) {
    const cfg = MODULE_CONFIG[module] || { label: module, icon: 'ellipse', color: '#94a3b8', bg: '#f8fafc' };
    const active = permissions.filter(p => activePerms.has(p.name));
    const allOn  = active.length === permissions.length;

    return (
        <View style={[styles.moduleCard, { borderLeftColor: cfg.color, borderLeftWidth: 3 }]}>
            {/* En-tête module */}
            <View style={styles.moduleHeader}>
                <View style={[styles.moduleIconWrap, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon} size={16} color={cfg.color} />
                </View>
                <Text style={styles.moduleLabel}>{cfg.label}</Text>
                <Text style={styles.moduleCount}>{active.length}/{permissions.length}</Text>
                {!isSystem && (
                    <View style={styles.toggleAllWrap}>
                        <Text style={styles.toggleAllLabel}>Tout</Text>
                        <Switch
                            value={allOn}
                            onValueChange={(val) => onToggleAll(permissions, val)}
                            trackColor={{ false: '#e2e8f0', true: cfg.color }}
                            thumbColor="#fff"
                            ios_backgroundColor="#e2e8f0"
                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                        />
                    </View>
                )}
            </View>

            {/* Liste des permissions */}
            {permissions.map((perm, idx) => (
                <View key={perm.name} style={[styles.permRow, idx < permissions.length - 1 && styles.permRowBorder]}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.permName}>{perm.display_name}</Text>
                        {perm.description ? (
                            <Text style={styles.permDesc}>{perm.description}</Text>
                        ) : null}
                    </View>
                    {isSystem ? (
                        <View style={styles.lockWrap}>
                            <Ionicons name="lock-closed" size={12} color="#94a3b8" />
                            <Text style={styles.lockText}>Tout</Text>
                        </View>
                    ) : (
                        <Switch
                            value={activePerms.has(perm.name)}
                            onValueChange={(val) => onToggle(perm.name, val)}
                            trackColor={{ false: '#e2e8f0', true: cfg.color }}
                            thumbColor="#fff"
                            ios_backgroundColor="#e2e8f0"
                            style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                        />
                    )}
                </View>
            ))}
        </View>
    );
}

// ─── Écran principal ──────────────────────────────────────────────────────────
export default function RolesPermissionsScreen() {
    const [roles, setRoles]                   = useState([]);
    const [permsByModule, setPermsByModule]   = useState({});
    const [totalPerms, setTotalPerms]         = useState(0);
    const [selectedRole, setSelectedRole]     = useState(null);
    const [activePerms, setActivePerms]       = useState(new Set());
    const [originalPerms, setOriginalPerms]   = useState(new Set());
    const [loading, setLoading]               = useState(true);
    const [saving, setSaving]                 = useState(false);

    const isDirty = !setsEqual(activePerms, originalPerms);

    // Barre de sauvegarde animée
    const saveBarAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(saveBarAnim, {
            toValue: isDirty && selectedRole?.name !== 'super_admin' && !selectedRole?.is_system ? 1 : 0,
            duration: 220,
            useNativeDriver: true,
        }).start();
    }, [isDirty, selectedRole]);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        try {
            const [rolesData, permsData] = await Promise.all([getRoles(), getAllPermissions()]);
            setRoles(rolesData);
            setPermsByModule(permsData);
            const count = Object.values(permsData).reduce((acc, arr) => acc + arr.length, 0);
            setTotalPerms(count);
            if (rolesData.length > 0) selectRole(rolesData[0]);
        } catch (e) {
            Alert.alert('Erreur', e.message);
        } finally {
            setLoading(false);
        }
    }

    function selectRole(role) {
        const set = new Set(role.permissions || []);
        setSelectedRole(role);
        setActivePerms(new Set(set));
        setOriginalPerms(new Set(set));
    }

    function handleToggle(permName, val) {
        setActivePerms(prev => {
            const next = new Set(prev);
            val ? next.add(permName) : next.delete(permName);
            return next;
        });
    }

    function handleToggleAll(permissions, val) {
        setActivePerms(prev => {
            const next = new Set(prev);
            permissions.forEach(p => val ? next.add(p.name) : next.delete(p.name));
            return next;
        });
    }

    function handleDiscard() {
        setActivePerms(new Set(originalPerms));
    }

    async function handleSave() {
        if (!selectedRole) return;
        setSaving(true);
        try {
            await updateRolePermissions(selectedRole.id, [...activePerms]);
            const newOrig = new Set(activePerms);
            setOriginalPerms(newOrig);
            setRoles(prev => prev.map(r =>
                r.id === selectedRole.id
                    ? { ...r, permissions: [...activePerms], total_count: activePerms.size }
                    : r
            ));
            Alert.alert('Succès', 'Permissions enregistrées.');
        } catch (e) {
            Alert.alert('Erreur', e.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color={ACCENT} /></View>;
    }

    const modules = Object.keys(permsByModule);
    const pct = totalPerms > 0 ? (activePerms.size / totalPerms) * 100 : 0;

    return (
        <SafeAreaView style={styles.safe}>
            {/* Sélecteur de rôles (scroll horizontal) */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.roleBar}
                contentContainerStyle={styles.roleBarContent}
            >
                {roles.map(role => {
                    const isSelected = selectedRole?.id === role.id;
                    const rc = ROLE_CONFIG[role.name] || { icon: 'person', color: PRIMARY };
                    return (
                        <TouchableOpacity
                            key={role.id}
                            style={[styles.roleChip, isSelected && { backgroundColor: rc.color, borderColor: rc.color }]}
                            onPress={() => selectRole(role)}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name={rc.icon}
                                size={14}
                                color={isSelected ? '#fff' : rc.color}
                            />
                            <Text style={[styles.roleChipText, isSelected && { color: '#fff' }]}>
                                {role.display_name}
                            </Text>
                            {role.name !== 'super_admin' && (
                                <Text style={[styles.roleChipCount, isSelected && { color: 'rgba(255,255,255,0.75)' }]}>
                                    {role.total_count}/{totalPerms}
                                </Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {selectedRole ? (
                selectedRole.name === 'super_admin' ? (
                    /* ─── Super admin : accès total ─── */
                    <View style={styles.superAdminWrap}>
                        <View style={styles.superAdminIcon}>
                            <Ionicons name="shield-checkmark" size={44} color={PRIMARY} />
                        </View>
                        <Text style={styles.superAdminTitle}>Accès total</Text>
                        <Text style={styles.superAdminDesc}>
                            Le super administrateur dispose de tous les droits sur toutes les entreprises.{'\n'}
                            Ses permissions ne peuvent pas être modifiées.
                        </Text>
                    </View>
                ) : (
                    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                        {/* Barre de progression globale */}
                        <View style={styles.progressCard}>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressLabel}>Permissions actives</Text>
                                <Text style={styles.progressCount}>
                                    <Text style={{ color: ACCENT, fontWeight: '800' }}>{activePerms.size}</Text>
                                    {' / '}{totalPerms}
                                </Text>
                            </View>
                            <View style={styles.progressBg}>
                                <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: ACCENT }]} />
                            </View>
                        </View>

                        {/* Modules */}
                        {modules.map(mod => (
                            <ModuleSection
                                key={mod}
                                module={mod}
                                permissions={permsByModule[mod]}
                                activePerms={activePerms}
                                onToggle={handleToggle}
                                onToggleAll={handleToggleAll}
                                isSystem={selectedRole.is_system}
                            />
                        ))}

                        <View style={{ height: 100 }} />
                    </ScrollView>
                )
            ) : null}

            {/* Barre de sauvegarde sticky */}
            <Animated.View
                style={[
                    styles.saveBar,
                    { opacity: saveBarAnim, transform: [{ translateY: saveBarAnim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }] },
                ]}
                pointerEvents={isDirty && selectedRole?.name !== 'super_admin' && !selectedRole?.is_system ? 'auto' : 'none'}
            >
                <View style={styles.saveDot} />
                <Text style={styles.saveBarText}>Modifications non sauvegardées</Text>
                <TouchableOpacity onPress={handleDiscard} style={styles.discardBtn}>
                    <Ionicons name="close" size={14} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.discardText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                >
                    {saving
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <><Ionicons name="save" size={13} color="#fff" /><Text style={styles.saveBtnText}>Enregistrer</Text></>
                    }
                </TouchableOpacity>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe:   { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    roleBar:        { maxHeight: 64, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    roleBarContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row', alignItems: 'center' },
    roleChip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 7,
        borderRadius: 20, borderWidth: 1.5, borderColor: '#e2e8f0',
        backgroundColor: '#fff',
    },
    roleChipText:  { fontSize: 12, fontWeight: '700', color: '#475569' },
    roleChipCount: { fontSize: 10, fontWeight: '600', color: '#94a3b8' },

    scroll:        { flex: 1 },
    scrollContent: { padding: 14, gap: 10 },

    progressCard: {
        backgroundColor: '#fff', borderRadius: 14, padding: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    progressLabel:  { fontSize: 13, fontWeight: '600', color: '#475569' },
    progressCount:  { fontSize: 13, color: '#64748b' },
    progressBg:     { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
    progressFill:   { height: 8, borderRadius: 4 },

    moduleCard: {
        backgroundColor: '#fff', borderRadius: 14, padding: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    moduleHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    moduleIconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    moduleLabel:    { flex: 1, fontSize: 13, fontWeight: '700', color: '#0f172a' },
    moduleCount:    { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
    toggleAllWrap:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
    toggleAllLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },

    permRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
    permRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    permName:      { fontSize: 13, fontWeight: '600', color: '#334155' },
    permDesc:      { fontSize: 11, color: '#94a3b8', marginTop: 1 },
    lockWrap:      { flexDirection: 'row', alignItems: 'center', gap: 3 },
    lockText:      { fontSize: 10, color: '#94a3b8' },

    superAdminWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    superAdminIcon: {
        width: 90, height: 90, borderRadius: 24, backgroundColor: '#f5f3ff',
        alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    },
    superAdminTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 10 },
    superAdminDesc:  { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22 },

    saveBar: {
        position: 'absolute', bottom: 16, left: 16, right: 16,
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#0f172a', borderRadius: 16,
        paddingHorizontal: 14, paddingVertical: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
    },
    saveDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#facc15' },
    saveBarText:  { flex: 1, fontSize: 12, color: '#fff', fontWeight: '600' },
    discardBtn:   { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4 },
    discardText:  { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
    saveBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: ACCENT, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
    saveBtnText:  { fontSize: 12, color: '#fff', fontWeight: '700' },
});
