import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/hooks/useAuth';
import { Colors, Spacing } from '@/constants/theme';

export default function AdminMoreScreen() {
  const { signOut } = useAuth();

  const menuItems = [
    { label: 'Table Management', onPress: () => router.push('/(admin)/tables' as any) },
    { label: 'User Management', onPress: () => router.push('/(admin)/users' as any) },
    { label: 'Settings', onPress: () => router.push('/(admin)/settings' as any) },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.list}>
        {menuItems.map((item) => (
          <Pressable key={item.label} style={styles.row} onPress={item.onPress}>
            <Text style={styles.rowText}>{item.label}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  list: {
    flex: 1,
    paddingTop: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.backgroundElement,
  },
  rowText: {
    fontSize: 17,
    color: Colors.light.text,
  },
  chevron: {
    fontSize: 22,
    color: Colors.light.textSecondary,
  },
  signOutButton: {
    marginHorizontal: Spacing.four,
    marginTop: Spacing.four,
    marginBottom: Spacing.six + 32,
    padding: Spacing.three,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  signOutText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
