import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { RoleGate } from '@/components/RoleGate';
import { BrandColor, Colors } from '@/constants/theme';
import { useAuth } from '@/lib/hooks/useAuth';

function SignOutButton() {
  const { signOut } = useAuth();
  return (
    <Pressable style={styles.signOutBtn} onPress={signOut}>
      <Text style={styles.signOutBtnText}>Sign Out</Text>
    </Pressable>
  );
}

export default function WaiterLayout() {
  return (
    <RoleGate role="waiter">
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BrandColor,
        tabBarInactiveTintColor: Colors.light.textSecondary,
        headerStyle: { backgroundColor: Colors.light.background },
        headerTintColor: Colors.light.text,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: Colors.light.background,
            borderTopColor: Colors.light.border,
          },
          default: {
            backgroundColor: Colors.light.background,
            borderTopColor: Colors.light.border,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="tables"
        options={{
          title: 'Tables',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>&#9638;</Text>,
        }}
      />
      <Tabs.Screen
        name="my-orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>&#9776;</Text>,
          headerRight: () => <SignOutButton />,
        }}
      />
      <Tabs.Screen
        name="menu/[tableId]"
        options={{
          href: null,
          title: 'Menu',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>&#9733;</Text>,
        }}
      />
      <Tabs.Screen name="order-summary" options={{ href: null, title: 'Order Summary' }} />
      <Tabs.Screen name="order/[orderId]" options={{ href: null, title: 'Order Detail' }} />
    </Tabs>
    </RoleGate>
  );
}

const styles = StyleSheet.create({
  signOutBtn: {
    marginRight: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  signOutBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
});
