import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCategoriesWithProductCountQuery } from '@/integrations/supabase/reactQueryHooks';
import type { Category } from '@/types/product';

// Add options param to control realtime
export function useCategoriesRealtime(options?: { disableRealtime?: boolean }) {
  const { data: categories = [], isLoading: loading, error, refetch } = useCategoriesWithProductCountQuery();

  useEffect(() => {
    if (options?.disableRealtime) return;
    const channel = supabase
      .channel('categories_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        refetch();
      })
      .subscribe();
    // Refetch on tab visibility
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refetch();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      channel.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [options?.disableRealtime, refetch]);

  // expose setCategories for local UI updates
  return { categories, loading, error, refetch, setCategories: () => {} };
}
