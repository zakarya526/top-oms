import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1A1A2E',
    background: '#FFFFFF',
    backgroundElement: '#F5F5F7',
    backgroundSelected: '#EDEDED',
    textSecondary: '#6B7280',
    card: '#FFFFFF',
    border: '#F0F0F0',
  },
  dark: {
    text: '#F5F5F5',
    background: '#0E0E0E',
    backgroundElement: '#1C1B1B',
    backgroundSelected: '#2A2A2A',
    textSecondary: '#9CA3AF',
    card: '#1C1B1B',
    border: '#2A2A2A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const StatusColors = {
  pending: '#F59E0B',
  preparing: '#E91E8C',
  ready: '#10B981',
  served: '#8B5CF6',
  completed: '#6B7280',
  cancelled: '#EF4444',
} as const;

export const StatusBackgrounds = {
  pending: '#FEF3C7',
  preparing: '#FDE7F3',
  ready: '#D1FAE5',
  served: '#EDE9FE',
  completed: '#F3F4F6',
  cancelled: '#FEE2E2',
} as const;

/** Primary magenta/hot-pink accent used across all roles */
export const BrandColor = '#E91E8C';
export const BrandColorLight = '#FDE7F3';
export const BrandColorDark = '#B91570';

export const AdminColor = '#E91E8C';
export const KitchenColor = '#E91E8C';
export const DangerColor = '#DC2626';
export const DangerBackground = '#FEE2E2';
export const PlaceholderColor = '#9CA3AF';
export const ModalOverlayColor = 'rgba(0,0,0,0.4)';

/** Card shadow for light theme */
export const CardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 3,
} as const;
