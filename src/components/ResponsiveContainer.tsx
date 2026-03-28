import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { MaxContentWidth } from '@/constants/theme';
import { useResponsive } from '@/lib/hooks/useResponsive';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ResponsiveContainer({ children, style }: Props) {
  const { isTablet } = useResponsive();

  if (!isTablet) {
    return <View style={[styles.full, style]}>{children}</View>;
  }

  return (
    <View style={[styles.full, styles.center, style]}>
      <View style={styles.constrained}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  center: { alignItems: 'center' },
  constrained: { width: '100%', maxWidth: MaxContentWidth, flex: 1 },
});
