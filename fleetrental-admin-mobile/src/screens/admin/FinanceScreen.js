import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl,
    ActivityIndicator, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getFinances } from '../../api';

const PERIODS = [
    { value: 'month',   label: 'Ce mois' },
    { value: 'quarter', label: '3 mois' },
    { value: 'year',    label: 'Cette année' },
];

function KpiCard({ icon, label, value, sub, color, bg }) {
    return (
        <View style={[styles.kpiCard, { borderLeftColor: color }]}>
            <View style={[styles.kpiIconWrap, { backgroundColor: bg }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.kpiLabel}>{label}</Text>
                <Text style={[styles.kpiValue, { color }]}>{value}</Text>
                {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
            </View>
        </View>
    );
}

const STATUS_LABELS = { ongoing: 'En cours', completed: 'Terminée', cancelled: 'Annulée' };
const STATUS_COLORS = { ongoing: '#2563eb', completed: '#16a34a', cancelled: '#dc2626' };

export default function FinanceScreen() {
    const [data,       setData]       = useState(null);
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [period,     setPeriod]     = useState('year');
    const loaded = useRef(false);

    const load = async (p = period, isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else if (!loaded.current) setLoading(true);
        try {
            const d = await getFinances(p);
            setData(d);
            loaded.current = true;
        } catch (_) {}
        finally { setLoading(false); setRefreshing(false); }
    };

    useFocusEffect(useCallback(() => { load(period); }, []));

    function changePeriod(p) {
        setPeriod(p);
        loaded.current = false;
        load(p);
    }

    if (loading) return (
        <View style={styles.center}><ActivityIndicator size="large" color="#1e3a5f" /></View>
    );

    const s = data?.summary || {};
    const maxRev = Math.max(...(data?.monthly_data || []).map(m => m.revenue), 1);

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(period, true)} colors={['#1e3a5f']} />}
            >
                {/* Période */}
                <View style={styles.periodRow}>
                    {PERIODS.map(p => (
                        <TouchableOpacity
                            key={p.value}
                            style={[styles.periodChip, period === p.value && styles.periodChipActive]}
                            onPress={() => changePeriod(p.value)}
                        >
                            <Text style={[styles.periodText, period === p.value && styles.periodTextActive]}>{p.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* KPIs */}
                <Text style={styles.sectionTitle}>Résumé financier</Text>
                <View style={styles.kpiList}>
                    <KpiCard icon="trending-up" label="Chiffre d'affaires" value={`${Number(s.total_revenue ?? 0).toFixed(0)} MAD`} color="#2563eb" bg="#eff6ff" />
                    <KpiCard icon="checkmark-circle" label="Montant encaissé" value={`${Number(s.total_collected ?? 0).toFixed(0)} MAD`} color="#16a34a" bg="#f0fdf4" />
                    <KpiCard icon="time" label="Reste à encaisser" value={`${Number(s.outstanding ?? 0).toFixed(0)} MAD`} color="#d97706" bg="#fffbeb" />
                    <KpiCard icon="construct" label="Charges maintenance" value={`${Number(s.total_expenses ?? 0).toFixed(0)} MAD`} color="#dc2626" bg="#fef2f2" />
                    <KpiCard
                        icon="wallet"
                        label="Bénéfice net"
                        value={`${Number(s.net_profit ?? 0).toFixed(0)} MAD`}
                        color={s.net_profit >= 0 ? '#16a34a' : '#dc2626'}
                        bg={s.net_profit >= 0 ? '#f0fdf4' : '#fef2f2'}
                        sub={s.net_profit >= 0 ? 'Positif ✓' : 'Négatif ✗'}
                    />
                </View>

                {/* Statuts paiement */}
                <Text style={styles.sectionTitle}>Statuts de paiement</Text>
                <View style={styles.card}>
                    {[
                        { label: 'Payés intégralement', count: data?.payment_status?.fully_paid ?? 0, color: '#16a34a', icon: 'checkmark-circle' },
                        { label: 'Paiement partiel',    count: data?.payment_status?.partial ?? 0,    color: '#d97706', icon: 'time' },
                        { label: 'Non payés',           count: data?.payment_status?.unpaid ?? 0,     color: '#dc2626', icon: 'close-circle' },
                    ].map((item, i) => (
                        <View key={i} style={styles.payRow}>
                            <Ionicons name={item.icon} size={18} color={item.color} />
                            <Text style={styles.payLabel}>{item.label}</Text>
                            <View style={[styles.payBadge, { backgroundColor: item.color + '15' }]}>
                                <Text style={[styles.payCount, { color: item.color }]}>{item.count}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Évolution mensuelle */}
                <Text style={styles.sectionTitle}>Évolution mensuelle (12 mois)</Text>
                <View style={styles.card}>
                    {(data?.monthly_data || []).slice(-6).map((m, i) => (
                        <View key={i} style={styles.monthRow}>
                            <Text style={styles.monthLabel}>{m.month}</Text>
                            <View style={{ flex: 1, gap: 3 }}>
                                <View style={styles.barTrack}>
                                    <View style={[styles.barFill, { width: `${Math.round((m.revenue / maxRev) * 100)}%`, backgroundColor: '#2563eb' }]} />
                                </View>
                                <View style={styles.barTrack}>
                                    <View style={[styles.barFill, { width: `${Math.round((m.expenses / maxRev) * 100)}%`, backgroundColor: '#dc2626' }]} />
                                </View>
                            </View>
                            <Text style={styles.monthProfit(m.profit)}>{m.profit >= 0 ? '+' : ''}{Number(m.profit).toFixed(0)}</Text>
                        </View>
                    ))}
                    <View style={styles.legend}>
                        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} /><Text style={styles.legendText}>Revenus</Text></View>
                        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#dc2626' }]} /><Text style={styles.legendText}>Charges</Text></View>
                    </View>
                </View>

                {/* Locations récentes */}
                <Text style={styles.sectionTitle}>Transactions récentes</Text>
                <View style={styles.card}>
                    {(data?.recent_rentals || []).map((r, i) => (
                        <View key={i} style={[styles.txRow, i < (data.recent_rentals.length - 1) && styles.txBorder]}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.txName}>{r.customer}</Text>
                                <Text style={styles.txVehicle}>{r.vehicle} · {r.start_date}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end', gap: 3 }}>
                                <Text style={styles.txTotal}>{Number(r.total).toFixed(0)} MAD</Text>
                                {r.remaining > 0 && (
                                    <Text style={styles.txRemaining}>Reste: {Number(r.remaining).toFixed(0)} MAD</Text>
                                )}
                                <View style={[styles.txStatus, { backgroundColor: (STATUS_COLORS[r.status] || '#64748b') + '15' }]}>
                                    <Text style={[styles.txStatusText, { color: STATUS_COLORS[r.status] || '#64748b' }]}>
                                        {STATUS_LABELS[r.status] || r.status}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                    {!data?.recent_rentals?.length && <Text style={styles.emptyText}>Aucune transaction</Text>}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe:    { flex: 1, backgroundColor: '#f8fafc' },
    center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { padding: 16, paddingBottom: 40 },

    periodRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
    periodChip:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
    periodChipActive: { backgroundColor: '#1e3a5f', borderColor: '#1e3a5f' },
    periodText:       { fontSize: 13, fontWeight: '600', color: '#64748b' },
    periodTextActive: { color: '#fff' },

    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 10, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },

    kpiList: { gap: 8 },
    kpiCard: {
        backgroundColor: '#fff', borderRadius: 14, padding: 14,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderLeftWidth: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    },
    kpiIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    kpiLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
    kpiValue: { fontSize: 18, fontWeight: '800', marginTop: 2 },
    kpiSub:   { fontSize: 11, color: '#94a3b8', marginTop: 2 },

    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
        borderWidth: 1, borderColor: '#f1f5f9',
    },

    payRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
    payLabel: { flex: 1, fontSize: 14, color: '#475569', fontWeight: '600' },
    payBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    payCount: { fontSize: 13, fontWeight: '800' },

    monthRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
    monthLabel:  { fontSize: 11, color: '#94a3b8', fontWeight: '600', width: 48 },
    barTrack:    { flex: 1, height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
    barFill:     { height: 6, borderRadius: 3 },
    monthProfit: (p) => ({ fontSize: 11, fontWeight: '800', width: 46, textAlign: 'right', color: p >= 0 ? '#16a34a' : '#dc2626' }),
    legend:      { flexDirection: 'row', gap: 16, marginTop: 12, justifyContent: 'center' },
    legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot:   { width: 8, height: 8, borderRadius: 4 },
    legendText:  { fontSize: 12, color: '#64748b' },

    txRow:       { paddingVertical: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    txBorder:    { borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
    txName:      { fontSize: 14, fontWeight: '700', color: '#0f172a' },
    txVehicle:   { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    txTotal:     { fontSize: 14, fontWeight: '800', color: '#0f172a' },
    txRemaining: { fontSize: 11, color: '#d97706', fontWeight: '600' },
    txStatus:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    txStatusText:{ fontSize: 10, fontWeight: '700' },

    emptyText: { textAlign: 'center', color: '#94a3b8', paddingVertical: 20, fontSize: 14 },
});
