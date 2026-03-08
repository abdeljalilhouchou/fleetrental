import React, { useState, useContext } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { updateProfile, changePassword } from '../../api';

const PRIMARY = '#4c1d95';
const ACCENT  = '#7c3aed';

export default function ProfileScreen({ navigation }) {
    const { user, setUser } = useContext(AuthContext);

    const [name,  setName]  = useState(user?.name  || '');
    const [email, setEmail] = useState(user?.email || '');
    const [saving, setSaving] = useState(false);

    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd,     setNewPwd]     = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [changingPwd, setChangingPwd] = useState(false);

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew,     setShowNew]     = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    async function handleSaveProfile() {
        if (!name.trim() || !email.trim()) {
            Alert.alert('Erreur', 'Nom et email sont requis.');
            return;
        }
        setSaving(true);
        try {
            const updated = await updateProfile({ name: name.trim(), email: email.trim() });
            setUser(prev => ({ ...prev, name: updated.name || name, email: updated.email || email }));
            Alert.alert('Succès', 'Profil mis à jour avec succès.');
        } catch (e) {
            Alert.alert('Erreur', e.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleChangePassword() {
        if (!currentPwd || !newPwd || !confirmPwd) {
            Alert.alert('Erreur', 'Remplissez tous les champs du mot de passe.');
            return;
        }
        if (newPwd !== confirmPwd) {
            Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas.');
            return;
        }
        if (newPwd.length < 8) {
            Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 8 caractères.');
            return;
        }
        setChangingPwd(true);
        try {
            await changePassword({
                current_password:      currentPwd,
                password:              newPwd,
                password_confirmation: confirmPwd,
            });
            setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
            Alert.alert('Succès', 'Mot de passe modifié avec succès.');
        } catch (e) {
            Alert.alert('Erreur', e.message);
        } finally {
            setChangingPwd(false);
        }
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <View style={styles.avatarWrap}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarLetter}>
                            {(user?.name || 'S')[0].toUpperCase()}
                        </Text>
                    </View>
                    <Text style={styles.userName}>{user?.name || ''}</Text>
                    <View style={styles.roleBadge}>
                        <Ionicons name="shield-checkmark" size={12} color={ACCENT} />
                        <Text style={styles.roleText}>Super Administrateur</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informations du profil</Text>

                    <Text style={styles.label}>Nom complet</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Votre nom"
                        placeholderTextColor="#94a3b8"
                    />

                    <Text style={styles.label}>Adresse e-mail</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="email@exemple.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor="#94a3b8"
                    />

                    <TouchableOpacity
                        style={[styles.btn, saving && styles.btnDisabled]}
                        onPress={handleSaveProfile}
                        disabled={saving}
                    >
                        {saving
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={styles.btnText}>Enregistrer</Text>
                        }
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Changer le mot de passe</Text>

                    <Text style={styles.label}>Mot de passe actuel</Text>
                    <View style={styles.pwdRow}>
                        <TextInput
                            style={[styles.input, { flex: 1, marginBottom: 0 }]}
                            value={currentPwd}
                            onChangeText={setCurrentPwd}
                            secureTextEntry={!showCurrent}
                            placeholder="••••••••"
                            placeholderTextColor="#94a3b8"
                        />
                        <TouchableOpacity onPress={() => setShowCurrent(v => !v)} style={styles.eyeBtn}>
                            <Ionicons name={showCurrent ? 'eye-off' : 'eye'} size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Nouveau mot de passe</Text>
                    <View style={styles.pwdRow}>
                        <TextInput
                            style={[styles.input, { flex: 1, marginBottom: 0 }]}
                            value={newPwd}
                            onChangeText={setNewPwd}
                            secureTextEntry={!showNew}
                            placeholder="••••••••"
                            placeholderTextColor="#94a3b8"
                        />
                        <TouchableOpacity onPress={() => setShowNew(v => !v)} style={styles.eyeBtn}>
                            <Ionicons name={showNew ? 'eye-off' : 'eye'} size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Confirmer le nouveau mot de passe</Text>
                    <View style={styles.pwdRow}>
                        <TextInput
                            style={[styles.input, { flex: 1, marginBottom: 0 }]}
                            value={confirmPwd}
                            onChangeText={setConfirmPwd}
                            secureTextEntry={!showConfirm}
                            placeholder="••••••••"
                            placeholderTextColor="#94a3b8"
                        />
                        <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn}>
                            <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.btn, styles.btnSecondary, changingPwd && styles.btnDisabled]}
                        onPress={handleChangePassword}
                        disabled={changingPwd}
                    >
                        {changingPwd
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={styles.btnText}>Modifier le mot de passe</Text>
                        }
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content:   { padding: 16, paddingBottom: 40 },

    avatarWrap: { alignItems: 'center', paddingVertical: 24 },
    avatar: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: PRIMARY,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 12,
    },
    avatarLetter: { fontSize: 34, fontWeight: '700', color: '#fff' },
    userName:     { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
    roleBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: '#f5f3ff', borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 5,
        borderWidth: 1, borderColor: '#ede9fe',
    },
    roleText: { fontSize: 12, fontWeight: '700', color: ACCENT },

    section: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 12 },
    input: {
        borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12,
        fontSize: 15, color: '#0f172a', backgroundColor: '#f8fafc', marginBottom: 4,
    },
    pwdRow: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: '#e2e8f0',
        borderRadius: 10, backgroundColor: '#f8fafc', marginBottom: 4,
    },
    eyeBtn: { paddingHorizontal: 12 },

    btn: {
        backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 14,
        alignItems: 'center', marginTop: 20,
    },
    btnSecondary: { backgroundColor: ACCENT },
    btnDisabled:  { opacity: 0.6 },
    btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
