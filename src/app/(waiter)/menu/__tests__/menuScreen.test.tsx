import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { useOrderStore } from '@/lib/stores/orderStore';
import { Tables } from '@/lib/types/database';

import MenuScreen from '../[tableId]';

// Keep the screen self-contained: stub navigation, the menu data hook and the
// responsive hook so the test exercises ONLY the cart-stepper wiring against
// the real order store. (No outer-scope refs in these factories — jest hoists
// jest.mock() above imports, so referencing local vars here would throw.)
jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useLocalSearchParams: () => ({ tableId: 'table-1' }),
}));

jest.mock('@/lib/hooks/useResponsive', () => ({
  useResponsive: () => ({ numColumns: () => 1 }),
}));

jest.mock('@/lib/hooks/useMenu', () => ({
  useMenu: () => ({
    loading: false,
    categories: [{ id: 'cat-1', name: 'Mains' }],
    getItemsByCategory: () => [
      {
        id: 'item-1',
        name: 'Margherita',
        description: null,
        price: 9.5,
        category_id: 'cat-1',
        restaurant_id: 'rest-1',
        is_available: true,
        sort_order: 0,
        created_at: '2026-01-01T00:00:00.000Z',
      },
    ],
  }),
}));

function makeItem(): Tables<'menu_items'> {
  return {
    id: 'item-1',
    name: 'Margherita',
    description: null,
    price: 9.5,
    category_id: 'cat-1',
    restaurant_id: 'rest-1',
    is_available: true,
    sort_order: 0,
    created_at: '2026-01-01T00:00:00.000Z',
  };
}

describe('Waiter menu screen — quantity stepper', () => {
  beforeEach(() => {
    useOrderStore.getState().clearCart();
  });

  // Regression guard: the minus button used to call removeItem(), which wiped
  // the whole cart line in a single tap (silent data loss). It must decrement.
  it('minus button decrements the line instead of deleting it', () => {
    const store = useOrderStore.getState();
    store.addItem(makeItem());
    store.addItem(makeItem()); // quantity now 2
    expect(useOrderStore.getState().items[0].quantity).toBe(2);

    const { getByText } = render(<MenuScreen />);
    fireEvent.press(getByText('-'));

    const items = useOrderStore.getState().items;
    expect(items).toHaveLength(1); // line NOT removed
    expect(items[0].quantity).toBe(1); // decremented by exactly one
  });

  it('minus on the last remaining unit removes the line', () => {
    useOrderStore.getState().addItem(makeItem()); // quantity 1

    const { getByText } = render(<MenuScreen />);
    fireEvent.press(getByText('-'));

    expect(useOrderStore.getState().items).toHaveLength(0);
  });
});
