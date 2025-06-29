import { supabase } from './client';

// جلب رقم الطلبية التالي (أكبر order_number + 1)
export async function getNextOrderNumber(): Promise<number> {
  const { data, error } = await supabase
    .from('orders')
    .select('order_number')
    .order('order_number', { ascending: false })
    .limit(1);
  if (error) throw error;
  const lastOrderNumber = data && (data as any[]).length > 0 && (data as any[])[0].order_number ? (data as any[])[0].order_number : 0;
  return lastOrderNumber + 1;
}
