import { getTimeSince } from '@/lib/utils/getTimeSince';

const NOW = new Date('2026-05-29T12:00:00.000Z').getTime();

/** Build an ISO string `minutes` (+ optional seconds) before the frozen NOW. */
function ago(minutes: number, seconds = 0): string {
  return new Date(NOW - minutes * 60_000 - seconds * 1_000).toISOString();
}

describe('getTimeSince', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns "Just now" under a minute', () => {
    expect(getTimeSince(ago(0, 30))).toBe('Just now');
  });

  it('returns minutes within the hour', () => {
    expect(getTimeSince(ago(5))).toBe('5m ago');
    expect(getTimeSince(ago(59))).toBe('59m ago');
  });

  it('returns hours and minutes past an hour', () => {
    expect(getTimeSince(ago(90))).toBe('1h 30m ago');
    expect(getTimeSince(ago(60))).toBe('1h 0m ago');
    expect(getTimeSince(ago(125))).toBe('2h 5m ago');
  });

  it('omits the suffix when suffix:false', () => {
    expect(getTimeSince(ago(5), { suffix: false })).toBe('5m');
    expect(getTimeSince(ago(90), { suffix: false })).toBe('1h 30m');
  });

  it('still includes the suffix when suffix:true is passed explicitly', () => {
    expect(getTimeSince(ago(5), { suffix: true })).toBe('5m ago');
  });

  it('treats a future timestamp as "Just now"', () => {
    expect(getTimeSince(new Date(NOW + 60_000).toISOString())).toBe('Just now');
  });
});
