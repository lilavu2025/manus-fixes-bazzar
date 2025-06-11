import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export function useOffersRealtime() {
  const [offers, setOffers] = useState<Database['public']['Tables']['offers']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // جلب أولي
  const fetchOffers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('active', true)
      .gte('end_date', new Date().toISOString())
      .order('created_at', { ascending: false });
    if (error) setError(error as Error);
    setOffers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOffers();
    // اشتراك Realtime
    const channel = supabase
      .channel('offers_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, () => {
        fetchOffers();
      })
      .subscribe();
    // Refetch on tab visibility
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchOffers();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      channel.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return { offers, loading, error, refetch: fetchOffers };
}
