import React, { createContext, useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminLogout, getStoredToken, getMe } from '../api';

const TOKEN_KEY = 'superadmin_token';

export const AuthContext = createContext({
    token:       null,
    user:        null,
    isLoading:   true,
    signIn:      () => {},
    signOut:     () => {},
    setUser:     () => {},
});

export function AuthProvider({ children }) {
    const [token,     setToken]     = useState(null);
    const [user,      setUser]      = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const tokenRef = useRef(null);

    const refreshUser = async () => {
        if (!tokenRef.current) return;
        try {
            const me = await getMe();
            setUser(me);
        } catch (_) {}
    };

    useEffect(() => {
        (async () => {
            try {
                const stored = await getStoredToken();
                if (stored) {
                    tokenRef.current = stored;
                    const me = await getMe();
                    // Vérifier que c'est bien un super admin
                    if (me.role !== 'super_admin') {
                        await AsyncStorage.removeItem(TOKEN_KEY);
                    } else {
                        setToken(stored);
                        setUser(me);
                    }
                }
            } catch (_) {
                await AsyncStorage.removeItem(TOKEN_KEY);
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active') refreshUser();
        });
        return () => sub.remove();
    }, []);

    const signIn = (newToken, userData) => {
        tokenRef.current = newToken;
        setToken(newToken);
        setUser(userData);
    };

    const signOut = async () => {
        tokenRef.current = null;
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
