import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrdersWithDetailsQuery } from '@/integrations/supabase/reactQueryHooks';

// Add options param to control realtime
export function useOrdersRealtime(options?: { disableRealtime?: boolean }) {
  const { data: orders = [], isLoading: loading, error, refetch } = useOrdersWithDetailsQuery();

  useEffect(() => {
    if (options?.disableRealtime) return;
    const channel = supabase
      .channel('orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
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

  // expose setOrders for local UI updates
  return { orders, loading, error, refetch, setOrders: () => {} };
}
