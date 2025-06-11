import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { Category as AppCategory } from '@/types';

export function useCategoriesRealtime() {
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });
    if (error) setError(error as Error);
    // تحويل البيانات إلى النوع المطلوب في الواجهة
    const mapped = (data || []).map((c: Database['public']['Tables']['categories']['Row']) => ({
      id: c.id,
      name: c.name_ar || c.name_en || '',
      nameEn: c.name_en || '',
      image: c.image,
      icon: c.icon,
      count: 0, // إذا كان هناك حقل للعدد أضفه هنا
    }));
    setCategories(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
    const channel = supabase
      .channel('categories_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchCategories();
      })
      .subscribe();
    // Refetch on tab visibility
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchCategories();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      channel.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return { categories, loading, error, refetch: fetchCategories };
}
