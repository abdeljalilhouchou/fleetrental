# 🚗 FleetRental - Gestion de Flotte Automobile

Application SaaS multi-tenant de gestion de flotte automobile avec Laravel 12 et Next.js 16.

## 🎯 Fonctionnalités

### ✅ Gestion des véhicules
- CRUD complet des véhicules
- Statuts : Disponible, Louée, En maintenance, Hors service
- Historique de kilométrage
- Photos et documents

### ✅ Gestion des maintenances
- Planification et suivi des maintenances
- Types : Vidange, Freins, Pneus, Batterie, etc.
- Upload de factures et photos
- Calcul des coûts automatique
- Statuts : En cours, Terminée

### ✅ Rappels de maintenance
- Rappels automatiques par kilométrage
- Rappels automatiques par date
- Renouvellement intelligent
- Notifications visuelles

### ✅ Système multi-tenant
- Gestion de plusieurs entreprises
- Isolation complète des données
- Dashboard super admin

### ✅ Gestion des rôles
- **Super Admin** : Gère toutes les entreprises
- **Company Admin** : Gère son entreprise
- **Employee** : Opérations quotidiennes (maintenances, statuts)

### ✅ Statistiques
- Dashboard avec KPIs
- Graphiques de coûts
- Analyse par véhicule
- Statistiques globales (super admin)

## 🛠️ Technologies

### Backend
- **Laravel 12** (PHP 8.3)
- **PostgreSQL** 
- **Laravel Sanctum** (Authentication)
- **Storage** pour fichiers

### Frontend
- **Next.js 16** (React)
- **Tailwind CSS**
- **Lucide Icons**
- **Context API** pour le cache

## 📦 Installation

### Prérequis
- PHP 8.3+
- Composer
- Node.js 18+
- PostgreSQL
- Git

### Backend (Laravel)

```bash
cd fleetrental-backend

# Installer les dépendances
composer install

# Copier .env
cp .env.example .env

# Configurer la base de données dans .env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=fleetrental
DB_USERNAME=postgres
DB_PASSWORD=votre_mot_de_passe

# Générer la clé
php artisan key:generate

# Migrations
php artisan migrate

# Créer un super admin (optionnel)
php artisan db:seed

# Lancer le serveur
php artisan serve
```

### Frontend (Next.js)

```bash
cd fleetrental-frontend

# Installer les dépendances
npm install

# Configurer l'API
# Créer .env.local :
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Lancer le serveur
npm run dev
```

## 🚀 Utilisation

1. **Backend** : http://localhost:8000
2. **Frontend** : http://localhost:3000

### Comptes par défaut

- **Super Admin** : `admin@fleetrental.com` / `admin123`
- **Employee** : `employe@fleetrental.com` / `test123`

## 📚 Documentation

### Structure Backend
```
app/
├── Http/Controllers/
│   ├── VehicleController.php
│   ├── MaintenanceController.php
│   ├── MaintenanceReminderController.php
│   ├── UserController.php
│   ├── CompanyController.php
│   └── SuperAdminStatsController.php
├── Models/
│   ├── Vehicle.php
│   ├── Maintenance.php
│   ├── MaintenanceReminder.php
│   ├── User.php
│   └── Company.php
└── Middleware/
    ├── CompanyAdminMiddleware.php
    └── SuperAdminMiddleware.php
```

### Structure Frontend
```
app/
├── (main)/
│   ├── vehicles/
│   ├── maintenances/
│   ├── reminders/
│   ├── users/
│   ├── companies/
│   ├── dashboard/
│   └── super-admin/dashboard/
├── components/
│   ├── Sidebar.js
│   └── RoleProtector.js
├── context/
│   └── DataContext.js
└── lib/
    └── api.js
```

## 🔐 Sécurité

- ✅ Authentification via Laravel Sanctum
- ✅ Protection CSRF
- ✅ Validation côté serveur
- ✅ Isolation des données par entreprise
- ✅ Permissions par rôle (RBAC)
- ✅ Middleware de protection des routes

## 🎨 Fonctionnalités avancées

- ✅ Cache côté client (Context API)
- ✅ Upload de fichiers multiples
- ✅ Filtres et recherche en temps réel
- ✅ Statuts automatiques des véhicules
- ✅ Calculs automatiques (coûts, kilométrages)
- ✅ Interface responsive

## 📈 Roadmap

- [ ] Module Locations
- [ ] Historique des locations par véhicule
- [ ] Génération de factures PDF
- [ ] Export Excel des données
- [ ] Notifications par email
- [ ] API REST complète
- [ ] Tests unitaires
- [ ] CI/CD

## 👨‍💻 Auteur

Développé avec ❤️ pour la gestion de flottes automobiles

## 📝 Licence

Propriétaire

---

**FleetRental** - La solution complète pour gérer votre flotte automobile 🚗
