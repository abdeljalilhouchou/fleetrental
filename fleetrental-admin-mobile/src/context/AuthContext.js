import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminLogout, getStoredToken, getMe } from '../api';

const TOKEN_KEY = 'admin_token';

export const AuthContext = createContext({
    token:         null,
    user:          null,
    permissions:   [],
    isLoading:     true,
    signIn:        () => {},
    signOut:       () => {},
    setUser:       () => {},
    hasPermission: () => false,
});

export function AuthProvider({ children }) {
    const [token,       setToken]       = useState(null);
    const [user,        setUser]        = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [isLoading,   setIsLoading]   = useState(true);

    // Au démarrage : restaurer la session
    useEffect(() => {
        (async () => {
            try {
                const stored = await getStoredToken();
                if (stored) {
                    const me = await getMe();
                    setToken(stored);
                    setUser(me);
                    setPermissions(me.permissions || []);
                }
            } catch (_) {
                await AsyncStorage.removeItem(TOKEN_KEY);
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const signIn = (newToken, userData, perms = []) => {
        setToken(newToken);
        setUser(userData);
        setPermissions(perms);
    };

    const signOut = async () => {
        await adminLogout();
        setToken(null);
        setUser(null);
        setPermissions([]);
    };

    // Admins ont accès à tout ; les autres vérifient la liste de permissions
    const hasPermission = (name) => {
        const role = user?.role;
        if (role === 'super_admin' || role === 'company_admin') return true;
        return permissions.includes(name);
    };

    return (
        <AuthContext.Provider value={{
            token, user, permissions, isLoading,
            signIn, signOut, setUser, hasPermission,
        }}>
            {children}
        </AuthContext.Provider>
    );
}
