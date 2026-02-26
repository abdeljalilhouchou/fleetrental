'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '../context/DataContext';

/**
 * RoleProtector - Composant pour protéger les pages selon le rôle ET les permissions
 *
 * @param {array}  allowedRoles       - Rôles autorisés à voir cette page
 * @param {string} requiredPermission - Permission view_* requise (optionnel)
 * @param {string} redirectTo         - Où rediriger si l'accès est refusé (optionnel)
 * @param {ReactNode} children        - Contenu de la page
 */
export default function RoleProtector({ allowedRoles, requiredPermission, redirectTo = null, children }) {
    const { user, loading, hasPermission } = useData();
    const router = useRouter();

    const getDefaultRedirect = (role) => ({
        super_admin:   '/super-admin/dashboard',
        company_admin: '/dashboard',
    }[role] || '/dashboard');

    useEffect(() => {
        if (loading) return;
        if (!user) return;

        // Vérifier le rôle
        if (!allowedRoles.includes(user.role)) {
            router.push(redirectTo || getDefaultRedirect(user.role));
            return;
        }

        // Vérifier la permission de vue (si spécifiée)
        if (requiredPermission && !hasPermission(requiredPermission)) {
            router.push(redirectTo || getDefaultRedirect(user.role));
        }
    }, [user, loading, hasPermission, allowedRoles, requiredPermission, redirectTo, router]);

    if (loading || !user) return null;

    if (!allowedRoles.includes(user.role)) return null;

    if (requiredPermission && !hasPermission(requiredPermission)) return null;

    return <>{children}</>;
}
