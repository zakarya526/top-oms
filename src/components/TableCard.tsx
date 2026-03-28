import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { BrandColor, CardShadow, Colors, Spacing } from '@/constants/theme';
import { Tables } from '@/lib/types/database';

type RestaurantTable = Tables<'tables'>;

interface TableCardProps {
  table: RestaurantTable;
  onPress: () => void;
}

export function TableCard({ table, onPress }: TableCardProps) {
  const isOccupied = table.status === 'occupied';

  return (
    <Pressable
      style={[styles.card, isOccupied && styles.occupied]}
      onPress={onPress}
    >
      <Text style={[styles.number, isOccupied && styles.occupiedText]}>
        {String(table.table_number).padStart(2, '0')}
      </Text>
      <Text style={[styles.status, isOccupied && styles.occupiedStatusText]}>
        {isOccupied ? 'IN USE' : 'EMPTY'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    ...CardShadow,
  },
  occupied: {
    backgroundColor: BrandColor,
    borderColor: BrandColor,
    ...CardShadow,
    shadowColor: BrandColor,
    shadowOpacity: 0.3,
  },
  number: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.light.text,
  },
  occupiedText: {
    color: '#FFFFFF',
  },
  status: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    letterSpacing: 1,
  },
  occupiedStatusText: {
    color: 'rgba(255,255,255,0.85)',
  },
});
