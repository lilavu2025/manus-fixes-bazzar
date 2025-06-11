import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { Product as AppProduct } from '@/types/product';

export function useProductsRealtime() {
  const [products, setProducts] = useState<AppProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });
    if (error) setError(error as Error);
    // تحويل البيانات إلى النوع المطلوب في الواجهة
    const mapped = (data || []).map((p: Database['public']['Tables']['products']['Row']) => ({
      id: p.id,
      name: p.name_ar || p.name_en || '',
      nameEn: p.name_en || '',
      nameHe: p.name_he || '',
      description: p.description_ar || p.description_en || '',
      descriptionEn: p.description_en || '',
      descriptionHe: p.description_he || '',
      price: Number(p.price),
      originalPrice: p.original_price ?? undefined,
      wholesalePrice: p.wholesale_price ?? undefined,
      image: p.image,
      images: p.images ?? [],
      category: p.category_id,
      inStock: p.in_stock ?? false,
      rating: Number(p.rating) || 0,
      reviews: p.reviews_count || 0,
      discount: p.discount ?? undefined,
      featured: p.featured ?? false,
      tags: p.tags ?? [],
      stock_quantity: p.stock_quantity ?? 0,
      active: p.active ?? true,
    }));
    setProducts(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
    const channel = supabase
      .channel('products_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();
    // Refetch on tab visibility
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchProducts();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      channel.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return { products, loading, error, refetch: fetchProducts };
}
