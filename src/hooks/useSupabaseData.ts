// /home/ubuntu/modern-mobile-bazaar/src/hooks/useSupabaseData.ts
import {
  useCategoriesWithProductCountQuery,
  useBannersQuery,
  useAdminUsersQuery,
} from "@/integrations/supabase/reactQueryHooks";
import { useLanguage } from "@/utils/languageContextUtils";
import { useAuth } from "@/contexts/useAuth";
import { Language } from "@/types/language";

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

// انقل كل useCategoriesWithProductCountQuery/useActiveProductsQuery/useBannersQuery/useAdminUsersQuery إلى داخل دوال أو custom hooks فقط

/**
 * Hook لجلب الفئات (Categories)
 */
export const useCategories = () => {
  const categoriesQuery = useCategoriesWithProductCountQuery();
  return categoriesQuery;
};

/**
 * Hook لجلب البانرات (Banners)
 */
export const useBanners = () => {
  const bannersQuery = useBannersQuery();
  return bannersQuery;
};

/**
 * Hook لجلب المستخدمين (Users / Profiles)
 */
export const useUsers = () => {
  const usersQuery = useAdminUsersQuery();
  return usersQuery;
};

/**
 * هوك موحد لجلب البيانات
 */
export function useSupabaseData() {
  const banners: [] = [];
  const loading = false;
  const error = null;
  const refetch = () => {};
  return { banners, loading, error, refetch };
}
