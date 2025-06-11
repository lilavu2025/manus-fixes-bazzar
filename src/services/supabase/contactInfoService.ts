import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type ContactInfo = Database['public']['Tables']['contact_info']['Row'];

export class ContactInfoService {
  static async getContactInfo(): Promise<ContactInfo | null> {
    const { data, error } = await supabase
      .from('contact_info')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    if (error) {
      console.error('Error fetching contact info:', error);
      return null;
    }
    return data;
  }

  static async updateContactInfo(info: Partial<ContactInfo>): Promise<ContactInfo | null> {
    const { data, error } = await supabase
      .from('contact_info')
      .update({ ...info, updated_at: new Date().toISOString() })
      .order('updated_at', { ascending: false })
      .limit(1)
      .select()
      .single();
    if (error) {
      console.error('Error updating contact info:', error);
      return null;
    }
    return data;
  }
}
