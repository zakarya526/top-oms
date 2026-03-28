import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandColor, CardShadow, Colors, Spacing, StatusColors } from '@/constants/theme';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { getTimeSince } from '@/lib/utils/getTimeSince';
import { OrderWithItems } from '@/lib/hooks/useOrders';
import { StatusBadge } from './StatusBadge';

interface OrderCardProps {
  order: OrderWithItems;
  onPress?: () => void;
  showTable?: boolean;
  showWaiter?: boolean;
}

export function OrderCard({ order, onPress, showTable = true, showWaiter = false }: OrderCardProps) {
  const timeSince = getTimeSince(order.created_at);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {showTable && order.table && (
            <View style={styles.tableBadge}>
              <Text style={styles.tableBadgeText}>T{order.table.table_number}</Text>
            </View>
          )}
          <View style={styles.headerInfo}>
            {showTable && order.table && (
              <Text style={styles.tableLabel}>Table {String(order.table.table_number).padStart(2, '0')}</Text>
            )}
            <Text style={styles.itemCount}>
              {order.order_items.reduce((sum, i) => sum + i.quantity, 0)} Items
            </Text>
          </View>
        </View>
        <StatusBadge status={order.status} size="sm" />
      </View>

      <View style={styles.footer}>
        <Text style={styles.time}>{timeSince}</Text>
        <Text style={styles.total}>{formatCurrency(order.total_amount)}</Text>
      </View>

      {showWaiter && order.waiter && (
        <Text style={styles.waiterText}>{order.waiter.full_name}</Text>
      )}

      {order.notes && <Text style={styles.notes}>{order.notes}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: Spacing.three,
    gap: 12,
    ...CardShadow,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tableBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: BrandColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  headerInfo: {
    gap: 2,
  },
  tableLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  itemCount: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  total: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.text,
  },
  waiterText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  notes: {
    fontSize: 13,
    color: StatusColors.pending,
    fontStyle: 'italic',
  },
});
