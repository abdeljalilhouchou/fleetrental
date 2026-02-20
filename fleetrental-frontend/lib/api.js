const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Construire l'URL d'un fichier stocké (avatar, photo véhicule, etc.)
export function storageUrl(path) {
    if (!path) return null;
    const base = API_URL.replace(/\/api\/?$/, '');
    return `${base}/storage/${path}`;
}

// LOGIN
export async function login(email, password) {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Erreur de connexion');
    }

    // Sauvegarder le token dans un cookie
    document.cookie = `token=${data.token}; path=/; max-age=86400`;

    return data;
}

// LOGOUT
export async function logout() {
    const token = getToken();

    if (token) {
        await fetch(`${API_URL}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
    }

    // Supprimer le token
    document.cookie = 'token=; path=/; max-age=0';
    window.location.href = '/login';
}

// RÉCUPÉRER LE TOKEN DU COOKIE
export function getToken() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'token') return value;
    }
    return null;
}

// REQUÊTE API GÉNÉRIQUE (avec token automatique)
export async function apiRequest(url, options = {}) {
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers,
    });

    // Si non authentifié, rediriger vers login
    if (response.status === 401) {
        document.cookie = 'token=; path=/; max-age=0';
        window.location.href = '/login';
        throw new Error('Non authentifié');
    }

    return response.json();
}

// ═══════════════════════════════════════════════════════════
// PROFILE API
// ═══════════════════════════════════════════════════════════

// Mise à jour du profil (nom, téléphone, adresse, date de naissance)
export async function updateProfile(data) {
    return apiRequest('/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

// Mise à jour de l'avatar
export async function updateAvatar(file) {
    const token = getToken();
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${API_URL}/profile/avatar`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
        body: formData,
    });

    if (response.status === 401) {
        document.cookie = 'token=; path=/; max-age=0';
        window.location.href = '/login';
        throw new Error('Non authentifié');
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Erreur lors du téléchargement');
    }

    return data;
}

// Suppression de l'avatar
export async function removeAvatar() {
    return apiRequest('/profile/avatar', {
        method: 'DELETE',
    });
}

// Mise à jour des préférences (thème, langue, notifications)
export async function updatePreferences(data) {
    return apiRequest('/profile/preferences', {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

// Changement de mot de passe
export async function updatePassword(data) {
    return apiRequest('/profile/password', {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}
