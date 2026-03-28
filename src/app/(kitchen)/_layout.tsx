import { Stack } from 'expo-router';

import { BrandColor, Colors } from '@/constants/theme';

export default function KitchenLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.light.background },
        headerTintColor: Colors.light.text,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="queue" options={{ title: 'Kitchen' }} />
      <Stack.Screen
        name="order/[orderId]"
        options={{ title: 'Order Detail', presentation: 'modal' }}
      />
    </Stack>
  );
}
