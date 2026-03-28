import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LoadingScreen } from '@/components/LoadingScreen';
import { MenuItemCard } from '@/components/MenuItemCard';
import { BottomTabInset, BrandColor, BrandColorLight, CardShadow, Colors, Spacing } from '@/constants/theme';
import { useMenu } from '@/lib/hooks/useMenu';
import { useOrderStore } from '@/lib/stores/orderStore';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { formatCurrency } from '@/lib/utils/formatCurrency';

export default function MenuScreen() {
  useLocalSearchParams<{ tableId: string }>();
  const { categories, loading, getItemsByCategory } = useMenu();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { items, addItem, removeItem, getTotal, getItemCount } = useOrderStore();
  const { numColumns: getColumns } = useResponsive();
  const columns = getColumns({ compact: 1, medium: 2, wide: 2 });

  const activeCategoryId = selectedCategory || categories[0]?.id;
  const categoryItems = activeCategoryId ? getItemsByCategory(activeCategoryId) : [];

  function getQuantity(menuItemId: string) {
    return items.find((i) => i.menuItem.id === menuItemId)?.quantity || 0;
  }

  if (loading) return <LoadingScreen />;

  const itemCount = getItemCount();
  const total = getTotal();

  return (
    <View style={styles.container}>
      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabsScroll}
        contentContainerStyle={styles.categoryTabs}
      >
        {categories.map((cat) => (
          <Pressable
            key={cat.id}
            style={[
              styles.categoryTab,
              activeCategoryId === cat.id && styles.categoryTabActive,
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text
              style={[
                styles.categoryTabText,
                activeCategoryId === cat.id && styles.categoryTabTextActive,
              ]}
            >
              {cat.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Menu items */}
      <FlatList
        key={`menu-${columns}`}
        data={categoryItems}
        keyExtractor={(item) => item.id}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
        renderItem={({ item }) => (
          <MenuItemCard
            item={item}
            quantity={getQuantity(item.id)}
            onAdd={() => addItem(item)}
            onRemove={() => removeItem(item.id)}
          />
        )}
        contentContainerStyle={styles.itemList}
      />

      {/* Floating cart bar */}
      {itemCount > 0 && (
        <Pressable
          style={styles.cartBar}
          onPress={() => router.push('/(waiter)/order-summary')}
        >
          <View style={styles.cartLeft}>
            <Text style={styles.cartLabel}>Your Table Order</Text>
            <Text style={styles.cartCount}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
          </View>
          <Text style={styles.cartTotal}>{formatCurrency(total)}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  categoryTabsScroll: {
    flexGrow: 0,
  },
  categoryTabs: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.light.backgroundElement,
  },
  categoryTabActive: {
    backgroundColor: BrandColor,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },
  itemList: {
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: 160 + BottomTabInset,
    gap: Spacing.two,
  },
  columnWrapper: {
    gap: Spacing.two,
  },
  cartBar: {
    position: 'absolute',
    bottom: BottomTabInset + 12,
    left: Spacing.three,
    right: Spacing.three,
    backgroundColor: BrandColor,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    ...CardShadow,
    shadowColor: BrandColor,
    shadowOpacity: 0.35,
  },
  cartLeft: {
    gap: 2,
  },
  cartLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  cartCount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cartTotal: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});
