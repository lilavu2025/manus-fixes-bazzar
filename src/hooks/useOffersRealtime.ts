import { useEffect, useState, useCallback } from 'react';
import { OfferService } from '@/services/supabase/offerService';
import type { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';

export function useOffersRealtime(options?: { disableRealtime?: boolean }) {
  const [offers, setOffers] = useState<Database['public']['Tables']['offers']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await OfferService.getActiveOffers();
      setOffers(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!options?.disableRealtime) {
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
    }
  }, [fetchOffers, options?.disableRealtime]);

  return { offers, loading, error, refetch: fetchOffers, setOffers };
}
