import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingScreen } from '@/components/LoadingScreen';
import { Colors, Spacing, AdminColor } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/lib/types/database';

type Restaurant = Tables<'restaurants'>;

export default function AdminSettingsScreen() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRestaurant();
  }, []);

  async function fetchRestaurant() {
    const { data } = await supabase.from('restaurants').select('*').single();
    if (data) {
      setRestaurant(data);
      setName(data.name);
      setCurrency(data.currency);
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!restaurant || !name.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from('restaurants')
      .update({ name: name.trim(), currency: currency.trim() || 'GBP' })
      .eq('id', restaurant.id);

    setSaving(false);
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Saved', 'Restaurant settings updated.');
  }

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.form}>
        <Text style={styles.heading}>Restaurant Settings</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Restaurant Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Restaurant name"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Currency</Text>
          <TextInput
            style={styles.input}
            value={currency}
            onChangeText={setCurrency}
            placeholder="GBP"
            autoCapitalize="characters"
          />
        </View>

        <Pressable
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  form: { padding: Spacing.four, gap: Spacing.three },
  heading: { fontSize: 22, fontWeight: '700', color: Colors.light.text },
  field: { gap: Spacing.one },
  label: { fontSize: 14, fontWeight: '600', color: Colors.light.textSecondary },
  input: {
    backgroundColor: Colors.light.backgroundElement, borderRadius: 12,
    padding: Spacing.three, fontSize: 16, color: Colors.light.text,
  },
  saveBtn: {
    backgroundColor: AdminColor, padding: Spacing.three,
    borderRadius: 12, alignItems: 'center', marginTop: Spacing.two,
  },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
