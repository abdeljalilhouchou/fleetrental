'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '../context/DataContext';

/**
 * RoleProtector - Composant pour protéger les pages selon le rôle
 * Utilise les données du DataContext pour éviter les rechargements
 *
 * @param {array} allowedRoles - Rôles autorisés à voir cette page
 * @param {string} redirectTo - Où rediriger si l'accès est refusé (optionnel)
 * @param {ReactNode} children - Contenu de la page
 */
export default function RoleProtector({ allowedRoles, redirectTo = null, children }) {
    const { user, loading } = useData();
    const router = useRouter();

    useEffect(() => {
        // Attendre que le chargement soit terminé
        if (loading) return;

        // Si pas d'utilisateur, le DataContext redirige déjà vers login
        if (!user) return;

        // Vérifier si le rôle est autorisé
        if (!allowedRoles.includes(user.role)) {
            // Rediriger selon le rôle si pas d'accès
            if (redirectTo) {
                router.push(redirectTo);
            } else {
                // Redirection par défaut selon le rôle
                const defaultRedirect = {
                    super_admin: '/super-admin/dashboard',
                    company_admin: '/dashboard',
                    employee: '/vehicles',
                }[user.role] || '/dashboard';

                router.push(defaultRedirect);
            }
        }
    }, [user, loading, allowedRoles, redirectTo, router]);

    // Pendant le chargement initial (première visite), ne rien afficher
    // Le DataContext gère déjà l'affichage de chargement global
    if (loading) {
        return null;
    }

    // Si pas d'utilisateur, ne rien afficher (redirection en cours par DataContext)
    if (!user) {
        return null;
    }

    // Si l'utilisateur n'a pas le bon rôle, ne rien afficher (redirection en cours)
    if (!allowedRoles.includes(user.role)) {
        return null;
    }

    // L'utilisateur a le bon rôle, on affiche le contenu
    return <>{children}</>;
}
