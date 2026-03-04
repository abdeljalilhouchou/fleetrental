import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { renterLogin } from '../api';

export default function RenterLoginScreen({ navigation }) {
    const [email, setEmail]     = useState('');
    const [pin, setPin]         = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');

    const handleLogin = async () => {
        setError('');
        if (!email.trim() || !pin.trim()) {
            setError('Entrez votre email et votre PIN');
            return;
        }

        setLoading(true);
        try {
            await renterLogin(email.trim().toLowerCase(), pin.trim());
            navigation.replace('RenterDashboard');
        } catch (e) {
            setError(e.message || 'Email ou PIN incorrect');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoBox}>
                        <Text style={styles.logoText}>FR</Text>
                    </View>
                    <Text style={styles.title}>Espace Locataire</Text>
                    <Text style={styles.subtitle}>Connectez-vous avec vos identifiants de location</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="votre.email@example.com"
                        placeholderTextColor="#6b7280"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>PIN (6 chiffres)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="123456"
                        placeholderTextColor="#6b7280"
                        value={pin}
                        onChangeText={setPin}
                        keyboardType="numeric"
                        maxLength={6}
                        secureTextEntry
                    />

                    {error ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.btnText}>Se connecter</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
                        <Text style={styles.backLinkText}>← Retour à l'accueil</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.hint}>
                    Ces identifiants vous ont été remis lors de la création de votre location.
                </Text>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: '#0f172a' },
    inner:       { flex: 1, padding: 24, justifyContent: 'center' },

    header:      { alignItems: 'center', marginBottom: 36 },
    logoBox:     { width: 64, height: 64, borderRadius: 20, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    logoText:    { color: '#fff', fontSize: 22, fontWeight: '900' },
    title:       { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 6 },
    subtitle:    { fontSize: 13, color: '#94a3b8', textAlign: 'center' },

    form:        { gap: 12 },
    label:       { fontSize: 13, fontWeight: '600', color: '#cbd5e1' },
    input:       {
        backgroundColor: '#1e293b', color: '#f1f5f9', borderRadius: 14,
        paddingHorizontal: 16, paddingVertical: 14, fontSize: 15,
        borderWidth: 1.5, borderColor: '#334155',
    },

    errorBox:    { backgroundColor: '#450a0a', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#991b1b' },
    errorText:   { color: '#fca5a5', fontSize: 13 },

    btn:         { backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    btnDisabled: { opacity: 0.6 },
    btnText:     { color: '#fff', fontWeight: '700', fontSize: 16 },

    backLink:    { alignItems: 'center', marginTop: 12 },
    backLinkText:{ color: '#60a5fa', fontSize: 14 },

    hint:        { color: '#475569', fontSize: 12, textAlign: 'center', marginTop: 32, lineHeight: 18 },
});
