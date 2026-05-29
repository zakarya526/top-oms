import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BrandColor, Colors, Spacing } from '@/constants/theme';
import { Tables } from '@/lib/types/database';
import { formatCurrency } from '@/lib/utils/formatCurrency';

/** Subtotal / service / total breakdown for an order, shared by the waiter and
 *  admin order-detail screens. total_amount = subtotal + service_charge. */
export function OrderTotals({
  order,
}: {
  order: Pick<Tables<'orders'>, 'total_amount' | 'service_charge'>;
}) {
  return (
    <View style={styles.totals}>
      <View style={styles.subRow}>
        <Text style={styles.subLabel}>Subtotal</Text>
        <Text style={styles.subValue}>
          {formatCurrency(order.total_amount - order.service_charge)}
        </Text>
      </View>
      {order.service_charge > 0 && (
        <View style={styles.subRow}>
          <Text style={styles.subLabel}>Service</Text>
          <Text style={styles.subValue}>{formatCurrency(order.service_charge)}</Text>
        </View>
      )}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalAmount}>{formatCurrency(order.total_amount)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  totals: { marginTop: Spacing.two },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  subLabel: { fontSize: 15, color: Colors.light.textSecondary },
  subValue: { fontSize: 15, color: Colors.light.text },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    marginTop: Spacing.two,
    borderTopWidth: 2,
    borderTopColor: Colors.light.backgroundElement,
  },
  totalLabel: { fontSize: 20, fontWeight: '700' },
  totalAmount: { fontSize: 22, fontWeight: '700', color: BrandColor },
});
