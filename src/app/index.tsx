import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ProfileErrorScreen } from '@/components/ProfileErrorScreen';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Index() {
  const { session, profile, profileError, loading, refreshProfile } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!profile) {
    // Distinguish a failed profile fetch from a genuinely missing profile:
    // a transient error gets a retry screen, while a successful fetch with no
    // row means the account exists without a restaurant → finish onboarding.
    if (profileError) {
      return <ProfileErrorScreen onRetry={refreshProfile} />;
    }
    return <Redirect href="/(auth)/signup" />;
  }

  switch (profile.role) {
    case 'admin':
      return <Redirect href="/(admin)/dashboard" />;
    case 'waiter':
      return <Redirect href="/(waiter)/tables" />;
    case 'kitchen':
      return <Redirect href="/(kitchen)/queue" />;
    default:
      return <Redirect href="/(auth)/login" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
