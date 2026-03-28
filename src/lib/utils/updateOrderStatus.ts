import { supabase } from '@/lib/supabase';
import { Enums } from '@/lib/types/database';

type OrderStatus = Enums<'order_status'>;

export async function updateOrderStatus(
  orderId: string,
  tableId: string,
  newStatus: OrderStatus,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  if (error) return { error: error.message };

  if (newStatus === 'completed' || newStatus === 'cancelled') {
    await supabase.from('tables').update({ status: 'available' }).eq('id', tableId);
  }

  return { error: null };
}
