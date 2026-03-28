import { router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { LoadingScreen } from '@/components/LoadingScreen';
import { OrderCard } from '@/components/OrderCard';
import { BrandColor, Colors, Spacing } from '@/constants/theme';
import { useOrders } from '@/lib/hooks/useOrders';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { Enums } from '@/lib/types/database';

type OrderStatus = Enums<'order_status'>;

const STATUS_FILTERS: { label: string; value: OrderStatus[] }[] = [
  { label: 'Active', value: ['pending', 'preparing', 'ready', 'served'] },
  { label: 'Pending', value: ['pending'] },
  { label: 'Preparing', value: ['preparing'] },
  { label: 'Ready', value: ['ready'] },
  { label: 'Completed', value: ['completed'] },
  { label: 'Cancelled', value: ['cancelled'] },
];

export default function AdminOrdersScreen() {
  const [filterIdx, setFilterIdx] = useState(0);
  const activeFilter = STATUS_FILTERS[filterIdx];
  const { orders, loading } = useOrders({ status: activeFilter.value });
  const { numColumns: getColumns } = useResponsive();
  const columns = getColumns({ compact: 1, medium: 2, wide: 2 });

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filters}
        >
          {STATUS_FILTERS.map((f, idx) => (
            <Pressable
              key={f.label}
              style={[styles.filterChip, filterIdx === idx && styles.filterChipActive]}
              onPress={() => setFilterIdx(idx)}
            >
              <Text style={[styles.filterText, filterIdx === idx && styles.filterTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {orders.length === 0 ? (
        <EmptyState title="No orders" message={`No ${activeFilter.label.toLowerCase()} orders found.`} />
      ) : (
        <FlatList
          key={`admin-orders-${columns}`}
          data={orders}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          contentContainerStyle={styles.list}
          columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <OrderCard
                order={item}
                showTable
                showWaiter
                onPress={() => router.push(`/(admin)/order/${item.id}`)}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  filtersWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  filtersScroll: {
    flexGrow: 0,
  },
  filters: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.light.backgroundElement,
  },
  filterChipActive: {
    backgroundColor: BrandColor,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: Spacing.three,
    gap: 12,
  },
  columnWrapper: {
    gap: 12,
  },
  cardWrapper: {
    flex: 1,
  },
});
