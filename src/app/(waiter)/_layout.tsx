import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text } from 'react-native';

import { BrandColor, Colors } from '@/constants/theme';

export default function WaiterLayout() {
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
  );
}
