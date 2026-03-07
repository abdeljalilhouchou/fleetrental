import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://fleetrental-production.up.railway.app/api';
const TOKEN_KEY = 'admin_token';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function request(path, options = {}) {
    const token = await AsyncStorage.getItem(TOKEN_KEY);

    const res = await fetch(`${BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
        ...options,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.message || `Erreur ${res.status}`);
    }

    return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function adminLogin(email, password) {
    const data = await request('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    if (data.token) {
        await AsyncStorage.setItem(TOKEN_KEY, data.token);
    }
    return data; // { token, user, permissions }
}

export async function adminLogout() {
    try {
        await request('/logout', { method: 'POST' });
    } catch (_) {}
    await AsyncStorage.removeItem(TOKEN_KEY);
}

export const getStoredToken = () => AsyncStorage.getItem(TOKEN_KEY);

export async function getMe() {
    return request('/me');
}

// ── Véhicules ─────────────────────────────────────────────────────────────────

export const getVehicles = () => request('/vehicles');

export const createVehicle = (data) =>
    request('/vehicles', { method: 'POST', body: JSON.stringify(data) });

export const updateVehicle = (id, data) =>
    request(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteVehicle = (id) =>
    request(`/vehicles/${id}`, { method: 'DELETE' });

export const updateVehicleStatus = (id, status) =>
    request(`/vehicles/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });

// ── Locations ─────────────────────────────────────────────────────────────────

export const getRentals = () => request('/rentals');

export const createRental = (data) =>
    request('/rentals', { method: 'POST', body: JSON.stringify(data) });

export const updateRental = (id, data) =>
    request(`/rentals/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteRental = (id) =>
    request(`/rentals/${id}`, { method: 'DELETE' });

export const completeRental = (id, data) =>
    request(`/rentals/${id}/complete`, { method: 'POST', body: JSON.stringify(data) });

export const cancelRental = (id) =>
    request(`/rentals/${id}/cancel`, { method: 'POST' });

// ── Maintenances ──────────────────────────────────────────────────────────────

export const getMaintenances = () => request('/maintenances');

export const createMaintenance = (data) =>
    request('/maintenances', { method: 'POST', body: JSON.stringify(data) });

export const updateMaintenance = (id, data) =>
    request(`/maintenances/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const completeMaintenance = (id) =>
    request(`/maintenances/${id}/complete`, { method: 'POST' });

export const deleteMaintenance = (id) =>
    request(`/maintenances/${id}`, { method: 'DELETE' });

// ── Profil ────────────────────────────────────────────────────────────────────

export const updateProfile = (data) =>
    request('/profile', { method: 'PUT', body: JSON.stringify(data) });

export const changePassword = (data) =>
    request('/profile/password', { method: 'PUT', body: JSON.stringify(data) });

// ── Utilisateurs ──────────────────────────────────────────────────────────────

export const getUsers = () => request('/users');

export const updateUserRole = (id, role) =>
    request(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });

export const updateUserPermissions = (id, permissions) =>
    request(`/users/${id}/permissions`, { method: 'PUT', body: JSON.stringify({ permissions }) });
