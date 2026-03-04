import { StatusBar } from 'expo-status-bar';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';

// ─── Background GPS task (doit être défini au niveau MODULE, avant tout composant) ───
export const BACKGROUND_LOCATION_TASK = 'renter-background-location';
const BACKEND_URL = 'https://fleetrental-production.up.railway.app/api';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) return;
    if (data?.locations?.length > 0) {
        const { latitude, longitude, speed } = data.locations[0].coords;
        try {
            const token = await AsyncStorage.getItem('renter_token');
            if (!token) return;
            await fetch(`${BACKEND_URL}/renter/location`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    latitude,
                    longitude,
                    speed: Math.round((speed || 0) * 3.6),
                }),
            });
        } catch (_) {}
    }
});

export default function App() {
    return (
        <>
            <StatusBar style="light" />
            <AppNavigator />
        </>
    );
}
