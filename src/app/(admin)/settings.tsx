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
import { BrandColor, CardShadow, Colors, Spacing, PlaceholderColor } from '@/constants/theme';
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
          <Text style={styles.label}>RESTAURANT NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Restaurant name"
            placeholderTextColor={PlaceholderColor}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>CURRENCY</Text>
          <TextInput
            style={styles.input}
            value={currency}
            onChangeText={setCurrency}
            placeholder="GBP"
            placeholderTextColor={PlaceholderColor}
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
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  form: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.light.text,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 14,
    padding: Spacing.three,
    fontSize: 16,
    color: Colors.light.text,
  },
  saveBtn: {
    backgroundColor: BrandColor,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    marginTop: Spacing.two,
    ...CardShadow,
    shadowColor: BrandColor,
    shadowOpacity: 0.3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
