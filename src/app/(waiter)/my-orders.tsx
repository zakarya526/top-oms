import { router } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { LoadingScreen } from '@/components/LoadingScreen';
import { OrderCard } from '@/components/OrderCard';
import { BrandColor, BrandColorLight, CardShadow, Colors, Spacing, StatusColors } from '@/constants/theme';
import { useAuth } from '@/lib/hooks/useAuth';
import { useOrders } from '@/lib/hooks/useOrders';
import { useResponsive } from '@/lib/hooks/useResponsive';

export default function MyOrdersScreen() {
  const { profile } = useAuth();
  const { orders, loading } = useOrders({
    waiterId: profile?.id,
    status: ['pending', 'preparing', 'ready', 'served'],
  });

  const { numColumns: getColumns } = useResponsive();
  const columns = getColumns({ compact: 1, medium: 2, wide: 2 });

  if (loading) return <LoadingScreen />;

  if (orders.length === 0) {
    return <EmptyState title="No active orders" message="Select a table to create a new order." />;
  }

  return (
    <FlatList
      key={`my-orders-${columns}`}
      data={orders}
      keyExtractor={(item) => item.id}
      numColumns={columns}
      contentContainerStyle={styles.list}
      columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
      ListHeaderComponent={
        <View style={styles.header}>
          <View>
            <Text style={styles.sessionLabel}>CURRENT SESSION</Text>
            <Text style={styles.heading}>My Orders</Text>
          </View>
          <View style={styles.activeCount}>
            <Text style={styles.activeNumber}>{orders.length}</Text>
            <Text style={styles.activeLabel}>ACTIVE{'\n'}TASKS</Text>
          </View>
        </View>
      }
      ListHeaderComponentStyle={styles.headerWrapper}
      stickyHeaderIndices={[0]}
      renderItem={({ item }) => (
        <View style={styles.cardWrapper}>
          <OrderCard
            order={item}
            showTable
            onPress={() => router.push(`/(waiter)/order/${item.id}`)}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: Spacing.three,
    paddingBottom: 100,
    gap: 12,
  },
  columnWrapper: {
    gap: 12,
  },
  cardWrapper: {
    flex: 1,
  },
  headerWrapper: {
    backgroundColor: Colors.light.background,
    paddingBottom: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    letterSpacing: 1,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.light.text,
    marginTop: 2,
  },
  activeCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.light.text,
  },
  activeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.three,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    ...CardShadow,
  },
  statIcon: {
    fontSize: 20,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    letterSpacing: 0.3,
  },
});
