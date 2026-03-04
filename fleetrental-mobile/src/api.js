// URL de l'API backend (Railway)
const API_URL = 'https://fleetrental-production.up.railway.app/api/public';

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

// Liste des entreprises
export const getCompanies = () => request('/companies');

// Véhicules disponibles d'une entreprise
export const getCompanyVehicles = (companyId) =>
    request(`/companies/${companyId}/vehicles`);

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

// ── GPS Tracking ──────────────────────────────────────────────────────────────
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
