// دالة لجلب إعدادات الموقع من قاعدة البيانات (supabase)
import { supabase } from '@/integrations/supabase/client';

export async function getSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();
  if (error || !data) return null;
  return data.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<boolean> {
  const { error } = await supabase
    .from('settings')
    .upsert([{ key, value }]);
  return !error;
}
