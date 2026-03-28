import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
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
import { useTables } from '@/lib/hooks/useTables';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/lib/types/database';

export default function AdminTablesScreen() {
  const { profile } = useAuth();
  const { tables, loading, refetch } = useTables();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ number: '', label: '', capacity: '' });

  function handleAdd() {
    setEditId(null);
    const next = tables.length > 0 ? Math.max(...tables.map((t) => t.table_number)) + 1 : 1;
    setForm({ number: String(next), label: `Table ${next}`, capacity: '4' });
    setShowModal(true);
  }

  function handleEdit(table: Tables<'tables'>) {
    setEditId(table.id);
    setForm({
      number: String(table.table_number),
      label: table.label || '',
      capacity: table.capacity ? String(table.capacity) : '',
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.number || !profile) return;
    const tableNumber = parseInt(form.number);
    const capacity = form.capacity ? parseInt(form.capacity) : null;

    if (editId) {
      await supabase.from('tables').update({
        table_number: tableNumber,
        label: form.label.trim() || null,
        capacity,
      }).eq('id', editId);
    } else {
      await supabase.from('tables').insert({
        restaurant_id: profile.restaurant_id,
        table_number: tableNumber,
        label: form.label.trim() || `Table ${tableNumber}`,
        capacity,
      });
    }
    setShowModal(false);
    refetch();
  }

  async function handleDelete(id: string, label: string) {
    Alert.alert('Delete Table', `Delete "${label}"?`, [
      { text: 'Cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await supabase.from('tables').delete().eq('id', id);
          refetch();
        },
      },
    ]);
  }

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={tables}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => handleEdit(item)}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowName}>{item.label || `Table ${item.table_number}`}</Text>
              <Text style={styles.rowMeta}>
                #{item.table_number} {item.capacity ? `· ${item.capacity} seats` : ''} · {item.status}
              </Text>
            </View>
            <View style={[styles.statusDot, item.status === 'occupied' ? styles.dotOccupied : styles.dotAvailable]} />
            <Pressable
              style={styles.deleteBtn}
              onPress={() => handleDelete(item.id, item.label || `Table ${item.table_number}`)}
            >
              <Text style={styles.deleteIcon}>✕</Text>
            </Pressable>
          </Pressable>
        )}
      />

      <Pressable style={styles.fab} onPress={handleAdd}>
        <Text style={styles.fabText}>+ Table</Text>
      </Pressable>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editId ? 'Edit Table' : 'New Table'}</Text>
            <TextInput
              style={styles.modalInput} placeholder="Table number"
              placeholderTextColor={PlaceholderColor}
              value={form.number} onChangeText={(v) => setForm((f) => ({ ...f, number: v }))}
              keyboardType="number-pad"
            />
            <TextInput
              style={styles.modalInput} placeholder="Label (optional)"
              placeholderTextColor={PlaceholderColor}
              value={form.label} onChangeText={(v) => setForm((f) => ({ ...f, label: v }))}
            />
            <TextInput
              style={styles.modalInput} placeholder="Capacity (optional)"
              placeholderTextColor={PlaceholderColor}
              value={form.capacity} onChangeText={(v) => setForm((f) => ({ ...f, capacity: v }))}
              keyboardType="number-pad"
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
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    marginBottom: Spacing.two,
    ...CardShadow,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  rowMeta: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  dotAvailable: {
    backgroundColor: '#10B981',
  },
  dotOccupied: {
    backgroundColor: BrandColor,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.four,
    right: Spacing.four,
    backgroundColor: BrandColor,
    paddingHorizontal: Spacing.four,
    paddingVertical: 14,
    borderRadius: 28,
    ...CardShadow,
    shadowColor: BrandColor,
    shadowOpacity: 0.3,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
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
    gap: Spacing.two,
    ...CardShadow,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.two,
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
    marginTop: Spacing.two,
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
