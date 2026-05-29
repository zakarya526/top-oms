import { Redirect } from 'expo-router';
import React from 'react';

import { LoadingScreen } from '@/components/LoadingScreen';
import { ProfileErrorScreen } from '@/components/ProfileErrorScreen';
import { useAuth } from '@/lib/hooks/useAuth';
import { Enums } from '@/lib/types/database';

type Role = Enums<'user_role'>;

/**
 * Guards a role's route group. A user who isn't signed in, has no restaurant,
 * or whose role doesn't match is redirected away — so e.g. a waiter can't open
 * the admin screens by deep-linking. `/` re-routes them to their own home.
 */
export function RoleGate({ role, children }: { role: Role; children: React.ReactNode }) {
  const { session, profile, profileError, loading, refreshProfile } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!session) return <Redirect href="/(auth)/login" />;
  if (!profile) {
    // A failed profile fetch gets a retry screen; only a confirmed missing
    // profile (successful fetch, no row) means onboarding isn't finished.
    if (profileError) return <ProfileErrorScreen onRetry={refreshProfile} />;
    return <Redirect href="/(auth)/signup" />;
  }
  if (profile.role !== role) return <Redirect href="/" />;

  return <>{children}</>;
}
