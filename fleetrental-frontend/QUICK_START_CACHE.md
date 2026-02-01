# ⚡ GUIDE RAPIDE - SYSTÈME DE CACHE

## 🎯 OBJECTIF :

**Éliminer les rechargements inutiles entre les pages**

---

## 📦 FICHIERS À PLACER :

1. **DataContext.js** → `app/context/DataContext.js`
2. **layout-main.js** → `app/(main)/layout.js` (renommer)

---

## ✅ INSTALLATION EN 3 ÉTAPES :

### **Étape 1 : Créer le dossier context**

```bash
mkdir app/context
```

### **Étape 2 : Placer DataContext.js**

Place le fichier **DataContext.js** dans `app/context/DataContext.js`

### **Étape 3 : Wrapper l'application**

Crée/modifie `app/(main)/layout.js` avec le contenu de **layout-main.js**

---

## 🔧 MODIFICATIONS DANS LES PAGES :

### **Pour TOUTES les pages (vehicles, maintenances, reminders, users, companies) :**

#### **AVANT :**
```javascript
const [vehicles, setVehicles] = useState([]);
const [loading, setLoading] = useState(true);

const fetchVehicles = async () => {
    const res = await fetch(...);
    setVehicles(await res.json());
};

useEffect(() => {
    fetchVehicles();
}, []);

// Après action
await fetchVehicles();
```

#### **APRÈS :**
```javascript
import { useData } from '../../context/DataContext';

const { vehicles, loading, refreshVehicles } = useData();

// Plus de useState, plus de useEffect !

// Après action
await refreshVehicles();
```

---

## 📝 LISTE DES MODIFICATIONS PAR FICHIER :

### **1. app/components/Sidebar.js**

**Supprimer :**
```javascript
const [user, setUser] = useState(null);
useEffect(() => {
    const fetchUser = async () => { ... };
    fetchUser();
}, []);
```

**Ajouter :**
```javascript
import { useData } from '../context/DataContext';
const { user } = useData();
```

---

### **2. app/(main)/vehicles/page.js**

**Supprimer :**
```javascript
const [vehicles, setVehicles] = useState([]);
const [currentUser, setCurrentUser] = useState(null);
const [loading, setLoading] = useState(true);
const fetchVehicles = async () => { ... };
useEffect(() => { fetchVehicles(); }, []);
```

**Ajouter :**
```javascript
import { useData } from '../../context/DataContext';
const { vehicles, user: currentUser, loading, refreshVehicles } = useData();
```

**Remplacer :**
```javascript
await fetchVehicles(); // par
await refreshVehicles();
```

---

### **3. app/(main)/maintenances/page.js**

**Supprimer :**
```javascript
const [maintenances, setMaintenances] = useState([]);
const [vehicles, setVehicles] = useState([]);
const [currentUser, setCurrentUser] = useState(null);
const fetchData = async () => { ... };
```

**Ajouter :**
```javascript
import { useData } from '../../context/DataContext';
const { maintenances, vehicles, user: currentUser, loading, refreshMaintenances } = useData();
```

**Remplacer :**
```javascript
await fetchData(); // par
await refreshMaintenances();
```

---

### **4. app/(main)/reminders/page.js**

**Supprimer :**
```javascript
const [reminders, setReminders] = useState([]);
const [vehicles, setVehicles] = useState([]);
const [currentUser, setCurrentUser] = useState(null);
const fetchData = async () => { ... };
```

**Ajouter :**
```javascript
import { useData } from '../../context/DataContext';
const { reminders, vehicles, user: currentUser, loading, refreshReminders } = useData();
```

**Remplacer :**
```javascript
await fetchData(); // par
await refreshReminders();
```

---

### **5. app/(main)/users/page.js**

**Ajouter :**
```javascript
import { useData } from '../../context/DataContext';
const { users, user: currentUser, companies, loading, refreshUsers } = useData();
```

**Remplacer :**
```javascript
await fetchData(); // par
await refreshUsers();
```

---

### **6. app/(main)/companies/page.js**

**Ajouter :**
```javascript
import { useData } from '../../context/DataContext';
const { companies, loading, refreshCompanies } = useData();
```

**Remplacer :**
```javascript
await fetchData(); // par
await refreshCompanies();
```

---

## 🎯 DONNÉES DISPONIBLES DANS useData() :

```javascript
const {
    // Données
    user,              // Utilisateur connecté
    vehicles,          // Liste des véhicules
    maintenances,      // Liste des maintenances
    reminders,         // Liste des rappels
    companies,         // Liste des entreprises (super_admin)
    users,             // Liste des utilisateurs
    loading,           // État de chargement initial
    
    // Fonctions de rafraîchissement
    refreshVehicles,      // Rafraîchir seulement les véhicules
    refreshMaintenances,  // Rafraîchir seulement les maintenances
    refreshReminders,     // Rafraîchir seulement les rappels
    refreshCompanies,     // Rafraîchir seulement les entreprises
    refreshUsers,         // Rafraîchir seulement les utilisateurs
    refreshAll,           // Rafraîchir toutes les données
} = useData();
```

---

## ⚡ RÉSULTAT ATTENDU :

### **AVANT :**
- Chaque changement de page → 3-4 requêtes
- Navigation lente
- Rechargement visible

### **APRÈS :**
- Premier chargement → 4-5 requêtes
- Navigation entre pages → **0 requête**
- Action (créer/modifier) → 1 seule requête
- Navigation ultra-rapide

---

## 🧪 TEST RAPIDE :

1. Ouvre la console réseau (F12 → Network)
2. Connecte-toi
3. Observe : 4-5 requêtes au début
4. Navigue : Véhicules → Maintenances → Rappels
5. **Résultat attendu : AUCUNE nouvelle requête**
6. Crée un véhicule
7. **Résultat attendu : 1 POST + 1 GET seulement**

✅ Si c'est le cas, le cache fonctionne parfaitement !

---

## 📚 DOCUMENTATION COMPLÈTE :

Lis **CACHING_SYSTEM.md** pour tous les détails et exemples.

---

## 🎊 GAIN DE PERFORMANCE :

- **~60% de requêtes en moins**
- **Navigation instantanée**
- **Meilleure expérience utilisateur**

**C'est exactement ce que tu voulais !** 🚀
