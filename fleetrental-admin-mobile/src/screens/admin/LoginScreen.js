import React, { useState, useContext } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, KeyboardAvoidingView, Platform,
    ScrollView, StatusBar, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminLogin } from '../../api';
import { AuthContext } from '../../context/AuthContext';

export default function LoginScreen() {
    const { signIn } = useContext(AuthContext);
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            setError('Veuillez remplir tous les champs.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const data = await adminLogin(email.trim(), password);
            signIn(data.token, data.user, data.permissions || []);
        } catch (e) {
            setError(e.message || 'Identifiants incorrects.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                {/* Logo */}
                <View style={styles.logoWrap}>
                    <Image
                        source={require('../../../assets/icon.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.logoSub}>Accès à votre espace de travail</Text>
                </View>

                {/* Formulaire */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Connexion</Text>

                    {error ? (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle" size={16} color="#dc2626" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {/* Email */}
                    <View style={styles.fieldWrap}>
                        <Text style={styles.label}>Adresse e-mail</Text>
                        <View style={styles.inputRow}>
                            <Ionicons name="mail-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="admin@example.com"
                                placeholderTextColor="#94a3b8"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                    </View>

                    {/* Mot de passe */}
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

                    {/* Bouton connexion */}
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
                                <Ionicons name="log-in-outline" size={20} color="#fff" />
                                <Text style={styles.btnText}>Se connecter</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.footer}>
                    Connexion sécurisée — FleetRental
                </Text>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root:   { flex: 1, backgroundColor: '#f8fafc' },
    scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },

    // Logo
    logoWrap:  { alignItems: 'center', marginBottom: 36 },
    logoImage: { width: 240, height: 100, marginBottom: 12 },
    logoSub:   { fontSize: 13, color: '#64748b', letterSpacing: 0.5 },

    // Card
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#1e3a5f',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },
    cardTitle: { fontSize: 20, fontWeight: '800', color: '#1e3a5f', marginBottom: 20 },

    // Error
    errorBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#fef2f2', borderRadius: 10,
        padding: 12, marginBottom: 16,
        borderWidth: 1, borderColor: '#fecaca',
    },
    errorText: { flex: 1, color: '#dc2626', fontSize: 13 },

    // Fields
    fieldWrap: { marginBottom: 16 },
    label:     { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
        paddingHorizontal: 14, paddingVertical: 12,
    },
    inputIcon: { marginRight: 10 },
    input:     { flex: 1, fontSize: 15, color: '#0f172a' },
    eyeBtn:    { padding: 4 },

    // Button
    btn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#1e3a5f',
        borderRadius: 14, paddingVertical: 15,
        marginTop: 8,
        shadowColor: '#1e3a5f', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
    },
    btnDisabled: { opacity: 0.6 },
    btnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },

    footer: {
        textAlign: 'center', marginTop: 28,
        fontSize: 12, color: '#94a3b8',
    },
});
