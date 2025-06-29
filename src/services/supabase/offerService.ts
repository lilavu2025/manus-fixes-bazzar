import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export class OfferService {
  static async getAll(): Promise<Database['public']['Tables']['offers']['Row'][]> {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (!data) throw new Error('No offers data found');
    return data;
  }

  static async getActiveOffers(): Promise<Database['public']['Tables']['offers']['Row'][]> {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (!data) throw new Error('No offers data found');
    return data;
  }
}
