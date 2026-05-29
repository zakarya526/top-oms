import { supabase } from '@/lib/supabase';
import { playOrderSound } from '@/lib/utils/orderSounds';
import { updateOrderStatus } from '@/lib/utils/updateOrderStatus';

jest.mock('@/lib/supabase', () => ({
  supabase: { rpc: jest.fn() },
}));
jest.mock('@/lib/utils/orderSounds', () => ({
  playOrderSound: jest.fn(),
}));

const rpc = supabase.rpc as jest.Mock;

describe('updateOrderStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the set_order_status RPC with the order id and status', async () => {
    rpc.mockResolvedValue({ error: null });

    await updateOrderStatus('order-1', 'preparing');

    expect(rpc).toHaveBeenCalledWith('set_order_status', {
      p_order_id: 'order-1',
      p_status: 'preparing',
    });
  });

  it('returns no error and chimes the new status on success', async () => {
    rpc.mockResolvedValue({ error: null });

    const result = await updateOrderStatus('order-1', 'ready');

    expect(result).toEqual({ error: null });
    expect(playOrderSound).toHaveBeenCalledWith('ready');
  });

  it('surfaces the error message and does not chime on failure', async () => {
    rpc.mockResolvedValue({ error: { message: 'invalid transition' } });

    const result = await updateOrderStatus('order-1', 'completed');

    expect(result).toEqual({ error: 'invalid transition' });
    expect(playOrderSound).not.toHaveBeenCalled();
  });
});
