import { router } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingScreen } from '@/components/LoadingScreen';
import { TableCard } from '@/components/TableCard';
import { BrandColor, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/hooks/useAuth';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useTables } from '@/lib/hooks/useTables';
import { useOrderStore } from '@/lib/stores/orderStore';

export default function TablesScreen() {
  const { tables, loading } = useTables();
  const { signOut, profile } = useAuth();
  const setTable = useOrderStore((s) => s.setTable);
  const clearCart = useOrderStore((s) => s.clearCart);

  const { numColumns: getColumns } = useResponsive();
  const columns = getColumns({ compact: 3, medium: 4, wide: 5 });

  function handleSelectTable(tableId: string) {
    clearCart();
    setTable(tableId);
    router.push(`/(waiter)/menu/${tableId}`);
  }

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        key={`tables-${columns}`}
        data={tables}
        keyExtractor={(item) => item.id}
        numColumns={columns}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={styles.heading}>Select Table</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.floor}>FLOOR 1</Text>
              <Pressable style={styles.signOut} onPress={signOut}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </Pressable>
            </View>
          </View>
        }
        ListHeaderComponentStyle={styles.headerWrapper}
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <TableCard table={item} onPress={() => handleSelectTable(item.id)} />
          </View>
        )}
        ListFooterComponent={
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendAvailable]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendOccupied]} />
              <Text style={styles.legendText}>Occupied</Text>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  grid: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    gap: Spacing.two,
  },
  cell: {
    flex: 1,
  },
  headerWrapper: {
    marginBottom: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.light.text,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  floor: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    letterSpacing: 1,
  },
  signOut: {
    paddingVertical: 4,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: Spacing.four,
    paddingVertical: Spacing.three,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendAvailable: {
    backgroundColor: '#10B981',
  },
  legendOccupied: {
    backgroundColor: BrandColor,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.text,
  },
});
