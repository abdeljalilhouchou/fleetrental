const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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
