# INSTRUCTIONS COMPLÈTES - SUPER ADMIN & ATTRIBUTION UTILISATEURS

## 🎯 Ce qui a été corrigé :

### Problème 1 : Attribution d'utilisateurs pour une entreprise
✅ Le super_admin peut maintenant choisir l'entreprise lors de la création/modification d'un utilisateur

### Problème 2 : Stats pour super_admin
✅ Dashboard spécial avec stats globales de toutes les entreprises

---

## 📁 BACKEND - Fichiers à placer/modifier :

### 1. **app/Http/Controllers/SuperAdminStatsController.php** (NOUVEAU)
   - Créer ce fichier avec le contenu fourni
   - Fournit les stats globales : entreprises, véhicules, users, maintenances, coûts

### 2. **app/Http/Controllers/UserController.php** (REMPLACER)
   - Remplace complètement ton UserController existant
   - Ajouts :
     - Super admin doit choisir company_id (champ obligatoire)
     - Company admin voit seulement ses users (pas les super_admin)
     - Validation des permissions (ne peut pas modifier/supprimer super_admin)

### 3. **app/Http/Controllers/Auth/AuthController.php** (MODIFIER)
   - Dans la méthode login(), change la redirection :
   ```php
   $redirect = match ($user->role) {
       'super_admin'   => '/super-admin/dashboard',  // <- Change ici
       'company_admin' => '/dashboard',
       'employee'      => '/vehicles',
       default         => '/dashboard',
   };
   ```

### 4. **routes/api.php** (AJOUTER)
   - En haut, ajoute :
   ```php
   use App\Http\Controllers\SuperAdminStatsController;
   ```
   - Dans le groupe super_admin, ajoute après les routes companies :
   ```php
   // Stats globales pour super admin
   Route::get('/super-admin/stats', [SuperAdminStatsController::class, 'index']);
   ```

---

## 📁 FRONTEND - Fichiers à placer/modifier :

### 1. **app/(main)/users/page.js** (REMPLACER)
   - Renomme users-page.js en page.js
   - Ajouts :
     - Charge la liste des entreprises pour super_admin
     - Select "Entreprise" dans le modal (visible seulement pour super_admin)
     - Envoie company_id lors de la création/modification

### 2. **app/(main)/super-admin/dashboard/page.js** (NOUVEAU DOSSIER)
   - Crée le dossier : app/(main)/super-admin/dashboard/
   - Renomme super-admin-dashboard.js en page.js et place-le dedans
   - Dashboard avec :
     - 4 stats principales (entreprises, véhicules, users, maintenances)
     - État des véhicules (disponibles, louées, maintenance, hors service)
     - Coût total maintenances
     - Liste des 5 dernières entreprises créées

### 3. **app/components/Sidebar.js** (REMPLACER)
   - Navigation mise à jour pour super_admin :
     - Dashboard (nouveau)
     - Entreprises
     - Utilisateurs

---

## 🧪 TESTS À FAIRE :

### Test 1 : Attribution utilisateur (Super Admin)
1. Connecte-toi comme super_admin (admin@fleetrental.com)
2. Va sur "Utilisateurs"
3. Clique "Nouvel utilisateur"
4. Tu dois voir un select "Entreprise" avec la liste des entreprises
5. Crée un utilisateur pour une entreprise spécifique
6. Vérifie qu'il apparaît dans la liste avec la bonne entreprise

### Test 2 : Dashboard Super Admin
1. Connecte-toi comme super_admin
2. Tu dois être redirigé vers /super-admin/dashboard
3. Tu dois voir :
   - Stats globales (toutes entreprises confondues)
   - État des véhicules (tous les véhicules)
   - Coût total maintenances
   - Entreprises récentes

### Test 3 : Isolation Company Admin
1. Connecte-toi comme company_admin
2. Va sur "Utilisateurs"
3. Tu ne dois voir QUE les users de ton entreprise
4. Pas de select "Entreprise" dans le modal
5. Tu peux créer seulement des "Employés"

### Test 4 : Modification utilisateur (Super Admin)
1. Connecte-toi comme super_admin
2. Édite un utilisateur existant
3. Tu peux changer son entreprise via le select
4. Tu peux changer son rôle (super_admin, company_admin, employee)

---

## 📊 RÉSUMÉ DES PERMISSIONS :

| Fonctionnalité | Super Admin | Company Admin | Employee |
|----------------|-------------|---------------|----------|
| Créer utilisateur | ✅ Pour toute entreprise | ✅ Employés uniquement | ❌ |
| Choisir entreprise | ✅ | ❌ | ❌ |
| Voir tous users | ✅ | ❌ (seulement son entreprise) | ❌ |
| Modifier rôle | ✅ Tous les rôles | ❌ Employé uniquement | ❌ |
| Dashboard global | ✅ | ❌ | ❌ |
| Gérer entreprises | ✅ | ❌ | ❌ |

---

## ⚠️ IMPORTANT :

1. **Teste d'abord avec le super_admin** pour vérifier que tout fonctionne
2. **Vérifie les erreurs dans la console** du navigateur et du serveur
3. **Si erreur 403** sur /super-admin/stats, vérifie que la route est bien ajoutée
4. **Si le select entreprise n'apparaît pas**, vérifie que currentUser.role === 'super_admin'
