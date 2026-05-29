import { useOrderStore } from '@/lib/stores/orderStore';
import { Tables } from '@/lib/types/database';

type MenuItem = Tables<'menu_items'>;

function makeItem(overrides: Partial<MenuItem> = {}): MenuItem {
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
    ...overrides,
  };
}

// Access actions/state through getState() — this is a singleton store, so
// every test starts from a clean cart.
const store = () => useOrderStore.getState();

describe('useOrderStore', () => {
  beforeEach(() => {
    store().clearCart();
  });

  it('starts empty', () => {
    expect(store().items).toEqual([]);
    expect(store().tableId).toBeNull();
    expect(store().getTotal()).toBe(0);
    expect(store().getItemCount()).toBe(0);
  });

  it('setTable stores the table id', () => {
    store().setTable('table-7');
    expect(store().tableId).toBe('table-7');
  });

  it('addItem adds a new line with quantity 1', () => {
    store().addItem(makeItem());
    expect(store().items).toHaveLength(1);
    expect(store().items[0]).toMatchObject({ quantity: 1, notes: '' });
    expect(store().items[0].menuItem.id).toBe('item-1');
  });

  it('addItem increments quantity for an existing item instead of duplicating', () => {
    const item = makeItem();
    store().addItem(item);
    store().addItem(item);
    expect(store().items).toHaveLength(1);
    expect(store().items[0].quantity).toBe(2);
  });

  it('keeps distinct items as separate lines', () => {
    store().addItem(makeItem({ id: 'a' }));
    store().addItem(makeItem({ id: 'b' }));
    expect(store().items).toHaveLength(2);
  });

  it('removeItem drops the matching line', () => {
    store().addItem(makeItem({ id: 'a' }));
    store().addItem(makeItem({ id: 'b' }));
    store().removeItem('a');
    expect(store().items.map((i) => i.menuItem.id)).toEqual(['b']);
  });

  it('updateQuantity sets a positive quantity', () => {
    store().addItem(makeItem());
    store().updateQuantity('item-1', 5);
    expect(store().items[0].quantity).toBe(5);
  });

  it('updateQuantity to zero or below removes the line', () => {
    store().addItem(makeItem());
    store().updateQuantity('item-1', 0);
    expect(store().items).toHaveLength(0);

    store().addItem(makeItem());
    store().updateQuantity('item-1', -3);
    expect(store().items).toHaveLength(0);
  });

  it('updateItemNotes sets per-line notes', () => {
    store().addItem(makeItem());
    store().updateItemNotes('item-1', 'no cheese');
    expect(store().items[0].notes).toBe('no cheese');
  });

  it('setOrderNotes sets the order-level note', () => {
    store().setOrderNotes('birthday table');
    expect(store().orderNotes).toBe('birthday table');
  });

  it('getTotal sums price * quantity across lines', () => {
    store().addItem(makeItem({ id: 'a', price: 10 }));
    store().addItem(makeItem({ id: 'a', price: 10 })); // qty 2 -> 20
    store().addItem(makeItem({ id: 'b', price: 2.5 })); // qty 1 -> 2.5
    expect(store().getTotal()).toBe(22.5);
  });

  it('getItemCount sums quantities, not lines', () => {
    store().addItem(makeItem({ id: 'a' }));
    store().addItem(makeItem({ id: 'a' }));
    store().addItem(makeItem({ id: 'b' }));
    expect(store().getItemCount()).toBe(3);
  });

  it('clearCart resets everything', () => {
    store().setTable('t1');
    store().addItem(makeItem());
    store().setOrderNotes('note');
    store().clearCart();
    expect(store().items).toEqual([]);
    expect(store().tableId).toBeNull();
    expect(store().orderNotes).toBe('');
  });
});
