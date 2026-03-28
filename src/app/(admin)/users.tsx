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
import { Colors, Spacing, AdminColor } from '@/constants/theme';
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
      // Use Edge Function to create user (requires service_role)
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

  const roleColors = { admin: AdminColor, waiter: '#E85D04', kitchen: '#D62828' };

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
              <View style={[styles.roleBadge, { backgroundColor: roleColors[item.role] + '20' }]}>
                <Text style={[styles.roleText, { color: roleColors[item.role] }]}>
                  {item.role.toUpperCase()}
                </Text>
              </View>
            </View>
            {item.id !== profile?.id && (
              <Pressable onPress={() => toggleActive(item.id, item.is_active)}>
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
              value={form.fullName} onChangeText={(v) => setForm((f) => ({ ...f, fullName: v }))}
              autoFocus
            />
            <TextInput
              style={styles.modalInput} placeholder="Email"
              value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
              keyboardType="email-address" autoCapitalize="none"
            />
            <TextInput
              style={styles.modalInput} placeholder="Password"
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
  container: { flex: 1, backgroundColor: Colors.light.background },
  list: { padding: Spacing.three },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.three, paddingHorizontal: Spacing.three,
    backgroundColor: Colors.light.backgroundElement, borderRadius: 12,
    marginBottom: Spacing.two,
  },
  rowInactive: { opacity: 0.5 },
  rowInfo: { flex: 1, gap: Spacing.one },
  rowName: { fontSize: 17, fontWeight: '600', color: Colors.light.text },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start' },
  roleText: { fontSize: 11, fontWeight: '700' },
  toggleText: { fontSize: 14, color: '#DC2626', fontWeight: '500' },
  fab: {
    position: 'absolute', bottom: Spacing.four, right: Spacing.four,
    backgroundColor: AdminColor, paddingHorizontal: Spacing.four,
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
  roleSelector: { flexDirection: 'row', gap: Spacing.two },
  roleOption: {
    flex: 1, padding: Spacing.two, borderRadius: 8,
    backgroundColor: Colors.light.backgroundElement, alignItems: 'center',
  },
  roleOptionActive: { backgroundColor: AdminColor },
  roleOptionText: { fontSize: 15, fontWeight: '600', color: Colors.light.text },
  roleOptionTextActive: { color: '#fff' },
  modalActions: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.three,
    marginTop: Spacing.two,
  },
  modalCancel: { fontSize: 16, color: Colors.light.textSecondary, padding: Spacing.two },
  modalSaveBtn: {
    backgroundColor: AdminColor, paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two, borderRadius: 8,
  },
  modalSaveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
