import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import {
  BottomTabInset,
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
import { playOrderSound } from '@/lib/utils/orderSounds';

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
      // Server computes prices/total from the catalog and marks the table
      // occupied; the client never sets prices (see the create_order RPC).
      const { error } = await supabase.rpc('create_order', {
        p_table_id: tableId,
        p_notes: orderNotes,
        p_items: items.map((item) => ({
          menu_item_id: item.menuItem.id,
          quantity: item.quantity,
          notes: item.notes || null,
        })),
      });

      if (error) throw error;

      playOrderSound('added'); // acting-device chime: order sent to kitchen
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
    <ResponsiveContainer>
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <FlatList
        data={items}
        keyExtractor={(item) => item.menuItem.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
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
      </KeyboardAvoidingView>
    </SafeAreaView>
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    marginBottom: Spacing.three + BottomTabInset,
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
