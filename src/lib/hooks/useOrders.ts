import { useEffect, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { Enums, Tables } from '@/lib/types/database';

type Order = Tables<'orders'>;
type OrderItem = Tables<'order_items'>;
type OrderStatus = Enums<'order_status'>;

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
  table: Tables<'tables'> | null;
  waiter: Tables<'user_profiles'> | null;
}

let channelCounter = 0;

export function useOrders(filters?: {
  waiterId?: string;
  status?: OrderStatus[];
  tableId?: string;
}) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const statusKey = filters?.status?.join(',') ?? '';

  useEffect(() => {
    fetchOrders();

    const channelName = `orders-rt-${++channelCounter}`;
    const debouncedFetch = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(fetchOrders, 300);
    };

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, debouncedFetch)
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.waiterId, statusKey, filters?.tableId]);

  async function fetchOrders() {
    setLoading(true);
    let query = supabase
      .from('orders')
      .select('*, order_items(*), table:tables(*), waiter:user_profiles(*)')
      .order('created_at', { ascending: false });

    if (filters?.waiterId) {
      query = query.eq('waiter_id', filters.waiterId);
    }
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }
    if (filters?.tableId) {
      query = query.eq('table_id', filters.tableId);
    }

    const { data } = await query;
    if (data) setOrders(data as OrderWithItems[]);
    setLoading(false);
  }

  return { orders, loading, refetch: fetchOrders };
}

/** Fetch a single order by ID with realtime updates. */
export function useOrder(orderId: string) {
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchOrder();

    const channelName = `order-${orderId}-${++channelCounter}`;
    const debouncedFetch = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(fetchOrder, 300);
    };

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items', filter: `order_id=eq.${orderId}` }, debouncedFetch)
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function fetchOrder() {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*), table:tables(*), waiter:user_profiles(*)')
      .eq('id', orderId)
      .single();

    setOrder(data as OrderWithItems | null);
    setLoading(false);
  }

  return { order, loading, refetch: fetchOrder };
}
