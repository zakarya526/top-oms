import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';

interface Props extends ScrollViewProps {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Style applied to the outer KeyboardAvoidingView wrapper. */
  wrapperStyle?: StyleProp<ViewStyle>;
  /**
   * Extra space appended below the content so the last field clears the
   * keyboard once it has scrolled into view. Safe-area bottom inset is added
   * automatically on top of this.
   */
  bottomOffset?: number;
  /** Distance the keyboard sits below the top of the wrapper (e.g. header height). */
  keyboardVerticalOffset?: number;
}

/**
 * A scroll container that keeps focused inputs visible above the keyboard on
 * every platform. iOS uses `KeyboardAvoidingView` with `padding`; Android
 * relies on the window resizing (Expo's default `softwareKeyboardLayoutMode`)
 * so we intentionally pass no `behavior` there to avoid a double-resize that
 * prevents scrolling.
 */
export function KeyboardAwareScrollView({
  children,
  contentContainerStyle,
  wrapperStyle,
  bottomOffset = Spacing.five,
  keyboardVerticalOffset = 0,
  ...rest
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={[styles.flex, wrapperStyle]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          contentContainerStyle,
          { paddingBottom: bottomOffset + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        {...rest}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
