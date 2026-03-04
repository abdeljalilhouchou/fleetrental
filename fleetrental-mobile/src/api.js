import AsyncStorage from '@react-native-async-storage/async-storage';

// URL de l'API backend (Railway)
const API_URL      = 'https://fleetrental-production.up.railway.app/api/public';
const API_AUTH_URL = 'https://fleetrental-production.up.railway.app/api';

async function request(path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers,
        },
        ...options,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.message || 'Erreur serveur');
    }

    return data;
}

// Requête authentifiée (avec token Sanctum)
async function authRequest(path, options = {}) {
    const token = await AsyncStorage.getItem('renter_token');
    const res = await fetch(`${API_AUTH_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        },
        ...options,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.message || 'Erreur serveur');
    }

    return data;
}

// Liste des entreprises
export const getCompanies = () => request('/companies');

// Véhicules disponibles d'une entreprise (clients)
export const getCompanyVehicles = (companyId) =>
    request(`/companies/${companyId}/vehicles`);

// Véhicules loués d'une entreprise (pour mode chauffeur GPS)
export const getRentedVehicles = (companyId) =>
    request(`/companies/${companyId}/vehicles?status=rented`);

// Détail d'un véhicule
export const getVehicle = (vehicleId) =>
    request(`/vehicles/${vehicleId}`);

// Créer une réservation
export const createReservation = (data) =>
    request('/reservations', {
        method: 'POST',
        body: JSON.stringify(data),
    });

// Suivre une réservation par référence
export const trackReservation = (reference) =>
    request(`/reservations/${reference}`);

// Dates bloquées d'un véhicule (réservations pending/confirmed)
export const getBlockedDates = (vehicleId) =>
    request(`/vehicles/${vehicleId}/blocked-dates`);

// ── GPS Tracking (mode chauffeur anonyme) ─────────────────────────────────────
const GPS_KEY = 'fleetrental_gps_2026';

export const sendLocation = (vehicleId, latitude, longitude, speed, driverName) =>
    request(`/vehicles/${vehicleId}/location`, {
        method: 'POST',
        body: JSON.stringify({ latitude, longitude, speed, driver_name: driverName, api_key: GPS_KEY }),
    });

export const stopTracking = (vehicleId) =>
    request(`/vehicles/${vehicleId}/location/stop`, {
        method: 'POST',
        body: JSON.stringify({ api_key: GPS_KEY }),
    });

// ── Auth locataire ────────────────────────────────────────────────────────────
export const renterLogin = async (email, pin) => {
    const data = await authRequest('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pin }),
    });
    if (data.token) {
        await AsyncStorage.setItem('renter_token', data.token);
    }
    return data;
};

export const renterLogout = async () => {
    await AsyncStorage.removeItem('renter_token');
};

export const getRenterToken = () => AsyncStorage.getItem('renter_token');

// ── Locataire — location active + GPS authentifié ────────────────────────────
export const getMyRental  = () => authRequest('/renter/my-rental');

export const sendRenterLocation = (latitude, longitude, speed) =>
    authRequest('/renter/location', {
        method: 'POST',
        body: JSON.stringify({ latitude, longitude, speed }),
    });

export const stopRenterTracking = () =>
    authRequest('/renter/location/stop', { method: 'POST' });
