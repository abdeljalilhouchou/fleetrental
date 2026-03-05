# Fonctionnalités désactivées — Comment les réactiver

## 1. Suivi GPS en temps réel

### Où c'est désactivé
Fichier : `fleetrental-frontend/app/components/Sidebar.js`

Chercher les lignes commentées :
```js
// { icon: MapPin, label: 'Suivi GPS', path: '/gps' },
```
Ces lignes existent pour les rôles : `company_admin` et `fleet_manager`.

### Comment réactiver
1. Ouvrir `fleetrental-frontend/app/components/Sidebar.js`
2. Pour chaque rôle souhaité, **décommenter** la ligne (retirer les `//`) :
   ```js
   { icon: MapPin, label: 'Suivi GPS', path: '/gps' },
   ```
3. Réajouter l'import `MapPin` dans la ligne d'import lucide-react :
   ```js
   import { ..., MapPin } from 'lucide-react';
   ```
4. Sauvegarder → Vercel redéploie automatiquement

### La page GPS existe déjà
La page `fleetrental-frontend/app/(main)/gps/page.js` est déjà présente et fonctionnelle.
Le backend Laravel gère déjà les routes `/api/gps/vehicles` et `/api/renter/location`.

---

## 2. Réservations

### Où c'est désactivé
Fichier : `fleetrental-frontend/app/components/Sidebar.js`

Chercher les lignes commentées :
```js
// { icon: CalendarCheck, label: 'Réservations', path: '/reservations' },
```
Ces lignes existent pour les rôles : `company_admin`, `fleet_manager`, `rental_agent`.

### Comment réactiver
1. Ouvrir `fleetrental-frontend/app/components/Sidebar.js`
2. Pour chaque rôle souhaité, **décommenter** la ligne :
   ```js
   { icon: CalendarCheck, label: 'Réservations', path: '/reservations' },
   ```
3. Réajouter l'import `CalendarCheck` dans la ligne d'import lucide-react :
   ```js
   import { ..., CalendarCheck } from 'lucide-react';
   ```
4. Sauvegarder → Vercel redéploie automatiquement

### La page Réservations existe déjà
La page `fleetrental-frontend/app/(main)/reservations/page.js` est déjà présente.
Le backend gère déjà toutes les routes `/api/reservations`.

---

## Résumé rapide

| Fonctionnalité | Fichier | Chercher | Action |
|---|---|---|---|
| Suivi GPS | `Sidebar.js` | `// { icon: MapPin` | Décommenter + réajouter import `MapPin` |
| Réservations | `Sidebar.js` | `// { icon: CalendarCheck` | Décommenter + réajouter import `CalendarCheck` |

> Aucune modification backend nécessaire — tout est déjà en place.
