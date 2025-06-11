// /home/ubuntu/modern-mobile-bazaar/src/hooks/useSupabaseData.ts
import { useLiveSupabaseQuery } from './useLiveSupabaseQuery';
import {
  CategoryService,
  ProductService,
  BannerService,
  ProfileService,
} from '@/services/supabaseService';
import { useLanguage } from '@/utils/languageContextUtils';
import { useAuth } from '@/contexts/useAuth';
import { Profile } from '@/contexts/AuthContext';
import { Language } from '@/types/language';
import { supabase } from '@/integrations/supabase/client';

/**
 * خيارات مشتركة لجميع الـ queries:
 * - staleTime: تعتبر البيانات طازجة لمدة 5 دقائق
 * - refetchOnWindowFocus: إعادة الجلب عند العودة للنافذة
 * - refetchInterval: polling كل دقيقة (60000 ms)
 *
 * تم تعطيل polling (refetchInterval) في كل الاستعلامات لأن المتصفح يوقفه بالخلفية،
 * والاعتماد على WebSocket أو إعادة الجلب عند العودة للواجهة أفضل.
 */
// إلغاء الكاش نهائياً: كل استعلام يعتبر قديم دائماً
const COMMON_OPTIONS = {
  staleTime: 0, // دائماً قديم
  cacheTime: 0, // لا يحتفظ بالكاش
  refetchOnWindowFocus: true,
};

/** 
 * Hook لجلب الفئات (Categories) 
 */
export const useCategories = () => {
  const { language } = useLanguage();
  const query = useLiveSupabaseQuery({
    queryFn: async () => {
      const data = await CategoryService.getCategories(language as Language);
      if (!data) throw new Error('Error fetching categories');
      return { data };
    },
    retryInterval: 5000,
  });
  return { ...query, error: query.error };
};

/** 
 * Hook لجلب المنتجات (Products) 
 */
export const useProducts = (categoryId?: string) => {
  const { language } = useLanguage();
  const { profile } = useAuth();
  const query = useLiveSupabaseQuery({
    queryFn: async () => {
      const userType = profile?.user_type as Profile['user_type'] | null | undefined;
      const data = await ProductService.getProducts(language as Language, userType, categoryId);
      if (!data) throw new Error('Error fetching products');
      return { data };
    },
    retryInterval: 5000,
  });
  return { ...query, error: query.error };
};

/**
 * Hook لجلب البانرات (Banners)
 */
export const useBanners = () => {
  const { language } = useLanguage();
  const query = useLiveSupabaseQuery({
    queryFn: async () => {
      const data = await BannerService.getBanners(language as Language);
      if (!data) throw new Error('Error fetching banners');
      return { data };
    },
    retryInterval: 5000,
  });
  return { ...query, error: query.error };
};

/**
 * Hook لجلب المستخدمين (Users / Profiles)
 */
export const useUsers = () => {
  const query = useLiveSupabaseQuery({
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw new Error('Error fetching users');
      return { data };
    },
    retryInterval: 5000,
  });
  return { ...query, error: query.error };
};
