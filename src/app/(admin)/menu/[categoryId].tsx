import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { LoadingScreen } from '@/components/LoadingScreen';
import { BrandColor, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/hooks/useAuth';
import { useMenu } from '@/lib/hooks/useMenu';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/lib/types/database';
import { formatCurrency } from '@/lib/utils/formatCurrency';

export default function AdminCategoryItemsScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { profile } = useAuth();
  const { categories, items, loading, refetch } = useMenu();
  const category = categories.find((c) => c.id === categoryId);
  const categoryItems = items
    .filter((i) => i.category_id === categoryId)
    .sort((a, b) => a.sort_order - b.sort_order);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', price: '', description: '' });

  function handleAdd() {
    setEditId(null);
    setForm({ name: '', price: '', description: '' });
    setShowModal(true);
  }

  function handleEdit(item: Tables<'menu_items'>) {
    setEditId(item.id);
    setForm({
      name: item.name,
      price: String(item.price),
      description: item.description || '',
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.price || !profile) return;
    const price = parseFloat(form.price);
    if (isNaN(price)) { Alert.alert('Error', 'Invalid price'); return; }

    if (editId) {
      await supabase.from('menu_items').update({
        name: form.name.trim(),
        price,
        description: form.description.trim() || null,
      }).eq('id', editId);
    } else {
      await supabase.from('menu_items').insert({
        restaurant_id: profile.restaurant_id,
        category_id: categoryId,
        name: form.name.trim(),
        price,
        description: form.description.trim() || null,
        sort_order: categoryItems.length + 1,
      });
    }
    setShowModal(false);
    refetch();
  }

  async function toggleAvailability(itemId: string, current: boolean) {
    await supabase.from('menu_items').update({ is_available: !current }).eq('id', itemId);
    refetch();
  }

  async function handleDelete(itemId: string, itemName: string) {
    Alert.alert('Delete Item', `Delete "${itemName}"?`, [
      { text: 'Cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await supabase.from('menu_items').delete().eq('id', itemId);
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
          <Text style={styles.heading}>{category?.name || 'Items'}</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.row, !item.is_available && styles.rowUnavailable]}
            onPress={() => handleEdit(item)}
          >
            <View style={styles.rowInfo}>
              <Text style={[styles.rowName, !item.is_available && styles.textUnavailable]}>
                {item.name}
              </Text>
              <Text style={styles.rowPrice}>{formatCurrency(item.price)}</Text>
            </View>
            <View style={styles.rowActions}>
              <Switch
                value={item.is_available}
                onValueChange={() => toggleAvailability(item.id, item.is_available)}
                trackColor={{ true: BrandColor }}
              />
              <Pressable onPress={() => handleDelete(item.id, item.name)}>
                <Text style={styles.deleteIcon}>&#10005;</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
      />

      <Pressable style={styles.fab} onPress={handleAdd}>
        <Text style={styles.fabText}>+ Item</Text>
      </Pressable>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editId ? 'Edit Item' : 'New Item'}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Item name"
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              autoFocus
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Price (e.g. 9.99)"
              value={form.price}
              onChangeText={(v) => setForm((f) => ({ ...f, price: v }))}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline]}
              placeholder="Description (optional)"
              value={form.description}
              onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
              multiline
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
  container: { flex: 1, backgroundColor: Colors.light.background },
  list: { padding: Spacing.three },
  heading: { fontSize: 22, fontWeight: '700', color: Colors.light.text, marginBottom: Spacing.three },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.two, paddingHorizontal: Spacing.three,
    backgroundColor: Colors.light.backgroundElement, borderRadius: 12,
    marginBottom: Spacing.two,
  },
  rowUnavailable: { opacity: 0.5 },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 16, fontWeight: '500', color: Colors.light.text },
  textUnavailable: { textDecorationLine: 'line-through' },
  rowPrice: { fontSize: 14, color: BrandColor, fontWeight: '600', marginTop: 2 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  deleteIcon: { fontSize: 16, color: '#DC2626', padding: Spacing.two },
  fab: {
    position: 'absolute', bottom: Spacing.four, right: Spacing.four,
    backgroundColor: BrandColor, paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three, borderRadius: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', padding: Spacing.four,
  },
  modalContent: {
    backgroundColor: '#fff', borderRadius: 16, padding: Spacing.four,
    width: '100%', maxWidth: 400, gap: Spacing.two,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: Spacing.two },
  modalInput: {
    backgroundColor: Colors.light.backgroundElement, borderRadius: 12,
    padding: Spacing.three, fontSize: 16,
  },
  modalInputMultiline: { minHeight: 60, textAlignVertical: 'top' },
  modalActions: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.three,
    marginTop: Spacing.two,
  },
  modalCancel: { fontSize: 16, color: Colors.light.textSecondary, padding: Spacing.two },
  modalSaveBtn: {
    backgroundColor: BrandColor, paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two, borderRadius: 8,
  },
  modalSaveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
