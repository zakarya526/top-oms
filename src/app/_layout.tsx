import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { UpdateBanner } from '@/components/UpdateBanner';
import { useAuth } from '@/lib/hooks/useAuth';
import { AuthProvider } from '@/lib/providers/AuthProvider';
import { UpdatesProvider } from '@/lib/providers/UpdatesProvider';

/**
 * Watches the auth session and keeps the user on the correct side of the
 * login wall. Without this, signing out from inside a tab group (admin /
 * waiter / kitchen) clears the session but leaves the user stranded on the
 * same screen — the role redirects only live on the index route, which isn't
 * mounted once you're deep in a group.
 */
function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Signed out (or never signed in) but viewing a protected screen.
      router.replace('/(auth)/login');
    }
  }, [session, loading, segments, router]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <UpdatesProvider>
        <AuthProvider>
          <AuthGate />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(waiter)" />
            <Stack.Screen name="(kitchen)" />
            <Stack.Screen name="(admin)" />
          </Stack>
          <UpdateBanner />
        </AuthProvider>
      </UpdatesProvider>
    </ThemeProvider>
  );
}
