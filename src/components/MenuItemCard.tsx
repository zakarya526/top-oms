import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandColor, BrandColorLight, CardShadow, Colors, Spacing } from '@/constants/theme';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { Tables } from '@/lib/types/database';

type MenuItem = Tables<'menu_items'>;

interface MenuItemCardProps {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export function MenuItemCard({ item, quantity, onAdd, onRemove }: MenuItemCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <Text style={styles.price}>{formatCurrency(item.price)}</Text>
      </View>
      <View style={styles.controls}>
        {quantity > 0 ? (
          <View style={styles.quantityRow}>
            <Pressable style={styles.qtyButton} onPress={onRemove}>
              <Text style={styles.qtyMinusText}>-</Text>
            </Pressable>
            <Text style={styles.quantity}>{quantity}</Text>
            <Pressable style={[styles.qtyButton, styles.qtyButtonAdd]} onPress={onAdd}>
              <Text style={styles.qtyAddText}>+</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.addButton} onPress={onAdd}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: Spacing.three,
    ...CardShadow,
  },
  info: {
    flex: 1,
    marginRight: Spacing.three,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  description: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColor,
    marginTop: 6,
  },
  controls: {
    alignItems: 'center',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BrandColorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonAdd: {
    backgroundColor: BrandColor,
  },
  qtyMinusText: {
    fontSize: 18,
    fontWeight: '700',
    color: BrandColor,
  },
  qtyAddText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quantity: {
    fontSize: 17,
    fontWeight: '800',
    minWidth: 24,
    textAlign: 'center',
    color: Colors.light.text,
  },
  addButton: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: BrandColorLight,
  },
  addButtonText: {
    color: BrandColor,
    fontSize: 14,
    fontWeight: '700',
  },
});
