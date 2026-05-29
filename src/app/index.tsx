import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/lib/hooks/useAuth';

export default function Index() {
  const { session, profile, loading } = useAuth();

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

  // Signed in but no profile yet → account exists without a restaurant.
  // Send them to finish onboarding (create their restaurant).
  if (!profile) {
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
