import { router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { LoadingScreen } from '@/components/LoadingScreen';
import { OrderCard } from '@/components/OrderCard';
import { BrandColor, Colors, Spacing } from '@/constants/theme';
import { useOrders } from '@/lib/hooks/useOrders';
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

const Separator = () => <View style={styles.separator} />;

export default function AdminOrdersScreen() {
  const [filterIdx, setFilterIdx] = useState(0);
  const activeFilter = STATUS_FILTERS[filterIdx];
  const { orders, loading } = useOrders({ status: activeFilter.value });

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
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

      {orders.length === 0 ? (
        <EmptyState title="No orders" message={`No ${activeFilter.label.toLowerCase()} orders found.`} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={Separator}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              showTable
              showWaiter
              onPress={() => router.push(`/(admin)/order/${item.id}`)}
            />
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
  filters: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  filterChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundElement,
  },
  filterChipActive: {
    backgroundColor: BrandColor,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    padding: Spacing.three,
  },
  separator: {
    height: Spacing.three,
  },
});
