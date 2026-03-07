import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';

import { AuthContext } from '../context/AuthContext';
import LoginScreen       from '../screens/admin/LoginScreen';
import DashboardScreen   from '../screens/admin/DashboardScreen';
import VehiclesScreen    from '../screens/admin/VehiclesScreen';
import RentalsScreen     from '../screens/admin/RentalsScreen';
import MaintenancesScreen from '../screens/admin/MaintenancesScreen';
import ProfileScreen     from '../screens/admin/ProfileScreen';
import UsersScreen       from '../screens/admin/UsersScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function ProfileIcon({ navigation }) {
    const { user } = useContext(AuthContext);
    const initial = (user?.name || 'A')[0].toUpperCase();

    function onPress() {
        Alert.alert(
            'Accès rapide',
            null,
            [
                {
                    text: 'Mon profil',
                    onPress: () => navigation.navigate('Profile'),
                },
                {
                    text: 'Utilisateurs',
                    onPress: () => navigation.navigate('Users'),
                },
                { text: 'Annuler', style: 'cancel' },
            ],
            { cancelable: true }
        );
    }

    return (
        <TouchableOpacity onPress={onPress} style={styles.profileBtn} activeOpacity={0.8}>
            <View style={styles.profileAvatar}>
                <Text style={styles.profileInitial}>{initial}</Text>
            </View>
        </TouchableOpacity>
    );
}

function AdminTabs({ navigation }) {
    const headerRight = () => <ProfileIcon navigation={navigation} />;

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerStyle:      { backgroundColor: '#1e3a5f' },
                headerTintColor:  '#fff',
                headerTitleStyle: { fontWeight: '700' },
                headerRight,
                tabBarActiveTintColor:   '#2563eb',
                tabBarInactiveTintColor: '#94a3b8',
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopColor:  '#e2e8f0',
                    paddingBottom:   4,
                    height:          60,
                },
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
                tabBarIcon: ({ color, size, focused }) => {
                    const icons = {
                        Dashboard:    focused ? 'grid'      : 'grid-outline',
                        Vehicles:     focused ? 'car-sport' : 'car-sport-outline',
                        Rentals:      focused ? 'key'       : 'key-outline',
                        Maintenances: focused ? 'construct' : 'construct-outline',
                    };
                    return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{ title: 'Tableau de bord', headerTitle: 'FleetRental Admin' }}
            />
            <Tab.Screen
                name="Vehicles"
                component={VehiclesScreen}
                options={{ title: 'Véhicules', headerTitle: 'Véhicules' }}
            />
            <Tab.Screen
                name="Rentals"
                component={RentalsScreen}
                options={{ title: 'Locations', headerTitle: 'Locations' }}
            />
            <Tab.Screen
                name="Maintenances"
                component={MaintenancesScreen}
                options={{ title: 'Maintenance', headerTitle: 'Maintenances' }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const { isLoading, token } = useContext(AuthContext);

    if (isLoading) {
        return (
            <View style={styles.splash}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle:      { backgroundColor: '#1e3a5f' },
                    headerTintColor:  '#fff',
                    headerTitleStyle: { fontWeight: '700' },
                }}
            >
                {token ? (
                    <>
                        <Stack.Screen
                            name="AdminTabs"
                            component={AdminTabs}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Profile"
                            component={ProfileScreen}
                            options={{ title: 'Mon profil' }}
                        />
                        <Stack.Screen
                            name="Users"
                            component={UsersScreen}
                            options={{ title: 'Utilisateurs' }}
                        />
                    </>
                ) : (
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ headerShown: false }}
                    />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    splash: {
        flex: 1, backgroundColor: '#0f172a',
        alignItems: 'center', justifyContent: 'center',
    },
    profileBtn: { marginRight: 12 },
    profileAvatar: {
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
    },
    profileInitial: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
