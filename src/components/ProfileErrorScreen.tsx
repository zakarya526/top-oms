import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandColor, Colors, Spacing } from '@/constants/theme';

/**
 * Shown when the signed-in user's profile could not be fetched (network/RLS/
 * transient error), as opposed to the user genuinely having no profile yet.
 * Offers a retry instead of misrouting an onboarded user into onboarding.
 */
export function ProfileErrorScreen({ onRetry }: { onRetry: () => Promise<void> }) {
  const [retrying, setRetrying] = useState(false);

  async function handleRetry() {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Couldn’t load your account</Text>
      <Text style={styles.message}>
        We couldn’t reach the server. Check your connection and try again.
      </Text>
      <Pressable
        style={[styles.button, retrying && styles.buttonDisabled]}
        onPress={handleRetry}
        disabled={retrying}
      >
        {retrying ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Try Again</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  button: {
    marginTop: Spacing.four,
    backgroundColor: BrandColor,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    borderRadius: 12,
    minWidth: 160,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
