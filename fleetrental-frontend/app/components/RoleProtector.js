'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '../../lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * RoleProtector - Composant pour protéger les pages selon le rôle
 * 
 * @param {array} allowedRoles - Rôles autorisés à voir cette page
 * @param {string} redirectTo - Où rediriger si l'accès est refusé (optionnel)
 * @param {ReactNode} children - Contenu de la page
 */
export default function RoleProtector({ allowedRoles, redirectTo = null, children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAccess = async () => {
            const token = getToken();
            
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                const res = await fetch(`${API_URL}/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                });

                if (!res.ok) {
                    router.push('/login');
                    return;
                }

                const userData = await res.json();
                setUser(userData);

                // Vérifier si le rôle est autorisé
                if (!allowedRoles.includes(userData.role)) {
                    // Rediriger selon le rôle si pas d'accès
                    if (redirectTo) {
                        router.push(redirectTo);
                    } else {
                        // Redirection par défaut selon le rôle
                        const defaultRedirect = {
                            super_admin: '/companies',
                            company_admin: '/dashboard',
                            employee: '/vehicles',
                        }[userData.role] || '/dashboard';
                        
                        router.push(defaultRedirect);
                    }
                }
            } catch (e) {
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        checkAccess();
    }, [allowedRoles, redirectTo, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-gray-400">Vérification des accès...</div>
            </div>
        );
    }

    // Si l'utilisateur n'a pas le bon rôle, on affiche rien (la redirection est en cours)
    if (!user || !allowedRoles.includes(user.role)) {
        return null;
    }

    // L'utilisateur a le bon rôle, on affiche le contenu
    return <>{children}</>;
}
