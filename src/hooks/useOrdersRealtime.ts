import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrdersWithDetailsQuery } from '@/integrations/supabase/reactQueryHooks';

// تم حذف كل منطق التحديث التلقائي أو مراقبة الأحداث أو الاشتراك في realtime. استخدم AuthContext فقط لأي منطق جلسة أو تحديث تلقائي.
export function useOrdersRealtime() {
  // فارغ - استخدم AuthContext فقط
  return { orders: [], loading: false, error: null, refetch: () => {}, setOrders: () => {} };
}
