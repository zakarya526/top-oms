import { renderHook } from '@testing-library/react-native';

import { useResponsive } from '@/lib/hooks/useResponsive';

// react-native's index exposes useWindowDimensions via a getter that re-requires
// this submodule on each access, so mocking the submodule reliably controls what
// the hook reads (spying the RN namespace export does not, due to interop copies).
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const useWindowDimensions =
  require('react-native/Libraries/Utilities/useWindowDimensions').default as jest.Mock;

/** Force the window size useResponsive reads from for a single render. */
function mockWidth(width: number, height = 800) {
  useWindowDimensions.mockReturnValue({ width, height, scale: 2, fontScale: 1 });
}

const COLUMNS = { compact: 1, medium: 2, wide: 3 };

describe('useResponsive', () => {
  afterEach(() => jest.clearAllMocks());

  it('classifies a phone width as compact', () => {
    mockWidth(375);
    const { result } = renderHook(() => useResponsive());

    expect(result.current.deviceSize).toBe('compact');
    expect(result.current.isTablet).toBe(false);
    expect(result.current.contentWidth).toBe(375);
    expect(result.current.numColumns(COLUMNS)).toBe(1);
  });

  it('classifies the medium breakpoint (>= 768) as a tablet', () => {
    mockWidth(768);
    const { result } = renderHook(() => useResponsive());

    expect(result.current.deviceSize).toBe('medium');
    expect(result.current.isTablet).toBe(true);
    expect(result.current.numColumns(COLUMNS)).toBe(2);
  });

  it('classifies the wide breakpoint (>= 1024) and caps content width', () => {
    mockWidth(1200);
    const { result } = renderHook(() => useResponsive());

    expect(result.current.deviceSize).toBe('wide');
    expect(result.current.isTablet).toBe(true);
    // contentWidth is clamped to MaxContentWidth (800).
    expect(result.current.contentWidth).toBe(800);
    expect(result.current.numColumns(COLUMNS)).toBe(3);
  });
});
