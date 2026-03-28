import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingScreen } from '@/components/LoadingScreen';
import { StatusBadge } from '@/components/StatusBadge';
import { Colors, Spacing, AdminColor, StatusColors, DangerColor, DangerBackground } from '@/constants/theme';
import { useOrder } from '@/lib/hooks/useOrders';
import { updateOrderStatus } from '@/lib/utils/updateOrderStatus';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { Enums } from '@/lib/types/database';

type OrderStatus = Enums<'order_status'>;

const NEXT_STATUS: Partial<Record<OrderStatus, { label: string; next: OrderStatus; color: string }>> = {
  pending: { label: 'Mark Preparing', next: 'preparing', color: StatusColors.preparing },
  preparing: { label: 'Mark Ready', next: 'ready', color: StatusColors.ready },
  ready: { label: 'Mark Served', next: 'served', color: StatusColors.served },
  served: { label: 'Mark Completed', next: 'completed', color: StatusColors.completed },
};

export default function AdminOrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { order, loading } = useOrder(orderId);

  if (loading || !order) return <LoadingScreen />;

  async function handleStatusChange(newStatus: OrderStatus) {
    const { error } = await updateOrderStatus(orderId, order!.table_id, newStatus);
    if (error) Alert.alert('Error', error);
  }

  function handleCancel() {
    Alert.alert('Cancel Order', 'Are you sure?', [
      { text: 'No' },
      { text: 'Yes', style: 'destructive', onPress: () => handleStatusChange('cancelled') },
    ]);
  }

  const nextAction = NEXT_STATUS[order.status];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={order.order_items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={styles.tableLabel}>Table {order.table?.table_number}</Text>
              <StatusBadge status={order.status} />
            </View>
            {order.waiter && (
              <Text style={styles.waiter}>Waiter: {order.waiter.full_name}</Text>
            )}
            {order.notes && <Text style={styles.notes}>Note: {order.notes}</Text>}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Text style={styles.itemQty}>{item.quantity}x</Text>
            <Text style={styles.itemName}>{item.item_name}</Text>
            <Text style={styles.itemPrice}>{formatCurrency(item.item_price * item.quantity)}</Text>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{formatCurrency(order.total_amount)}</Text>
          </View>
        }
      />

      <View style={styles.actions}>
        {nextAction && (
          <Pressable
            style={[styles.actionBtn, { backgroundColor: nextAction.color }]}
            onPress={() => handleStatusChange(nextAction.next)}
          >
            <Text style={styles.actionBtnText}>{nextAction.label}</Text>
          </Pressable>
        )}
        {!['completed', 'cancelled'].includes(order.status) && (
          <Pressable style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>Cancel Order</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: Spacing.three },
  header: { gap: Spacing.two, marginBottom: Spacing.three },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tableLabel: { fontSize: 24, fontWeight: '700', color: Colors.light.text },
  waiter: { fontSize: 14, color: Colors.light.textSecondary },
  notes: { fontSize: 14, color: StatusColors.pending, fontStyle: 'italic' },
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.backgroundElement,
  },
  itemQty: { fontSize: 15, fontWeight: '600', color: AdminColor, width: 36 },
  itemName: { flex: 1, fontSize: 15 },
  itemPrice: { fontSize: 15, fontWeight: '600' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: Spacing.three, marginTop: Spacing.two,
    borderTopWidth: 2, borderTopColor: Colors.light.backgroundElement,
  },
  totalLabel: { fontSize: 20, fontWeight: '700' },
  totalAmount: { fontSize: 22, fontWeight: '700', color: AdminColor },
  actions: { padding: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.two },
  actionBtn: { padding: Spacing.three, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  cancelBtn: {
    backgroundColor: DangerBackground, padding: Spacing.three,
    borderRadius: 12, alignItems: 'center',
  },
  cancelBtnText: { color: DangerColor, fontSize: 17, fontWeight: '600' },
});
