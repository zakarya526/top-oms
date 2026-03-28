import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { Tables } from '@/lib/types/database';

type MenuCategory = Tables<'menu_categories'>;
type MenuItem = Tables<'menu_items'>;

export function useMenu() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenu();
  }, []);

  async function fetchMenu() {
    setLoading(true);
    const [catResult, itemResult] = await Promise.all([
      supabase.from('menu_categories').select('*').order('sort_order'),
      supabase.from('menu_items').select('*').order('sort_order'),
    ]);

    if (catResult.data) setCategories(catResult.data);
    if (itemResult.data) setItems(itemResult.data);
    setLoading(false);
  }

  function getItemsByCategory(categoryId: string) {
    return items.filter((item) => item.category_id === categoryId && item.is_available);
  }

  return { categories, items, loading, refetch: fetchMenu, getItemsByCategory };
}
