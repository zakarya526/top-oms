import { useLocalSearchParams, router } from 'expo-router';
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
import { Colors, Spacing, KitchenColor, StatusColors } from '@/constants/theme';
import { useOrder } from '@/lib/hooks/useOrders';
import { supabase } from '@/lib/supabase';
import { getTimeSince } from '@/lib/utils/getTimeSince';

export default function KitchenOrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { order, loading } = useOrder(orderId);

  if (loading || !order) return <LoadingScreen />;

  async function handleStatusChange(newStatus: 'preparing' | 'ready') {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);
    if (error) Alert.alert('Error', error.message);
    else router.back();
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
            <Text style={styles.time}>Ordered {getTimeSince(order.created_at)}</Text>
            {order.notes && (
              <Text style={styles.notes}>Note: {order.notes}</Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Text style={styles.itemQty}>{item.quantity}x</Text>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.item_name}</Text>
              {item.notes && <Text style={styles.itemNote}>{item.notes}</Text>}
            </View>
          </View>
        )}
      />

      <View style={styles.actions}>
        {order.status === 'pending' && (
          <Pressable
            style={[styles.actionBtn, { backgroundColor: StatusColors.preparing }]}
            onPress={() => handleStatusChange('preparing')}
          >
            <Text style={styles.actionBtnText}>Start Preparing</Text>
          </Pressable>
        )}
        {order.status === 'preparing' && (
          <Pressable
            style={[styles.actionBtn, { backgroundColor: StatusColors.ready }]}
            onPress={() => handleStatusChange('ready')}
          >
            <Text style={styles.actionBtnText}>Mark Ready</Text>
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
  tableLabel: { fontSize: 26, fontWeight: '700', color: Colors.light.text },
  time: { fontSize: 15, color: Colors.light.textSecondary },
  notes: { fontSize: 15, color: StatusColors.pending, fontWeight: '500', fontStyle: 'italic' },
  itemRow: {
    flexDirection: 'row', paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.backgroundElement,
  },
  itemQty: { fontSize: 17, fontWeight: '700', color: KitchenColor, width: 40 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 17, color: Colors.light.text },
  itemNote: { fontSize: 14, color: StatusColors.pending, fontStyle: 'italic', marginTop: 2 },
  actions: { padding: Spacing.three },
  actionBtn: { padding: Spacing.three, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
