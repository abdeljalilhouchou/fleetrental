import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Barre de filtres sous forme de cartes de statistiques (style tableau de bord).
 *
 * Props:
 *  - filters : [{ value, label, icon, count, color, bg }]
 *  - active  : valeur du filtre actif
 *  - onChange: (value) => void
 */
export default function StatsFilterBar({ filters, active, onChange }) {
    return (
        <View style={styles.row}>
            {filters.map(f => {
                const isActive = active === f.value;
                return (
                    <TouchableOpacity
                        key={f.value}
                        style={[
                            styles.card,
                            isActive && { borderColor: f.color, borderWidth: 2, backgroundColor: f.bg },
                        ]}
                        onPress={() => onChange(f.value)}
                        activeOpacity={0.75}
                    >
                        <View style={[styles.iconWrap, { backgroundColor: isActive ? f.bg : '#f1f5f9' }]}>
                            <Ionicons
                                name={f.icon}
                                size={16}
                                color={isActive ? f.color : '#94a3b8'}
                            />
                        </View>
                        <Text style={[styles.count, isActive && { color: f.color }]}>
                            {f.count}
                        </Text>
                        <Text style={[styles.label, isActive && { color: f.color }]} numberOfLines={1}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    row:    { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 7 },
    card: {
        flex: 1,
        minWidth: 58,
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 6,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    iconWrap: {
        width: 30, height: 30, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 6,
    },
    count: {
        fontSize: 18, fontWeight: '800', color: '#0f172a', lineHeight: 22,
    },
    label: {
        fontSize: 10, fontWeight: '600', color: '#94a3b8',
        marginTop: 2, textAlign: 'center',
    },
});
