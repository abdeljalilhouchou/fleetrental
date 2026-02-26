const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Construire l'URL d'un fichier stocké (avatar, photo véhicule, etc.)
export function storageUrl(path) {
    if (!path) return null;
    const base = API_URL.replace(/\/api\/?$/, '');
    return `${base}/storage/${path}`;
}

// LOGIN
export async function login(email, password, rememberMe = false) {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password, remember_me: rememberMe }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Erreur de connexion');
    }

    // Durée du cookie : 30 jours si "se souvenir", sinon 24h
    const maxAge = data.expires_in || (rememberMe ? 30 * 24 * 3600 : 24 * 3600);
    document.cookie = `token=${data.token}; path=/; max-age=${maxAge}; SameSite=Strict`;

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

// ─── Notifications ───────────────────────────────────────────
export async function getNotifications() {
    return apiRequest('/notifications');
}

export async function getUnreadCount() {
    return apiRequest('/notifications/unread-count');
}

export async function markNotificationRead(id) {
    return apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead() {
    return apiRequest('/notifications/read-all', { method: 'POST' });
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

// ═══════════════════════════════════════════════════════════
// ROLES & PERMISSIONS API (super_admin uniquement)
// ═══════════════════════════════════════════════════════════

export async function getRoles() {
    return apiRequest('/roles');
}

export async function getAllPermissions() {
    return apiRequest('/permissions');
}

export async function updateRolePermissions(roleId, permissions) {
    return apiRequest(`/roles/${roleId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissions }),
    });
}

export async function getUserPermissions(userId) {
    return apiRequest(`/users/${userId}/permissions`);
}

export async function updateUserPermissions(userId, overrides) {
    return apiRequest(`/users/${userId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ overrides }),
    });
}

// ═══════════════════════════════════════════════════════════
// LOCATIONS - PDF & CSV
// ═══════════════════════════════════════════════════════════

// Télécharger le contrat PDF d'une location
export async function downloadRentalContract(id) {
    const token = getToken();
    const response = await fetch(`${API_URL}/rentals/${id}/contract`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/pdf',
        },
    });

    if (response.status === 401) {
        document.cookie = 'token=; path=/; max-age=0';
        window.location.href = '/login';
        throw new Error('Non authentifié');
    }

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Erreur lors du téléchargement du contrat');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contrat-location-${String(id).padStart(6, '0')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Exporter les locations en CSV
export async function exportRentalsCSV(status = 'all') {
    const token = getToken();
    const params = status && status !== 'all' ? `?status=${status}` : '';
    const response = await fetch(`${API_URL}/rentals/export${params}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (response.status === 401) {
        document.cookie = 'token=; path=/; max-age=0';
        window.location.href = '/login';
        throw new Error('Non authentifié');
    }

    if (!response.ok) {
        throw new Error('Erreur lors de l\'export CSV');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `locations-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
