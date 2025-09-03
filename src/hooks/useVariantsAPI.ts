import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductOption, ProductVariant } from '@/types/variant';
import { toast } from 'sonner';

// جلب جميع الخيارات المستخدمة سابقاً
export const useAllProductOptions = () => {
  return useQuery({
    queryKey: ['all-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_all_product_options' as any);
      
      if (error) {
        console.error('Error fetching all options:', error);
        return [];
      }
      return (data as unknown) as { name: string; option_values: string[] }[];
    }
  });
};

// جلب خيارات المنتج
export const useProductOptions = (productId: string) => {
  return useQuery({
    queryKey: ['product-options', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .rpc('get_product_options' as any, { p_product_id: productId });
      
      if (error) {
        console.error('Error fetching product options:', error);
        return [];
      }
      return (data as unknown) as ProductOption[];
    },
    enabled: !!productId
  });
};

// جلب فيرنتس المنتج  
export const useProductVariants = (productId: string) => {
  return useQuery({
    queryKey: ['product-variants', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .rpc('get_product_variants' as any, { p_product_id: productId });
      
      if (error) {
        console.error('Error fetching product variants:', error);
        return [];
      }
      return (data as unknown) as ProductVariant[];
    },
    enabled: !!productId
  });
};

// جلب المنتج مع الفيرنتس
export const useProductWithVariants = (productId: string) => {
  return useQuery({
    queryKey: ['product-with-variants', productId],
    queryFn: async () => {
      if (!productId) return null;
      
      const { data, error } = await supabase
        .rpc('get_product_with_variants' as any, { 
          input_product_id: productId,
          language_code: 'ar'
        });
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId
  });
};

// العثور على فيرنت بالاختيار
export const useFindVariantBySelection = () => {
  return useMutation({
    mutationFn: async ({ productId, selection }: { 
      productId: string; 
      selection: Record<string, string> 
    }) => {
      const { data, error } = await supabase
        .rpc('find_variant_by_selection' as any, {
          p_product_id: productId,
          p_selection: selection
        });
      
      if (error) throw error;
      return data?.[0] as ProductVariant | null;
    }
  });
};

// إنشاء فيرنت جديد
export const useCreateVariant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, variantData }: {
      productId: string;
      variantData: Omit<ProductVariant, 'id' | 'created_at'>;
    }) => {
      const { data, error } = await supabase
        .rpc('create_product_variant' as any, {
          input_product_id: productId,
          variant_data: JSON.stringify(variantData)
        });
      
      if (error) throw error;
      return data?.[0] as ProductVariant;
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      queryClient.invalidateQueries({ queryKey: ['product-with-variants', productId] });
    }
  });
};

// تحديث فيرنت
export const useUpdateVariant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ variantId, variantData, productId }: {
      variantId: string;
      variantData: Partial<ProductVariant>;
      productId: string;
    }) => {
      const { data, error } = await supabase
        .rpc('update_product_variant' as any, {
          variant_id: variantId,
          variant_data: JSON.stringify(variantData)
        });
      
      if (error) throw error;
      return data?.[0] as ProductVariant;
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      queryClient.invalidateQueries({ queryKey: ['product-with-variants', productId] });
    }
  });
};

// حذف فيرنت
export const useDeleteVariant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ variantId, productId }: {
      variantId: string;
      productId: string;
    }) => {
      const { error } = await supabase
        .rpc('delete_product_variant' as any, { variant_id: variantId });
      
      if (error) throw error;
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      queryClient.invalidateQueries({ queryKey: ['product-with-variants', productId] });
      toast.success('تم حذف الفيرنت بنجاح');
    }
  });
};

// تحديث المنتج لدعم الفيرنتس
export const useUpdateProductHasVariants = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, hasVariants }: {
      productId: string;
      hasVariants: boolean;
    }) => {
      const { error } = await supabase
        .from('products')
        .update({ has_variants: hasVariants } as any)
        .eq('id', productId);
      
      if (error) throw error;
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-with-variants', productId] });
    }
  });
};

// حفظ الفيرنتس بالكامل
export const useSaveProductVariants = () => {
  const updateHasVariants = useUpdateProductHasVariants();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, options, variants }: {
      productId: string;
      options: ProductOption[];
      variants: ProductVariant[];
    }) => {
      try {
        // استخدام RPC function لحفظ الفيرنتس
        const { error } = await supabase
          .rpc('save_product_variants' as any, {
            p_product_id: productId,
            p_options: JSON.stringify(options),
            p_variants: JSON.stringify(variants)
          });
        
        if (error) {
          console.error('Error saving variants:', error);
          throw error;
        }
        
        // تحديث حالة has_variants
        await updateHasVariants.mutateAsync({ 
          productId, 
          hasVariants: options.length > 0 && variants.length > 0 
        });
        
        return { success: true };
      } catch (error) {
        console.error('Error saving variants:', error);
        throw error;
      }
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ['product-options', productId] });
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      queryClient.invalidateQueries({ queryKey: ['product-with-variants', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['all-options'] }); // تحديث قائمة الخيارات العامة
    }
  });
};
