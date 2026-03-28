import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { Tables } from '@/lib/types/database';

type RestaurantTable = Tables<'tables'>;

export function useTables() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();

    const channel = supabase
      .channel('tables-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tables' },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            setTables((prev) =>
              prev.map((t) => (t.id === (payload.new as RestaurantTable).id ? (payload.new as RestaurantTable) : t))
            );
          } else {
            fetchTables();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchTables() {
    setLoading(true);
    const { data } = await supabase
      .from('tables')
      .select('*')
      .order('table_number');
    if (data) setTables(data);
    setLoading(false);
  }

  return { tables, loading, refetch: fetchTables };
}
