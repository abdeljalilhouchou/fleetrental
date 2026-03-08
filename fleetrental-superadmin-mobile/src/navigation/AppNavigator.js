import React, { useContext, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import {
    View, Text, TouchableOpacity, ActivityIndicator,
    StyleSheet, Modal, Animated, Pressable, ScrollView,
} from 'react-native';

import { AuthContext } from '../context/AuthContext';
import LoginScreen        from '../screens/superadmin/LoginScreen';
import DashboardScreen    from '../screens/superadmin/DashboardScreen';
import CompaniesScreen    from '../screens/superadmin/CompaniesScreen';
import VehiclesScreen     from '../screens/superadmin/VehiclesScreen';
import RentalsScreen      from '../screens/superadmin/RentalsScreen';
import MaintenancesScreen from '../screens/superadmin/MaintenancesScreen';
import UsersScreen        from '../screens/superadmin/UsersScreen';
import StatsScreen        from '../screens/superadmin/StatsScreen';
import FinanceScreen      from '../screens/superadmin/FinanceScreen';
import RemindersScreen    from '../screens/superadmin/RemindersScreen';
import ReservationsScreen from '../screens/superadmin/ReservationsScreen';
import GpsScreen          from '../screens/superadmin/GpsScreen';
import ProfileScreen      from '../screens/superadmin/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const PRIMARY = '#4c1d95';
const ACCENT  = '#7c3aed';
const DRAWER_WIDTH = 280;

const MENU_ITEMS = [
    { key: 'Stats',        label: 'Statistiques',  icon: 'bar-chart',     color: '#6366f1', desc: 'KPIs & analyses' },
    { key: 'Finance',      label: 'Finances',       icon: 'cash',          color: '#16a34a', desc: 'Revenus & dépenses' },
    { key: 'Reminders',    label: 'Rappels',        icon: 'notifications', color: '#d97706', desc: 'Échéances & alertes' },
    { key: 'Reservations', label: 'Réservations',   icon: 'calendar',      color: '#2563eb', desc: 'Demandes en attente' },
    { key: 'Gps',          label: 'Suivi GPS',      icon: 'location',      color: '#0891b2', desc: 'Localisation en temps réel' },
    { key: 'Maintenances', label: 'Maintenances',   icon: 'construct',     color: '#d97706', desc: 'Suivi des maintenances' },
];

function SideDrawer({ visible, onClose, navigation }) {
    const { user, signOut } = useContext(AuthContext);
    const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const opacity    = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateX, { toValue: 0,             useNativeDriver: true, tension: 80, friction: 12 }),
                Animated.timing(opacity,    { toValue: 1,             useNativeDriver: true, duration: 200 }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateX, { toValue: -DRAWER_WIDTH, useNativeDriver: true, duration: 220 }),
                Animated.timing(opacity,    { toValue: 0,             useNativeDriver: true, duration: 200 }),
            ]).start();
        }
    }, [visible]);

    const navigate = (key) => {
        onClose();
        setTimeout(() => navigation.navigate(key), 240);
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
            <View style={drawerStyles.overlay}>
                <Animated.View style={[drawerStyles.backdrop, { opacity }]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                </Animated.View>
                <Animated.View style={[drawerStyles.panel, { transform: [{ translateX }] }]}>
                    <View style={drawerStyles.header}>
                        <View style={drawerStyles.logoWrap}>
                            <Ionicons name="shield-checkmark" size={22} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={drawerStyles.appName}>Super Admin</Text>
                            <Text style={drawerStyles.userName} numberOfLines={1}>{user?.name || 'Admin'}</Text>
                            <View style={drawerStyles.roleBadge}>
                                <Text style={drawerStyles.roleText}>Super Administrateur</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                            <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={drawerStyles.menuScroll} showsVerticalScrollIndicator={false}>
                        <Text style={drawerStyles.sectionLabel}>NAVIGATION</Text>
                        {MENU_ITEMS.map(item => (
                            <TouchableOpacity
                                key={item.key}
                                style={drawerStyles.menuItem}
                                onPress={() => navigate(item.key)}
                                activeOpacity={0.7}
                            >
                                <View style={[drawerStyles.menuIcon, { backgroundColor: item.color + '18' }]}>
                                    <Ionicons name={item.icon} size={18} color={item.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={drawerStyles.menuLabel}>{item.label}</Text>
                                    <Text style={drawerStyles.menuDesc}>{item.desc}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={14} color="#cbd5e1" />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <TouchableOpacity
                        style={drawerStyles.logoutBtn}
                        onPress={() => { onClose(); setTimeout(signOut, 300); }}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="log-out-outline" size={18} color="#dc2626" />
                        <Text style={drawerStyles.logoutText}>Se déconnecter</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
}

function MenuIcon({ navigation }) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    return (
        <>
            <TouchableOpacity onPress={() => setDrawerOpen(true)} style={styles.menuBtn} activeOpacity={0.7}>
                <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
            <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} navigation={navigation} />
        </>
    );
}

function ProfileIcon({ navigation }) {
    const { user } = useContext(AuthContext);
    const initial = (user?.name || 'S')[0].toUpperCase();
    return (
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileBtn} activeOpacity={0.8}>
            <View style={styles.profileAvatar}>
                <Text style={styles.profileInitial}>{initial}</Text>
            </View>
        </TouchableOpacity>
    );
}

function Tabs({ navigation }) {
    const headerLeft  = () => <MenuIcon navigation={navigation} />;
    const headerRight = () => <ProfileIcon navigation={navigation} />;

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerStyle:      { backgroundColor: PRIMARY },
                headerTintColor:  '#fff',
                headerTitleStyle: { fontWeight: '700' },
                headerLeft,
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
                        Dashboard:  focused ? 'grid'              : 'grid-outline',
                        Companies:  focused ? 'business'          : 'business-outline',
                        Users:      focused ? 'people'            : 'people-outline',
                        Vehicles:   focused ? 'car-sport'         : 'car-sport-outline',
                        Rentals:    focused ? 'key'               : 'key-outline',
                    };
                    return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Dashboard"  component={DashboardScreen}  options={{ title: 'Tableau de bord', headerTitle: 'FleetRental' }} />
            <Tab.Screen name="Companies"  component={CompaniesScreen}  options={{ title: 'Entreprises',     headerTitle: 'Entreprises' }} />
            <Tab.Screen name="Users"      component={UsersScreen}      options={{ title: 'Utilisateurs',    headerTitle: 'Utilisateurs' }} />
            <Tab.Screen name="Vehicles"   component={VehiclesScreen}   options={{ title: 'Véhicules',       headerTitle: 'Véhicules' }} />
            <Tab.Screen name="Rentals"    component={RentalsScreen}    options={{ title: 'Locations',       headerTitle: 'Locations' }} />
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
                        <Stack.Screen name="Tabs"         component={Tabs}             options={{ headerShown: false }} />
                        <Stack.Screen name="Profile"      component={ProfileScreen}    options={{ title: 'Mon profil' }} />
                        <Stack.Screen name="Stats"        component={StatsScreen}      options={{ title: 'Statistiques' }} />
                        <Stack.Screen name="Finance"      component={FinanceScreen}    options={{ title: 'Finances' }} />
                        <Stack.Screen name="Reminders"    component={RemindersScreen}  options={{ title: 'Rappels & Alertes' }} />
                        <Stack.Screen name="Reservations" component={ReservationsScreen} options={{ title: 'Réservations' }} />
                        <Stack.Screen name="Gps"          component={GpsScreen}        options={{ title: 'Suivi GPS' }} />
                        <Stack.Screen name="Maintenances" component={MaintenancesScreen} options={{ title: 'Maintenances' }} />
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
    menuBtn:     { marginLeft: 14 },
    profileBtn:  { marginRight: 12 },
    profileAvatar: {
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
    },
    profileInitial: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

const drawerStyles = StyleSheet.create({
    overlay:  { flex: 1, flexDirection: 'row' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    panel: {
        width: DRAWER_WIDTH, backgroundColor: '#fff', height: '100%',
        shadowColor: '#000', shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.15, shadowRadius: 12, elevation: 12,
    },
    header: {
        backgroundColor: PRIMARY, paddingTop: 50, paddingBottom: 20,
        paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    logoWrap: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    appName:  { color: '#fff', fontWeight: '800', fontSize: 16 },
    userName: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 },
    roleBadge: {
        alignSelf: 'flex-start', marginTop: 6,
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 8, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    roleText: { fontSize: 10, fontWeight: '700', color: '#e9d5ff', letterSpacing: 0.3 },

    menuScroll:   { flex: 1, paddingTop: 8 },
    sectionLabel: {
        fontSize: 10, fontWeight: '700', color: '#94a3b8',
        letterSpacing: 1.2, marginHorizontal: 18, marginTop: 14, marginBottom: 6,
    },
    menuItem: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 18, paddingVertical: 13,
        borderBottomWidth: 1, borderBottomColor: '#f8fafc',
    },
    menuIcon:  { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    menuLabel: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
    menuDesc:  { fontSize: 11, color: '#94a3b8', marginTop: 1 },

    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 18, paddingVertical: 16,
        borderTopWidth: 1, borderTopColor: '#f1f5f9',
        backgroundColor: '#fff', marginBottom: 20,
    },
    logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 14 },
});
