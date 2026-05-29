import { formatCurrency } from '@/lib/utils/formatCurrency';

describe('formatCurrency', () => {
  it('formats whole numbers as GBP with two decimals by default', () => {
    expect(formatCurrency(10)).toBe('£10.00');
  });

  it('formats fractional amounts, rounding to two decimals', () => {
    expect(formatCurrency(12.5)).toBe('£12.50');
    expect(formatCurrency(12.345)).toBe('£12.35');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('£0.00');
  });

  it('groups thousands', () => {
    expect(formatCurrency(1234.5)).toBe('£1,234.50');
  });

  it('handles negative amounts', () => {
    expect(formatCurrency(-5)).toBe('-£5.00');
  });

  it('honours an explicit currency code', () => {
    // Non-breaking space separates symbol and amount for non-GBP in en-GB.
    expect(formatCurrency(10, 'USD')).toContain('10.00');
    expect(formatCurrency(10, 'USD')).toMatch(/US\$|\$/);
  });
});
