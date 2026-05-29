import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { OrderTotals } from '@/components/OrderTotals';

describe('OrderTotals', () => {
  it('shows subtotal (total minus service), the service line, and the total', () => {
    render(<OrderTotals order={{ total_amount: 22.5, service_charge: 2.5 }} />);

    expect(screen.getByText('Subtotal')).toBeTruthy();
    expect(screen.getByText('£20.00')).toBeTruthy(); // 22.50 - 2.50
    expect(screen.getByText('Service')).toBeTruthy();
    expect(screen.getByText('£2.50')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
    expect(screen.getByText('£22.50')).toBeTruthy();
  });

  it('hides the service row when there is no service charge', () => {
    render(<OrderTotals order={{ total_amount: 15, service_charge: 0 }} />);

    expect(screen.queryByText('Service')).toBeNull();
    // Subtotal equals the total when there is no service charge.
    expect(screen.getAllByText('£15.00')).toHaveLength(2);
  });
});
