import { useEffect, useState, useCallback } from "react";
import { OfferService } from "@/services/supabase/offerService";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

export function useOffersRealtime() {
  // فارغ - استخدم AuthContext فقط
  return {
    offers: [],
    loading: false,
    error: null,
    refetch: () => {},
    setOffers: () => {},
  };
}
