import { useWindowDimensions } from 'react-native';

import { Breakpoints, MaxContentWidth } from '@/constants/theme';

type DeviceSize = 'compact' | 'medium' | 'wide';

interface ColumnConfig {
  compact: number;
  medium: number;
  wide: number;
}

interface ResponsiveInfo {
  width: number;
  height: number;
  deviceSize: DeviceSize;
  isTablet: boolean;
  contentWidth: number;
  numColumns: (config: ColumnConfig) => number;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  const deviceSize: DeviceSize =
    width >= Breakpoints.wide
      ? 'wide'
      : width >= Breakpoints.medium
        ? 'medium'
        : 'compact';

  const isTablet = deviceSize !== 'compact';
  const contentWidth = Math.min(width, MaxContentWidth);

  function numColumns(config: ColumnConfig) {
    return config[deviceSize];
  }

  return { width, height, deviceSize, isTablet, contentWidth, numColumns };
}
