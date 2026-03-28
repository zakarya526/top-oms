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
import { Colors, Spacing, BrandColor, StatusColors, DangerColor, DangerBackground } from '@/constants/theme';
import { useOrder } from '@/lib/hooks/useOrders';
import { updateOrderStatus } from '@/lib/utils/updateOrderStatus';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { getTimeSince } from '@/lib/utils/getTimeSince';

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { order, loading } = useOrder(orderId);

  if (loading || !order) return <LoadingScreen />;

  async function handleStatusChange(newStatus: 'served' | 'completed' | 'cancelled') {
    const { error } = await updateOrderStatus(orderId, order!.table_id, newStatus);
    if (error) Alert.alert('Error', error);
  }

  function handleCancel() {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No' },
      { text: 'Yes', style: 'destructive', onPress: () => handleStatusChange('cancelled') },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={order.order_items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={styles.tableLabel}>
                Table {order.table?.table_number}
              </Text>
              <StatusBadge status={order.status} />
            </View>
            <Text style={styles.time}>{getTimeSince(order.created_at)}</Text>
            {order.notes && (
              <Text style={styles.notes}>Note: {order.notes}</Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Text style={styles.itemQty}>{item.quantity}x</Text>
            <Text style={styles.itemName}>{item.item_name}</Text>
            <Text style={styles.itemPrice}>
              {formatCurrency(item.item_price * item.quantity)}
            </Text>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>
              {formatCurrency(order.total_amount)}
            </Text>
          </View>
        }
      />

      <View style={styles.actions}>
        {order.status === 'pending' && (
          <Pressable style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel Order</Text>
          </Pressable>
        )}
        {order.status === 'ready' && (
          <Pressable
            style={styles.actionButton}
            onPress={() => handleStatusChange('served')}
          >
            <Text style={styles.actionText}>Mark as Served</Text>
          </Pressable>
        )}
        {order.status === 'served' && (
          <Pressable
            style={[styles.actionButton, { backgroundColor: StatusColors.completed }]}
            onPress={() => handleStatusChange('completed')}
          >
            <Text style={styles.actionText}>Mark as Completed</Text>
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
  time: { fontSize: 14, color: Colors.light.textSecondary },
  notes: { fontSize: 14, color: StatusColors.pending, fontStyle: 'italic' },
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.backgroundElement,
  },
  itemQty: { fontSize: 15, fontWeight: '600', color: BrandColor, width: 36 },
  itemName: { flex: 1, fontSize: 15, color: Colors.light.text },
  itemPrice: { fontSize: 15, fontWeight: '600', color: Colors.light.text },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: Spacing.three, marginTop: Spacing.two,
    borderTopWidth: 2, borderTopColor: Colors.light.backgroundElement,
  },
  totalLabel: { fontSize: 20, fontWeight: '700' },
  totalAmount: { fontSize: 22, fontWeight: '700', color: BrandColor },
  actions: { padding: Spacing.three, gap: Spacing.two },
  actionButton: {
    backgroundColor: BrandColor, padding: Spacing.three,
    borderRadius: 12, alignItems: 'center',
  },
  actionText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  cancelButton: {
    backgroundColor: DangerBackground, padding: Spacing.three,
    borderRadius: 12, alignItems: 'center',
  },
  cancelText: { color: DangerColor, fontSize: 17, fontWeight: '600' },
});
