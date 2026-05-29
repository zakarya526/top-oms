import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { EmptyState } from '@/components/EmptyState';

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="No orders yet" />);
    expect(screen.getByText('No orders yet')).toBeTruthy();
  });

  it('renders the optional message when provided', () => {
    render(<EmptyState title="No tables" message="Add a table to get started" />);
    expect(screen.getByText('No tables')).toBeTruthy();
    expect(screen.getByText('Add a table to get started')).toBeTruthy();
  });

  it('omits the message when not provided', () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByText('Add a table to get started')).toBeNull();
  });
});
