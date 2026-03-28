import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { LoadingScreen } from '@/components/LoadingScreen';
import {
  BrandColor,
  BrandColorLight,
  CardShadow,
  Colors,
  Spacing,
  StatusColors,
  StatusBackgrounds,
} from '@/constants/theme';
import { supabase } from '@/lib/supabase';

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  readyOrders: number;
  occupiedTables: number;
  totalTables: number;
}

export default function AdminDashboardScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => fetchStats())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchStats() {
    const [ordersRes, tablesRes] = await Promise.all([
      supabase.from('orders').select('status'),
      supabase.from('tables').select('status'),
    ]);

    const orders = ordersRes.data || [];
    const tables = tablesRes.data || [];

    setStats({
      totalOrders: orders.filter((o) => !['completed', 'cancelled'].includes(o.status)).length,
      pendingOrders: orders.filter((o) => o.status === 'pending').length,
      preparingOrders: orders.filter((o) => o.status === 'preparing').length,
      readyOrders: orders.filter((o) => o.status === 'ready').length,
      occupiedTables: tables.filter((t) => t.status === 'occupied').length,
      totalTables: tables.length,
    });
    setLoading(false);
  }

  if (loading || !stats) return <LoadingScreen />;

  const occupancyPercent = stats.totalTables > 0
    ? Math.round((stats.occupiedTables / stats.totalTables) * 100)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Kitchen Performance</Text>
      <Text style={styles.subheading}>
        Real-time overview of the hearth's activities, managing efficiency with silent authority.
      </Text>

      {/* Stats Grid */}
      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalOrders}</Text>
          <Text style={styles.statLabel}>ACTIVE{'\n'}ORDERS</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.occupiedTables}</Text>
          <Text style={styles.statLabel}>ACTIVE{'\n'}TABLES</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pendingOrders + stats.preparingOrders}</Text>
          <Text style={styles.statLabel}>STAFF ON{'\n'}DUTY</Text>
        </View>
        <View style={[styles.statCard, styles.revenueCard]}>
          <Text style={styles.revenueIcon}>💰</Text>
          <Text style={styles.revenueValue}>$4,820</Text>
          <Text style={styles.revenueLabel}>REVENUE TODAY</Text>
        </View>
      </View>

      {/* Table Occupancy */}
      <View style={styles.tableSection}>
        <Text style={styles.sectionTitle}>Table Occupancy</Text>
        <View style={styles.occupancyRow}>
          <Text style={styles.occupancyText}>
            {stats.occupiedTables} / {stats.totalTables} tables
          </Text>
          <Text style={styles.occupancyPercent}>{occupancyPercent}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${occupancyPercent}%` }]} />
        </View>
      </View>

      {/* Pending Orders */}
      <View style={styles.pendingSection}>
        <Text style={styles.sectionTitle}>Pending Orders</Text>
        {stats.pendingOrders === 0 ? (
          <Text style={styles.emptyText}>No pending orders</Text>
        ) : (
          <View style={styles.pendingCard}>
            <View style={styles.pendingDot} />
            <Text style={styles.pendingText}>
              {stats.pendingOrders} orders awaiting preparation
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: Spacing.three,
    paddingBottom: 100,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.light.text,
  },
  subheading: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 6,
    marginBottom: Spacing.four,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: Spacing.three,
    ...CardShadow,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  revenueCard: {
    backgroundColor: BrandColorLight,
  },
  revenueIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 24,
    fontWeight: '800',
    color: BrandColor,
  },
  revenueLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandColor,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  tableSection: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: Spacing.three,
    marginTop: Spacing.two,
    ...CardShadow,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  occupancyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  occupancyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  occupancyPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: BrandColor,
    borderRadius: 4,
  },
  pendingSection: {
    marginTop: Spacing.four,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: StatusBackgrounds.pending,
    borderRadius: 14,
    padding: Spacing.three,
  },
  pendingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: StatusColors.pending,
  },
  pendingText: {
    fontSize: 14,
    fontWeight: '600',
    color: StatusColors.pending,
  },
});
