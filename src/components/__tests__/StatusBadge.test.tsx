import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { StatusBadge } from '@/components/StatusBadge';
import { Enums } from '@/lib/types/database';

type OrderStatus = Enums<'order_status'>;

const STATUSES: OrderStatus[] = [
  'pending',
  'preparing',
  'ready',
  'served',
  'completed',
  'cancelled',
];

describe('StatusBadge', () => {
  it.each(STATUSES)('renders the %s status in uppercase', (status) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(status.toUpperCase())).toBeTruthy();
  });

  it('renders at the small size without error', () => {
    render(<StatusBadge status="ready" size="sm" />);
    expect(screen.getByText('READY')).toBeTruthy();
  });
});
