# 🔓 PERMISSIONS EMPLOYÉS - OPTION 2

## ✅ CE QUE LES EMPLOYÉS PEUVENT MAINTENANT FAIRE :

1. **Voir** les véhicules, maintenances, rappels
2. **Créer** des maintenances (enregistrer réparations/problèmes)
3. **Compléter** des maintenances (marquer comme terminées)
4. **Changer le statut** des véhicules (disponible ↔ maintenance)
5. **Upload** des fichiers sur les maintenances (photos, factures)

---

## 📁 BACKEND - FICHIERS À MODIFIER :

### 1. **app/Http/Controllers/VehicleController.php** (REMPLACER)
✅ **Nouvelle méthode ajoutée** : `updateStatus()`
- Change uniquement le statut d'un véhicule
- Accessible aux employés
- Ne permet pas de modifier les autres champs

### 2. **routes/api.php** (REMPLACER COMPLÈTEMENT)
✅ **Nouvelles routes pour employés** :
```php
// Accessible par TOUS (employee, company_admin, super_admin)
PUT  /vehicles/{vehicle}/status         // Changer statut
POST /maintenances                      // Créer maintenance
POST /maintenances/{id}/complete        // Compléter maintenance
POST /maintenances/{id}/files           // Upload fichiers
```

✅ **Routes réservées aux admins** :
```php
// Seulement company_admin et super_admin
POST   /vehicles                  // Créer véhicule
PUT    /vehicles/{id}             // Modifier véhicule complet
DELETE /vehicles/{id}             // Supprimer véhicule
PUT    /maintenances/{id}         // Modifier maintenance
DELETE /maintenances/{id}         // Supprimer maintenance
DELETE /maintenances/{id}/files   // Supprimer fichier
```

---

## 📁 FRONTEND - MODIFICATIONS À FAIRE :

### 1. **Page Véhicules** (`app/(main)/vehicles/page.js`)

**Modifications nécessaires :**

#### A. Récupérer le rôle de l'utilisateur
En haut du composant, ajoute :
```javascript
const [currentUser, setCurrentUser] = useState(null);

useEffect(() => {
    const fetchUser = async () => {
        const res = await fetch(`${API_URL}/me`, { headers: headers() });
        if (res.ok) setCurrentUser(await res.json());
    };
    fetchUser();
}, []);
```

#### B. Masquer les boutons selon le rôle
Dans la colonne Actions du tableau :
```javascript
<td className="px-6 py-4">
    <div className="flex items-center gap-1">
        {/* Changer statut - VISIBLE POUR TOUS */}
        <button 
            onClick={() => handleStatusChange(vehicle.id, newStatus)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Changer statut">
            <CheckCircle2 size={16} />
        </button>

        {/* Modifier - SEULEMENT ADMINS */}
        {(currentUser?.role === 'company_admin' || currentUser?.role === 'super_admin') && (
            <button onClick={() => handleEdit(vehicle)} 
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition">
                <Edit2 size={16} />
            </button>
        )}

        {/* Supprimer - SEULEMENT ADMINS */}
        {(currentUser?.role === 'company_admin' || currentUser?.role === 'super_admin') && (
            <button onClick={() => handleDelete(vehicle.id)} 
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                <Trash2 size={16} />
            </button>
        )}
    </div>
</td>
```

#### C. Fonction pour changer le statut
```javascript
const handleStatusChange = async (vehicleId, newStatus) => {
    try {
        const res = await fetch(`${API_URL}/vehicles/${vehicleId}/status`, {
            method: 'PUT',
            headers: headers(),
            body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
            await fetchData(); // Recharger les données
        }
    } catch (e) {
        console.error(e);
    }
};
```

#### D. Masquer le bouton "Ajouter véhicule"
Dans le header de la page :
```javascript
{/* Bouton visible SEULEMENT pour admins */}
{(currentUser?.role === 'company_admin' || currentUser?.role === 'super_admin') && (
    <button onClick={handleCreate}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl">
        <Plus size={18} />
        Nouveau véhicule
    </button>
)}
```

---

### 2. **Page Maintenances** (`app/(main)/maintenances/page.js`)

**Modifications nécessaires :**

#### A. Bouton "Nouvelle maintenance" - VISIBLE POUR TOUS
```javascript
{/* Tous les rôles peuvent créer des maintenances */}
<button onClick={handleCreate}
    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl">
    <Plus size={18} />
    Nouvelle maintenance
</button>
```

#### B. Bouton "Compléter" - VISIBLE POUR TOUS
```javascript
{/* Tous les rôles peuvent compléter */}
{maintenance.status !== 'completed' && (
    <button onClick={() => handleComplete(maintenance.id)}
        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition">
        <CheckCircle2 size={16} />
    </button>
)}
```

#### C. Boutons "Modifier/Supprimer" - SEULEMENT ADMINS
```javascript
{/* Modifier - SEULEMENT ADMINS */}
{(currentUser?.role === 'company_admin' || currentUser?.role === 'super_admin') && (
    <button onClick={() => handleEdit(maintenance)}>
        <Edit2 size={16} />
    </button>
)}

{/* Supprimer - SEULEMENT ADMINS */}
{(currentUser?.role === 'company_admin' || currentUser?.role === 'super_admin') && (
    <button onClick={() => handleDelete(maintenance.id)}>
        <Trash2 size={16} />
    </button>
)}
```

---

## 📊 RÉSUMÉ DES PERMISSIONS FINALES :

| Action | Employee | Company Admin | Super Admin |
|--------|----------|---------------|-------------|
| **VÉHICULES** |
| Voir liste | ✅ | ✅ | ✅ |
| Créer | ❌ | ✅ | ✅ |
| Modifier complet | ❌ | ✅ | ✅ |
| Changer statut | ✅ | ✅ | ✅ |
| Supprimer | ❌ | ✅ | ✅ |
| **MAINTENANCES** |
| Voir liste | ✅ | ✅ | ✅ |
| Créer | ✅ | ✅ | ✅ |
| Compléter | ✅ | ✅ | ✅ |
| Upload fichiers | ✅ | ✅ | ✅ |
| Modifier | ❌ | ✅ | ✅ |
| Supprimer | ❌ | ✅ | ✅ |
| **RAPPELS** |
| Voir liste | ✅ | ✅ | ✅ |
| Créer/Modifier/Supprimer | ❌ | ✅ | ✅ |
| **UTILISATEURS** |
| Gérer | ❌ | ✅ | ✅ |
| **ENTREPRISES** |
| Gérer | ❌ | ❌ | ✅ |

---

## 🧪 TESTS À FAIRE :

### Test 1 : Employé crée une maintenance
1. Connecte-toi comme **employee**
2. Va sur "Maintenances"
3. Clique "Nouvelle maintenance"
4. Remplis le formulaire et sauvegarde
5. ✅ Doit fonctionner

### Test 2 : Employé change un statut véhicule
1. Connecte-toi comme **employee**
2. Va sur "Véhicules"
3. Change le statut d'un véhicule de "Disponible" → "Maintenance"
4. ✅ Doit fonctionner

### Test 3 : Employé NE PEUT PAS modifier un véhicule
1. Connecte-toi comme **employee**
2. Va sur "Véhicules"
3. Les boutons "Modifier" et "Supprimer" doivent être **invisibles**
4. Le bouton "Ajouter véhicule" doit être **invisible**
5. ✅ Doit être masqué

### Test 4 : Employé complète une maintenance
1. Connecte-toi comme **employee**
2. Va sur "Maintenances"
3. Clique sur le bouton "Compléter" d'une maintenance en cours
4. ✅ Doit fonctionner

---

## 🎯 PROCHAINES ÉTAPES :

Après avoir appliqué ces modifications, les employés pourront :
- ✅ Gérer les maintenances au quotidien
- ✅ Changer les statuts des véhicules
- ✅ Être productifs sans pouvoir casser les données critiques

Les admins gardent le contrôle total pour les opérations sensibles (création/suppression véhicules, gestion utilisateurs).
