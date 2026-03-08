import React, { useState, useContext } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, KeyboardAvoidingView, Platform,
    ScrollView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminLogin } from '../../api';
import { AuthContext } from '../../context/AuthContext';

const PRIMARY = '#4c1d95';
const ACCENT  = '#7c3aed';

export default function LoginScreen() {
    const { signIn } = useContext(AuthContext);
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState('');

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            setError('Veuillez remplir tous les champs.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const data = await adminLogin(email.trim(), password);
            if (data.user?.role !== 'super_admin') {
                setError('Accès refusé : compte super admin requis.');
                return;
            }
            signIn(data.token, data.user);
        } catch (e) {
            setError(e.message || 'Identifiants incorrects.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                {/* Hero */}
                <View style={styles.hero}>
                    <View style={styles.heroIcon}>
                        <Ionicons name="shield-checkmark" size={42} color="#fff" />
                    </View>
                    <Text style={styles.heroTitle}>FleetRental</Text>
                    <Text style={styles.heroSub}>Super Administration</Text>
                </View>

                {/* Formulaire */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Connexion Super Admin</Text>
                    <Text style={styles.cardSub}>Accès réservé aux super administrateurs</Text>

                    {error ? (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle" size={16} color="#dc2626" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={styles.fieldWrap}>
                        <Text style={styles.label}>Adresse e-mail</Text>
                        <View style={styles.inputRow}>
                            <Ionicons name="mail-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="superadmin@fleetrental.com"
                                placeholderTextColor="#94a3b8"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                    </View>

                    <View style={styles.fieldWrap}>
                        <Text style={styles.label}>Mot de passe</Text>
                        <View style={styles.inputRow}>
                            <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="••••••••"
                                placeholderTextColor="#94a3b8"
                                secureTextEntry={!showPass}
                            />
                            <TouchableOpacity onPress={() => setShowPass(p => !p)} style={styles.eyeBtn}>
                                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
                                <Text style={styles.btnText}>Accéder au panneau</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.footer}>Accès sécurisé — FleetRental Super Admin</Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root:   { flex: 1, backgroundColor: PRIMARY },
    scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },

    hero: { alignItems: 'center', marginBottom: 32 },
    heroIcon: {
        width: 80, height: 80, borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    },
    heroTitle: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
    heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4, letterSpacing: 0.5 },

    card: {
        backgroundColor: '#fff', borderRadius: 24, padding: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15, shadowRadius: 24, elevation: 8,
    },
    cardTitle: { fontSize: 20, fontWeight: '800', color: PRIMARY, marginBottom: 4 },
    cardSub:   { fontSize: 12, color: '#94a3b8', marginBottom: 20 },

    errorBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#fef2f2', borderRadius: 10,
        padding: 12, marginBottom: 16,
        borderWidth: 1, borderColor: '#fecaca',
    },
    errorText: { flex: 1, color: '#dc2626', fontSize: 13 },

    fieldWrap: { marginBottom: 16 },
    label:     { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#f8fafc', borderRadius: 12,
        borderWidth: 1, borderColor: '#e2e8f0',
        paddingHorizontal: 14, paddingVertical: 12,
    },
    inputIcon: { marginRight: 10 },
    input:     { flex: 1, fontSize: 15, color: '#0f172a' },
    eyeBtn:    { padding: 4 },

    btn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 15, marginTop: 8,
        shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
    },
    btnDisabled: { opacity: 0.6 },
    btnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },

    footer: { textAlign: 'center', marginTop: 28, fontSize: 12, color: 'rgba(255,255,255,0.45)' },
});
