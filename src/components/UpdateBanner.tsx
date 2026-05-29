import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomTabInset, BrandColor, CardShadow, Colors, Spacing } from '@/constants/theme';
import { useUpdates } from '@/lib/hooks/useUpdates';

/**
 * Floating banner shown only when a new OTA update has been downloaded and is
 * staged. Tapping "Update" restarts the app into the new version. Mounted once
 * at the root so it overlays every screen; it sits just above the bottom tab bar
 * and lets taps pass through the empty area around it.
 */
export function UpdateBanner() {
  const { isUpdatePending, applyUpdate } = useUpdates();
  const [applying, setApplying] = useState(false);

  if (!isUpdatePending) return null;

  const onPress = async () => {
    setApplying(true);
    try {
      await applyUpdate();
      // On success the app reloads and this component is torn down, so we never
      // reach here. If reloadAsync throws, re-enable the button to allow a retry.
    } catch {
      setApplying(false);
    }
  };

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.banner}>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Update available</Text>
          <Text style={styles.subtitle}>A new version is ready to install</Text>
        </View>
        <Pressable
          style={[styles.button, applying && styles.buttonDisabled]}
          onPress={onPress}
          disabled={applying}
          accessibilityRole="button"
          accessibilityLabel="Install update"
        >
          {applying ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>Update</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: BottomTabInset + Spacing.two,
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 500,
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...CardShadow,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  button: {
    backgroundColor: BrandColor,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.four,
    borderRadius: 10,
    minWidth: 88,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
