import React, { useContext, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import {
    View, Text, TouchableOpacity, Alert, ActivityIndicator,
    StyleSheet, Modal, Animated, Pressable, ScrollView,
} from 'react-native';

import { AuthContext } from '../context/AuthContext';
import LoginScreen        from '../screens/admin/LoginScreen';
import DashboardScreen    from '../screens/admin/DashboardScreen';
import VehiclesScreen     from '../screens/admin/VehiclesScreen';
import RentalsScreen      from '../screens/admin/RentalsScreen';
import MaintenancesScreen from '../screens/admin/MaintenancesScreen';
import ProfileScreen      from '../screens/admin/ProfileScreen';
import UsersScreen        from '../screens/admin/UsersScreen';
import StatsScreen        from '../screens/admin/StatsScreen';
import FinanceScreen      from '../screens/admin/FinanceScreen';
import RemindersScreen    from '../screens/admin/RemindersScreen';
import ReservationsScreen from '../screens/admin/ReservationsScreen';
import GpsScreen          from '../screens/admin/GpsScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const DRAWER_WIDTH = 280;

const ROLE_CONFIG = {
    super_admin:   { label: 'Super Admin',       color: '#e9d5ff', bg: 'rgba(233,213,255,0.2)' },
    company_admin: { label: 'Administrateur',    color: '#fff',    bg: 'rgba(255,255,255,0.18)' },
    fleet_manager: { label: 'Gestion de flotte', color: '#7dd3fc', bg: 'rgba(125,211,252,0.2)' },
    rental_agent:  { label: 'Agent de location', color: '#86efac', bg: 'rgba(134,239,172,0.2)' },
    mechanic:      { label: 'Mécanicien',         color: '#fcd34d', bg: 'rgba(252,211,77,0.2)'  },
    employee:      { label: 'Employé',            color: '#cbd5e1', bg: 'rgba(203,213,225,0.2)' },
};

// Tous les items possibles du drawer
const MENU_ITEMS = {
    Stats:        { key: 'Stats',        label: 'Statistiques',  icon: 'bar-chart',     color: '#6366f1', desc: 'KPIs & analyses' },
    Finance:      { key: 'Finance',      label: 'Finances',       icon: 'cash',          color: '#16a34a', desc: 'Revenus & dépenses' },
    Reminders:    { key: 'Reminders',    label: 'Rappels',        icon: 'notifications', color: '#d97706', desc: 'Échéances & alertes' },
    Reservations: { key: 'Reservations', label: 'Réservations',   icon: 'calendar',      color: '#2563eb', desc: 'Demandes en attente' },
    Gps:          { key: 'Gps',          label: 'Suivi GPS',      icon: 'location',      color: '#0891b2', desc: 'Localisation en temps réel' },
    Users:        { key: 'Users',        label: 'Utilisateurs',   icon: 'people',        color: '#7c3aed', desc: 'Gestion des comptes' },
};

// Identique à NAV_BY_ROLE du site web — rôle + permission optionnelle
// null = visible sans permission particulière (héritage du rôle suffit)
const DRAWER_BY_ROLE = {
    company_admin: [
        { key: 'Stats',        permission: null },
        { key: 'Finance',      permission: 'view_finances' },
        { key: 'Reminders',    permission: 'view_reminders' },
        { key: 'Reservations', permission: null },
        { key: 'Gps',          permission: null },
        { key: 'Users',        permission: 'view_users' },
    ],
    fleet_manager: [
        { key: 'Stats',        permission: null },
        { key: 'Finance',      permission: 'view_finances' },
        { key: 'Reminders',    permission: 'view_reminders' },
        { key: 'Reservations', permission: null },
        { key: 'Gps',          permission: null },
    ],
    rental_agent: [
        { key: 'Reservations', permission: null },
    ],
    mechanic: [
        { key: 'Reminders', permission: 'view_reminders' },
    ],
    employee: [
        { key: 'Reminders', permission: 'view_reminders' },
    ],
};

// Onglets bottom tabs autorisés par rôle (Dashboard toujours inclus)
const TABS_BY_ROLE = {
    company_admin: ['Vehicles', 'Rentals', 'Maintenances'],
    fleet_manager: ['Vehicles', 'Rentals', 'Maintenances'],
    rental_agent:  ['Vehicles', 'Rentals'],
    mechanic:      ['Vehicles', 'Maintenances'],
    employee:      ['Vehicles', 'Rentals', 'Maintenances'],
};

function SideDrawer({ visible, onClose, navigation }) {
    const { user, signOut, hasPermission } = useContext(AuthContext);
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

    // Filtrer d'abord par rôle, puis par permission (identique au web)
    const role = user?.role || 'employee';
    const drawerConfig = DRAWER_BY_ROLE[role] || [];
    const visibleItems = drawerConfig
        .filter(item => !item.permission || hasPermission(item.permission))
        .map(item => MENU_ITEMS[item.key])
        .filter(Boolean);

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
            <View style={drawerStyles.overlay}>
                {/* Backdrop */}
                <Animated.View style={[drawerStyles.backdrop, { opacity }]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                </Animated.View>

                {/* Panel */}
                <Animated.View style={[drawerStyles.panel, { transform: [{ translateX }] }]}>
                    {/* Header */}
                    <View style={drawerStyles.header}>
                        <View style={drawerStyles.logoWrap}>
                            <Ionicons name="car-sport" size={22} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={drawerStyles.appName}>FleetRental</Text>
                            <Text style={drawerStyles.userName} numberOfLines={1}>{user?.name || 'Admin'}</Text>
                            {(() => {
                                const rc = ROLE_CONFIG[user?.role];
                                if (!rc) return null;
                                return (
                                    <View style={[drawerStyles.roleBadge, { backgroundColor: rc.bg }]}>
                                        <Text style={[drawerStyles.roleText, { color: rc.color }]}>{rc.label}</Text>
                                    </View>
                                );
                            })()}
                        </View>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                            <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>
                    </View>

                    {/* Menu items */}
                    <ScrollView style={drawerStyles.menuScroll} showsVerticalScrollIndicator={false}>
                        <Text style={drawerStyles.sectionLabel}>NAVIGATION</Text>
                        {visibleItems.map(item => (
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

                    {/* Footer */}
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
            <TouchableOpacity
                onPress={() => setDrawerOpen(true)}
                style={styles.menuBtn}
                activeOpacity={0.7}
            >
                <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
            <SideDrawer
                visible={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                navigation={navigation}
            />
        </>
    );
}

function ProfileIcon({ navigation }) {
    const { user } = useContext(AuthContext);
    const initial = (user?.name || 'A')[0].toUpperCase();

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
    const { user, permissions, hasPermission } = useContext(AuthContext);

    const headerLeft  = () => <MenuIcon navigation={navigation} />;
    const headerRight = () => <ProfileIcon navigation={navigation} />;

    const role        = user?.role || 'employee';
    const allowedTabs = TABS_BY_ROLE[role] || ['Vehicles'];

    const canTab = (tab, perm) => allowedTabs.includes(tab) && hasPermission(perm);

    // Clé unique basée sur rôle + permissions : force le remontage du Tab.Navigator
    // quand les permissions changent (évite le bug de rendu initial avec permissions vides)
    const navKey = `${role}_${permissions.join(',')}`;

    return (
        <Tab.Navigator
            key={navKey}
            screenOptions={({ route }) => ({
                headerStyle:      { backgroundColor: '#1e3a5f' },
                headerTintColor:  '#fff',
                headerTitleStyle: { fontWeight: '700' },
                headerLeft,
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
            {/* Dashboard toujours visible */}
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{ title: 'Tableau de bord', headerTitle: 'FleetRental' }}
            />
            {canTab('Vehicles', 'view_vehicles') && (
                <Tab.Screen
                    name="Vehicles"
                    component={VehiclesScreen}
                    options={{ title: 'Véhicules', headerTitle: 'Véhicules' }}
                />
            )}
            {canTab('Rentals', 'view_rentals') && (
                <Tab.Screen
                    name="Rentals"
                    component={RentalsScreen}
                    options={{ title: 'Locations', headerTitle: 'Locations' }}
                />
            )}
            {canTab('Maintenances', 'view_maintenances') && (
                <Tab.Screen
                    name="Maintenances"
                    component={MaintenancesScreen}
                    options={{ title: 'Maintenance', headerTitle: 'Maintenances' }}
                />
            )}
        </Tab.Navigator>
    );
}

const HEADER_OPTS = {
    headerStyle:      { backgroundColor: '#1e3a5f' },
    headerTintColor:  '#fff',
    headerTitleStyle: { fontWeight: '700' },
};

export default function AppNavigator() {
    const { isLoading, token, user } = useContext(AuthContext);

    // Attendre que token ET user soient tous les deux chargés
    // Empêche Tab.Navigator de monter avec des permissions vides (race condition)
    if (isLoading || (token && !user)) {
        return (
            <View style={styles.splash}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={HEADER_OPTS}>
                {token ? (
                    <>
                        <Stack.Screen
                            name="Tabs"
                            component={Tabs}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen name="Profile"      component={ProfileScreen}      options={{ title: 'Mon profil' }} />
                        <Stack.Screen name="Users"        component={UsersScreen}        options={{ title: 'Utilisateurs' }} />
                        <Stack.Screen name="Stats"        component={StatsScreen}        options={{ title: 'Statistiques' }} />
                        <Stack.Screen name="Finance"      component={FinanceScreen}      options={{ title: 'Finances' }} />
                        <Stack.Screen name="Reminders"    component={RemindersScreen}    options={{ title: 'Rappels & Alertes' }} />
                        <Stack.Screen name="Reservations" component={ReservationsScreen} options={{ title: 'Réservations' }} />
                        <Stack.Screen name="Gps"          component={GpsScreen}          options={{ title: 'Suivi GPS' }} />
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
    menuBtn:    { marginLeft: 14 },
    profileBtn: { marginRight: 12 },
    profileAvatar: {
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
    },
    profileInitial: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

const drawerStyles = StyleSheet.create({
    overlay: { flex: 1, flexDirection: 'row' },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    panel: {
        width: DRAWER_WIDTH,
        backgroundColor: '#fff',
        height: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 12,
    },
    header: {
        backgroundColor: '#1e3a5f',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
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
        borderColor: 'rgba(255,255,255,0.15)',
    },
    roleText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

    menuScroll: { flex: 1, paddingTop: 8 },
    sectionLabel: {
        fontSize: 10, fontWeight: '700', color: '#94a3b8',
        letterSpacing: 1.2, marginHorizontal: 18, marginTop: 14, marginBottom: 6,
    },
    menuItem: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 18, paddingVertical: 13,
        borderBottomWidth: 1, borderBottomColor: '#f8fafc',
    },
    menuIcon: {
        width: 38, height: 38, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
    },
    menuLabel: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
    menuDesc:  { fontSize: 11, color: '#94a3b8', marginTop: 1 },

    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 18, paddingVertical: 16,
        borderTopWidth: 1, borderTopColor: '#f1f5f9',
        backgroundColor: '#fff',
        marginBottom: 20,
    },
    logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 14 },
});
