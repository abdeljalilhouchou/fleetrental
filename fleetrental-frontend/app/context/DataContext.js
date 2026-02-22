'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToken } from '../../lib/api';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const DataContext = createContext();

export function DataProvider({ children }) {
    const [user, setUser] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [maintenances, setMaintenances] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [rentals, setRentals] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [superAdminStats, setSuperAdminStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const headers = () => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
    });

    const loadUser = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/me`, { headers: headers() });
            if (res.status === 401) {
                router.push('/login');
                return null;
            }
            if (res.ok) {
                const userData = await res.json();
                setUser(userData);
                // Persist theme to localStorage for instant theme on next page load
                if (typeof window !== 'undefined') {
                    localStorage.setItem('theme', userData.theme || 'dark');
                }
                return userData;
            }
        } catch (e) {
            console.error('Error loading user:', e);
        }
        return null;
    }, [router]);

    const loadVehicles = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/vehicles`, { headers: headers() });
            if (res.ok) {
                const data = await res.json();
                setVehicles(data);
                return data;
            }
        } catch (e) {
            console.error('Error loading vehicles:', e);
        }
        return [];
    }, []);

    const loadMaintenances = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/maintenances`, { headers: headers() });
            if (res.ok) {
                const data = await res.json();
                setMaintenances(data);
                return data;
            }
        } catch (e) {
            console.error('Error loading maintenances:', e);
        }
        return [];
    }, []);

    const loadReminders = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/reminders`, { headers: headers() });
            if (res.ok) {
                const data = await res.json();
                setReminders(data);
                return data;
            }
        } catch (e) {
            console.error('Error loading reminders:', e);
        }
        return [];
    }, []);

    const loadRentals = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/rentals`, { headers: headers() });
            if (res.ok) {
                const data = await res.json();
                setRentals(data);
                return data;
            }
        } catch (e) {
            console.error('Error loading rentals:', e);
        }
        return [];
    }, []);

    const loadCompanies = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/companies`, { headers: headers() });
            if (res.ok) {
                const data = await res.json();
                setCompanies(data);
                return data;
            }
        } catch (e) {
            console.error('Error loading companies:', e);
        }
        return [];
    }, []);

    const loadUsers = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/users`, { headers: headers() });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
                return data;
            }
        } catch (e) {
            console.error('Error loading users:', e);
        }
        return [];
    }, []);

    const loadStats = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/stats`, { headers: headers() });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
                return data;
            }
        } catch (e) {
            console.error('Error loading stats:', e);
        }
        return null;
    }, []);

    const loadSuperAdminStats = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/super-admin/stats`, { headers: headers() });
            if (res.ok) {
                const data = await res.json();
                setSuperAdminStats(data);
                return data;
            }
        } catch (e) {
            console.error('Error loading super-admin stats:', e);
        }
        return null;
    }, []);

    useEffect(() => {
        const initData = async () => {
            const token = getToken();
            if (!token) {
                router.push('/login');
                return;
            }

            setLoading(true);
            const userData = await loadUser();

            if (userData) {
                // Charger les données communes
                await Promise.all([
                    loadVehicles(),
                    loadMaintenances(),
                    loadReminders(),
                    loadRentals(),
                ]);

                // Charger les données selon le rôle
                if (userData.role === 'super_admin') {
                    await Promise.all([
                        loadCompanies(),
                        loadSuperAdminStats(),
                    ]);
                }

                if (userData.role === 'super_admin' || userData.role === 'company_admin') {
                    await Promise.all([
                        loadUsers(),
                        loadStats(),
                    ]);
                }
            }

            setLoading(false);
        };

        initData();
    }, [router, loadUser, loadVehicles, loadMaintenances, loadReminders, loadRentals, loadCompanies, loadUsers, loadStats, loadSuperAdminStats]);

    const refresh = useCallback(async (resource) => {
        switch (resource) {
            case 'user':
                return await loadUser();
            case 'vehicles':
                return await loadVehicles();
            case 'maintenances':
                return await loadMaintenances();
            case 'reminders':
                return await loadReminders();
            case 'rentals':
                return await loadRentals();
            case 'companies':
                return await loadCompanies();
            case 'users':
                return await loadUsers();
            case 'stats':
                return await loadStats();
            case 'superAdminStats':
                return await loadSuperAdminStats();
            case 'all':
                await Promise.all([
                    loadVehicles(),
                    loadMaintenances(),
                    loadReminders(),
                    loadRentals(),
                ]);
                if (user?.role === 'super_admin') {
                    await Promise.all([loadCompanies(), loadSuperAdminStats()]);
                }
                if (user?.role === 'super_admin' || user?.role === 'company_admin') {
                    await Promise.all([loadUsers(), loadStats()]);
                }
                break;
            default:
                console.warn(`Unknown resource: ${resource}`);
        }
    }, [user, loadUser, loadVehicles, loadMaintenances, loadReminders, loadRentals, loadCompanies, loadUsers, loadStats, loadSuperAdminStats]);

    const value = {
        user,
        vehicles,
        maintenances,
        reminders,
        rentals,
        companies,
        users,
        stats,
        loading,
        refresh,
        refreshVehicles: () => refresh('vehicles'),
        refreshMaintenances: () => refresh('maintenances'),
        refreshReminders: () => refresh('reminders'),
        refreshRentals: () => refresh('rentals'),
        refreshCompanies: () => refresh('companies'),
        refreshUsers: () => refresh('users'),
        refreshStats: () => refresh('stats'),
        superAdminStats,
        refreshSuperAdminStats: () => refresh('superAdminStats'),
        refreshAll: () => refresh('all'),
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
