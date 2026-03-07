import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminLogout, getStoredToken, getMe } from '../api';

const TOKEN_KEY = 'admin_token';

export const AuthContext = createContext({
    token:    null,
    user:     null,
    isLoading: true,
    signIn:   () => {},
    signOut:  () => {},
    setUser:  () => {},
});

export function AuthProvider({ children }) {
    const [token,     setToken]     = useState(null);
    const [user,      setUser]      = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Au démarrage : vérifier si un token est stocké
    useEffect(() => {
        (async () => {
            try {
                const stored = await getStoredToken();
                if (stored) {
                    // Vérifier le token en récupérant le profil
                    const me = await getMe();
                    setToken(stored);
                    setUser(me);
                }
            } catch (_) {
                // Token expiré ou invalide : le supprimer
                await AsyncStorage.removeItem(TOKEN_KEY);
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const signIn = (newToken, userData) => {
        setToken(newToken);
        setUser(userData);
    };

    const signOut = async () => {
        await adminLogout();
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ token, user, isLoading, signIn, signOut, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}
