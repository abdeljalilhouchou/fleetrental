import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
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
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
            style={styles.scroll}
        >
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
                                size={18}
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
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: { flexGrow: 0 },
    row:    { paddingHorizontal: 16, paddingVertical: 8, gap: 10 },
    card: {
        width: 90,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
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
        width: 36, height: 36, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 8,
    },
    count: {
        fontSize: 22, fontWeight: '800', color: '#0f172a', lineHeight: 26,
    },
    label: {
        fontSize: 11, fontWeight: '600', color: '#94a3b8',
        marginTop: 3, textAlign: 'center',
    },
});
