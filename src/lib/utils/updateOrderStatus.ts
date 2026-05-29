import { supabase } from '@/lib/supabase';
import { Enums } from '@/lib/types/database';

type OrderStatus = Enums<'order_status'>;

/**
 * Status changes go through the server-side state machine (set_order_status),
 * which validates the transition + caller role and frees the table when no
 * other active order remains.
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('set_order_status', {
    p_order_id: orderId,
    p_status: newStatus,
  });

  return { error: error ? error.message : null };
}
