import { useEffect, useState, useCallback } from "react";
import { OfferService } from "@/services/supabase/offerService";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

type Offer = Database["public"]["Tables"]["offers"]["Row"];

export function useOffersRealtime() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await OfferService.getAll();
      setOffers(data || []);
    } catch (err) {
      console.error("خطأ في جلب العروض:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchOffers();
  }, [fetchOffers]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  // الاستماع للتغييرات الفورية
  useEffect(() => {
    const channel = supabase
      .channel("offers-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "offers",
        },
        () => {
          fetchOffers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOffers]);

  return {
    offers,
    loading,
    error,
    refetch,
    setOffers,
  };
}
