import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

import { AuthContext } from '../context/AuthContext';
import LoginScreen            from '../screens/superadmin/LoginScreen';
import DashboardScreen        from '../screens/superadmin/DashboardScreen';
import CompaniesScreen        from '../screens/superadmin/CompaniesScreen';
import UsersScreen            from '../screens/superadmin/UsersScreen';
import RolesPermissionsScreen from '../screens/superadmin/RolesPermissionsScreen';
import ProfileScreen          from '../screens/superadmin/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const PRIMARY = '#4c1d95';
const ACCENT  = '#7c3aed';

function ProfileIcon({ navigation }) {
    const { user } = useContext(AuthContext);
    const initial = (user?.name || 'S')[0].toUpperCase();
    return (
        <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={styles.profileBtn}
            activeOpacity={0.8}
        >
            <View style={styles.profileAvatar}>
                <Text style={styles.profileInitial}>{initial}</Text>
            </View>
        </TouchableOpacity>
    );
}

function Tabs({ navigation }) {
    const headerRight = () => <ProfileIcon navigation={navigation} />;

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerStyle:      { backgroundColor: PRIMARY },
                headerTintColor:  '#fff',
                headerTitleStyle: { fontWeight: '700' },
                headerRight,
                tabBarActiveTintColor:   ACCENT,
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
                        Dashboard:        focused ? 'grid'              : 'grid-outline',
                        Companies:        focused ? 'business'          : 'business-outline',
                        Users:            focused ? 'people'            : 'people-outline',
                        RolesPermissions: focused ? 'shield-checkmark'  : 'shield-checkmark-outline',
                    };
                    return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{ title: 'Tableau de bord', headerTitle: 'FleetRental Super Admin' }}
            />
            <Tab.Screen
                name="Companies"
                component={CompaniesScreen}
                options={{ title: 'Entreprises', headerTitle: 'Entreprises' }}
            />
            <Tab.Screen
                name="Users"
                component={UsersScreen}
                options={{ title: 'Utilisateurs', headerTitle: 'Utilisateurs' }}
            />
            <Tab.Screen
                name="RolesPermissions"
                component={RolesPermissionsScreen}
                options={{ title: 'Rôles', headerTitle: 'Rôles & Permissions' }}
            />
        </Tab.Navigator>
    );
}

const HEADER_OPTS = {
    headerStyle:      { backgroundColor: PRIMARY },
    headerTintColor:  '#fff',
    headerTitleStyle: { fontWeight: '700' },
};

export default function AppNavigator() {
    const { isLoading, token, user } = useContext(AuthContext);

    if (isLoading || (token && !user)) {
        return (
            <View style={styles.splash}>
                <ActivityIndicator size="large" color={ACCENT} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={HEADER_OPTS}>
                {token ? (
                    <>
                        <Stack.Screen name="Tabs"    component={Tabs}          options={{ headerShown: false }} />
                        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mon profil' }} />
                    </>
                ) : (
                    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    splash:      { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
    profileBtn:  { marginRight: 12 },
    profileAvatar: {
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
    },
    profileInitial: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
