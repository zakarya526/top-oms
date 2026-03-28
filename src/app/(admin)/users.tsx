import React, { useEffect, useState } from 'react';
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
import { supabase } from '@/lib/supabase';
import { Tables } from '@/lib/types/database';

type UserProfile = Tables<'user_profiles'>;

export default function AdminUsersScreen() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', fullName: '', role: 'waiter' as 'waiter' | 'kitchen' });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at');
    if (data) setUsers(data);
    setLoading(false);
  }

  async function handleCreateUser() {
    if (!form.email || !form.password || !form.fullName || !profile) return;

    try {
      const { error } = await supabase.functions.invoke('create-user', {
        body: {
          email: form.email,
          password: form.password,
          full_name: form.fullName,
          role: form.role,
          restaurant_id: profile.restaurant_id,
        },
      });

      if (error) throw error;
      setShowModal(false);
      fetchUsers();
      Alert.alert('Success', `${form.fullName} has been created as ${form.role}.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create user. Make sure the create-user Edge Function is deployed.';
      Alert.alert('Error', message);
    }
  }

  async function toggleActive(userId: string, current: boolean) {
    await supabase.from('user_profiles').update({ is_active: !current }).eq('id', userId);
    fetchUsers();
  }

  if (loading) return <LoadingScreen />;

  const roleColors: Record<string, string> = {
    admin: BrandColor,
    waiter: BrandColor,
    kitchen: BrandColor,
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.row, !item.is_active && styles.rowInactive]}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowName}>{item.full_name}</Text>
              <View style={[styles.roleBadge, { backgroundColor: BrandColorLight }]}>
                <Text style={[styles.roleText, { color: BrandColor }]}>
                  {item.role.toUpperCase()}
                </Text>
              </View>
            </View>
            {item.id !== profile?.id && (
              <Pressable
                style={styles.toggleBtn}
                onPress={() => toggleActive(item.id, item.is_active)}
              >
                <Text style={styles.toggleText}>
                  {item.is_active ? 'Deactivate' : 'Activate'}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      />

      <Pressable style={styles.fab} onPress={() => {
        setForm({ email: '', password: '', fullName: '', role: 'waiter' });
        setShowModal(true);
      }}>
        <Text style={styles.fabText}>+ User</Text>
      </Pressable>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create User</Text>
            <TextInput
              style={styles.modalInput} placeholder="Full name"
              placeholderTextColor={PlaceholderColor}
              value={form.fullName} onChangeText={(v) => setForm((f) => ({ ...f, fullName: v }))}
              autoFocus
            />
            <TextInput
              style={styles.modalInput} placeholder="Email"
              placeholderTextColor={PlaceholderColor}
              value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
              keyboardType="email-address" autoCapitalize="none"
            />
            <TextInput
              style={styles.modalInput} placeholder="Password"
              placeholderTextColor={PlaceholderColor}
              value={form.password} onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
              secureTextEntry
            />
            <View style={styles.roleSelector}>
              {(['waiter', 'kitchen'] as const).map((role) => (
                <Pressable
                  key={role}
                  style={[styles.roleOption, form.role === role && styles.roleOptionActive]}
                  onPress={() => setForm((f) => ({ ...f, role }))}
                >
                  <Text style={[styles.roleOptionText, form.role === role && styles.roleOptionTextActive]}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowModal(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSaveBtn} onPress={handleCreateUser}>
                <Text style={styles.modalSaveText}>Create</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    marginBottom: Spacing.two,
    ...CardShadow,
  },
  rowInactive: {
    opacity: 0.5,
  },
  rowInfo: {
    flex: 1,
    gap: 6,
  },
  rowName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  toggleText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
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
  roleSelector: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundElement,
    alignItems: 'center',
  },
  roleOptionActive: {
    backgroundColor: BrandColor,
  },
  roleOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  roleOptionTextActive: {
    color: '#FFFFFF',
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
