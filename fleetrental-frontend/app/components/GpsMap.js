'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix icônes Leaflet avec Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Icône voiture verte personnalisée
const carIcon = L.divIcon({
    className: '',
    html: `<div style="
        background:#16a34a;
        border:3px solid #fff;
        border-radius:50%;
        width:36px;height:36px;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 8px rgba(0,0,0,0.4);
        font-size:18px;
    ">🚗</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
});

// Recentre la carte si les positions changent
function FitBounds({ locations }) {
    const map = useMap();
    useEffect(() => {
        if (locations.length > 0) {
            const bounds = locations.map(l => [l.latitude, l.longitude]);
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
        }
    }, [locations, map]);
    return null;
}

export default function GpsMap({ locations }) {
    // Centre par défaut : Maroc
    const center = [31.7917, -7.0926];

    return (
        <MapContainer
            center={center}
            zoom={6}
            style={{ height: '100%', width: '100%', borderRadius: '16px' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {locations.length > 0 && <FitBounds locations={locations} />}

            {locations.map((loc) => (
                <Marker
                    key={loc.vehicle_id}
                    position={[loc.latitude, loc.longitude]}
                    icon={carIcon}
                >
                    <Popup>
                        <div style={{ minWidth: 160 }}>
                            <strong style={{ fontSize: 14 }}>{loc.vehicle_name}</strong>
                            <br />
                            <span style={{ color: '#6b7280', fontSize: 12 }}>{loc.plate}</span>
                            <hr style={{ margin: '6px 0' }} />
                            <div style={{ fontSize: 13 }}>
                                <b>Chauffeur:</b> {loc.driver_name}<br />
                                <b>Vitesse:</b> {loc.speed} km/h<br />
                                <b>Vu:</b> {loc.last_seen_at}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
