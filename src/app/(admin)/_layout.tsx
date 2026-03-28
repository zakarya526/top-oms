import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text } from 'react-native';

import { BrandColor, Colors } from '@/constants/theme';

export default function AdminLayout() {
  return (
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
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>&#9632;</Text>,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>&#9776;</Text>,
        }}
      />
      <Tabs.Screen
        name="menu/index"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>&#9733;</Text>,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>&#8943;</Text>,
        }}
      />
      <Tabs.Screen name="menu/[categoryId]" options={{ href: null, title: 'Category Items' }} />
      <Tabs.Screen name="order/[orderId]" options={{ href: null, title: 'Order Detail' }} />
      <Tabs.Screen name="tables" options={{ href: null, title: 'Table Management' }} />
      <Tabs.Screen name="users" options={{ href: null, title: 'User Management' }} />
      <Tabs.Screen name="settings" options={{ href: null, title: 'Settings' }} />
    </Tabs>
  );
}
