import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BrandColor,
  BrandColorLight,
  CardShadow,
  Colors,
  Spacing,
  PlaceholderColor,
} from '@/constants/theme';
import { useAuth } from '@/lib/hooks/useAuth';
import { useOrderStore } from '@/lib/stores/orderStore';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils/formatCurrency';

const SERVICE_RATE = 0.1;

export default function OrderSummaryScreen() {
  const { profile } = useAuth();
  const { items, orderNotes, setOrderNotes, getTotal, updateQuantity, clearCart, tableId } =
    useOrderStore();
  const [submitting, setSubmitting] = useState(false);

  const subtotal = getTotal();
  const service = subtotal * SERVICE_RATE;
  const total = subtotal + service;

  async function handleSubmit() {
    if (!profile || !tableId || items.length === 0) return;

    setSubmitting(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: profile.restaurant_id,
          table_id: tableId,
          waiter_id: profile.id,
          status: 'pending',
          notes: orderNotes || null,
          total_amount: total,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menuItem.id,
        restaurant_id: profile.restaurant_id,
        item_name: item.menuItem.name,
        item_price: item.menuItem.price,
        quantity: item.quantity,
        notes: item.notes || null,
      }));

      const [itemsResult] = await Promise.all([
        supabase.from('order_items').insert(orderItems),
        supabase.from('tables').update({ status: 'occupied' }).eq('id', tableId),
      ]);

      if (itemsResult.error) throw itemsResult.error;

      clearCart();
      Alert.alert('Order Placed', 'Your order has been sent to the kitchen.', [
        { text: 'OK', onPress: () => router.replace('/(waiter)/my-orders') },
      ]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to submit order';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.menuItem.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.heading}>Selected Items</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.menuItem.name}</Text>
              <Text style={styles.itemPrice}>{formatCurrency(item.menuItem.price)}</Text>
              <Text style={styles.quantityLabel}>QUANTITY: {item.quantity}</Text>
            </View>
            <View style={styles.quantityControls}>
              <Pressable
                style={styles.qtyBtn}
                onPress={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
              >
                <Text style={styles.qtyBtnMinus}>-</Text>
              </Pressable>
              <Pressable
                style={[styles.qtyBtn, styles.qtyBtnAdd]}
                onPress={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
              >
                <Text style={styles.qtyBtnPlus}>+</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            {/* Special Instructions */}
            <Text style={styles.sectionTitle}>Special Instructions</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="e.g. 'No onions', 'Dressing on the side'..."
              placeholderTextColor={PlaceholderColor}
              value={orderNotes}
              onChangeText={setOrderNotes}
              multiline
            />

            {/* Totals */}
            <View style={styles.totalsSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>SUBTOTAL</Text>
                <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>SERVICE (10%)</Text>
                <Text style={styles.totalValue}>{formatCurrency(service)}</Text>
              </View>
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>TOTAL AMOUNT DUE</Text>
                <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
              </View>
            </View>
          </View>
        }
      />

      <Pressable
        style={[styles.submitButton, submitting && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={submitting || items.length === 0}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>SUBMIT ORDER  →</Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  list: {
    padding: Spacing.three,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.three,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    ...CardShadow,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: BrandColor,
  },
  quantityLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BrandColorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnAdd: {
    backgroundColor: BrandColor,
  },
  qtyBtnMinus: {
    fontSize: 18,
    fontWeight: '700',
    color: BrandColor,
  },
  qtyBtnPlus: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    marginTop: Spacing.four,
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  notesInput: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 14,
    padding: Spacing.three,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  totalsSection: {
    gap: 12,
    paddingTop: Spacing.three,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  grandTotalRow: {
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginTop: Spacing.two,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    letterSpacing: 0.5,
  },
  grandTotalValue: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.light.text,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: BrandColor,
    margin: Spacing.three,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    ...CardShadow,
    shadowColor: BrandColor,
    shadowOpacity: 0.3,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
