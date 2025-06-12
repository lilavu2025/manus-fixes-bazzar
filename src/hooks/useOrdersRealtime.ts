import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Add options param to control realtime
export function useOrdersRealtime(options?: { disableRealtime?: boolean }) {
  const [orders, setOrders] = useState<Database['public']['Tables']['orders']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`*, profiles:profiles(id, full_name, email, phone), order_items(*, products(name_ar, name_en, image))`)
      .order('created_at', { ascending: false });
    if (error) setError(error as Error);
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    if (options?.disableRealtime) return;
    const channel = supabase
      .channel('orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();
    // Refetch on tab visibility
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchOrders();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      channel.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [options?.disableRealtime]);

  // expose setOrders for local UI updates
  return { orders, loading, error, refetch: fetchOrders, setOrders };
}
