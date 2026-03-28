import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { LoadingScreen } from '@/components/LoadingScreen';
import {
  BrandColor,
  BrandColorLight,
  CardShadow,
  Colors,
  Spacing,
  ModalOverlayColor,
  PlaceholderColor,
} from '@/constants/theme';
import { useAuth } from '@/lib/hooks/useAuth';
import { useMenu } from '@/lib/hooks/useMenu';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils/formatCurrency';

export default function AdminMenuScreen() {
  const { profile } = useAuth();
  const { categories, items, loading, refetch } = useMenu();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const activeCategoryId = selectedCategory || categories[0]?.id;
  const categoryItems = items.filter((i) => i.category_id === activeCategoryId);

  function handleAdd() {
    setEditId(null);
    setName('');
    setShowModal(true);
  }

  function handleEdit(id: string, currentName: string) {
    setEditId(id);
    setName(currentName);
    setShowModal(true);
  }

  async function handleSave() {
    if (!name.trim() || !profile) return;
    if (editId) {
      await supabase.from('menu_categories').update({ name: name.trim() }).eq('id', editId);
    } else {
      await supabase.from('menu_categories').insert({
        restaurant_id: profile.restaurant_id,
        name: name.trim(),
        sort_order: categories.length + 1,
      });
    }
    setShowModal(false);
    refetch();
  }

  async function handleDelete(id: string, catName: string) {
    const catItems = items.filter((i) => i.category_id === id);
    if (catItems.length > 0) {
      Alert.alert('Cannot Delete', `"${catName}" has ${catItems.length} items. Remove items first.`);
      return;
    }
    Alert.alert('Delete Category', `Delete "${catName}"?`, [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('menu_categories').delete().eq('id', id);
          refetch();
        },
      },
    ]);
  }

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={categoryItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={styles.heading}>Menu Management</Text>
              <Pressable style={styles.addBtn} onPress={handleAdd}>
                <Text style={styles.addBtnText}>+</Text>
              </Pressable>
            </View>

            {/* Category Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryPills}
            >
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.pill,
                    activeCategoryId === cat.id && styles.pillActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                  onLongPress={() => handleEdit(cat.id, cat.name)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      activeCategoryId === cat.id && styles.pillTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.itemCard}
            onPress={() => router.push(`/(admin)/menu/${item.category_id}`)}
          >
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.description && (
                <Text style={styles.itemDesc} numberOfLines={1}>
                  {item.description}
                </Text>
              )}
            </View>
            <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
          </Pressable>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.footerTitle}>Edit Categories</Text>
            <View style={styles.categoryList}>
              {categories.map((cat) => (
                <View key={cat.id} style={styles.categoryRow}>
                  <Pressable
                    style={styles.categoryChip}
                    onPress={() => handleEdit(cat.id, cat.name)}
                  >
                    <Text style={styles.categoryChipText}>{cat.name}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(cat.id, cat.name)}
                  >
                    <Text style={styles.deleteIcon}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
            <Pressable style={styles.createCategoryBtn} onPress={handleAdd}>
              <Text style={styles.createCategoryText}>+ CREATE NEW CATEGORY</Text>
            </Pressable>
          </View>
        }
      />

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editId ? 'Edit Category' : 'New Category'}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Category name"
              placeholderTextColor={PlaceholderColor}
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowModal(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSaveBtn} onPress={handleSave}>
                <Text style={styles.modalSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  list: {
    padding: Spacing.three,
    paddingBottom: 100,
  },
  header: {
    marginBottom: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.light.text,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BrandColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  categoryPills: {
    gap: 8,
    paddingBottom: 4,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.light.backgroundElement,
  },
  pillActive: {
    backgroundColor: BrandColor,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    ...CardShadow,
  },
  itemInfo: {
    flex: 1,
    marginRight: Spacing.three,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  itemDesc: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColor,
  },
  footer: {
    marginTop: Spacing.five,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: Spacing.four,
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.three,
  },
  categoryList: {
    gap: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryChip: {
    flex: 1,
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  categoryChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '700',
  },
  createCategoryBtn: {
    marginTop: Spacing.three,
    borderWidth: 2,
    borderColor: BrandColor,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createCategoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColor,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ModalOverlayColor,
    padding: Spacing.four,
  },
  modalContent: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: Spacing.four,
    width: '100%',
    maxWidth: 400,
    ...CardShadow,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.three,
  },
  modalInput: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 14,
    padding: Spacing.three,
    fontSize: 16,
    color: Colors.light.text,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  modalCancel: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    padding: Spacing.two,
  },
  modalSaveBtn: {
    backgroundColor: BrandColor,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 12,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
