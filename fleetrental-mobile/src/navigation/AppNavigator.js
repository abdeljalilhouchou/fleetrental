import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import CompanyVehiclesScreen from '../screens/CompanyVehiclesScreen';
import VehicleDetailScreen from '../screens/VehicleDetailScreen';
import BookingScreen from '../screens/BookingScreen';
import BookingConfirmScreen from '../screens/BookingConfirmScreen';
import TrackReservationScreen from '../screens/TrackReservationScreen';
import SplashAnimationScreen from '../screens/SplashAnimationScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Splash"
                screenOptions={{
                    headerStyle: { backgroundColor: '#1e40af' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: '700' },
                    headerBackTitleVisible: false,
                }}
            >
                <Stack.Screen
                    name="Splash"
                    component={SplashAnimationScreen}
                    options={{ headerShown: false, animation: 'none' }}
                />
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{ title: 'FleetRental', headerShown: false }}
                />
                <Stack.Screen
                    name="CompanyVehicles"
                    component={CompanyVehiclesScreen}
                    options={({ route }) => ({ title: route.params?.company?.name || 'Véhicules' })}
                />
                <Stack.Screen
                    name="VehicleDetail"
                    component={VehicleDetailScreen}
                    options={{ title: 'Détails du véhicule' }}
                />
                <Stack.Screen
                    name="Booking"
                    component={BookingScreen}
                    options={{ title: 'Réserver ce véhicule' }}
                />
                <Stack.Screen
                    name="BookingConfirm"
                    component={BookingConfirmScreen}
                    options={{ title: 'Réservation envoyée', headerLeft: () => null }}
                />
                <Stack.Screen
                    name="TrackReservation"
                    component={TrackReservationScreen}
                    options={{ title: 'Suivre ma réservation' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
