# FleetRental Mobile

Application mobile cliente pour FleetRental — permet aux clients de consulter les véhicules disponibles et de faire des demandes de réservation.

## Prérequis

- Node.js 18+
- npm ou yarn
- Expo Go (sur votre téléphone) ou Android Studio / Xcode

## Installation

```bash
cd fleetrental-mobile
npm install
```

## Lancement

```bash
npm start
# Puis scanner le QR code avec Expo Go (Android/iOS)
```

## Fonctionnalités

- 🏢 **Liste des entreprises** de location avec nombre de véhicules disponibles
- 🚗 **Catalogue des véhicules** disponibles (photos, tarifs, caractéristiques)
- 📅 **Formulaire de réservation** avec calcul automatique du prix
- 📋 **Suivi de réservation** par référence (ex: FLT-2026-00042)

## Architecture

```
src/
├── api.js              → Appels API (Railway backend)
├── navigation/
│   └── AppNavigator.js → Navigation entre écrans
└── screens/
    ├── HomeScreen.js             → Liste des entreprises
    ├── CompanyVehiclesScreen.js  → Véhicules d'une entreprise
    ├── VehicleDetailScreen.js    → Détail d'un véhicule
    ├── BookingScreen.js          → Formulaire de réservation
    ├── BookingConfirmScreen.js   → Confirmation + référence
    └── TrackReservationScreen.js → Suivi par référence
```

## Backend

L'app se connecte à : `https://fleetrental-production.up.railway.app/api/public/`

Endpoints utilisés :
- `GET /companies` — liste des entreprises
- `GET /companies/{id}/vehicles` — véhicules disponibles
- `GET /vehicles/{id}` — détail véhicule
- `POST /reservations` — créer une réservation
- `GET /reservations/{reference}` — suivre une réservation
