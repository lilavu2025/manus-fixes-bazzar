// جميع الـ hooks المخصصة لربط دوال Supabase مع react-query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as fetchers from './dataFetchers';
import * as senders from './dataSenders';
import type { Language } from '@/types/language';
import type { Tables, TablesInsert, TablesUpdate } from './types';
import type { Product as AppProduct } from '@/types/index';

// --- Helper imports for hooks that need direct function references ---
// These are only imported if they exist in the respective files
const { fetchCategoriesWithProductCount, fetchOrdersWithDetails, fetchUserOrdersWithDetails } = fetchers;
const { disableUserById, logUserActivity, cancelUserOrder } = senders;

// إضافة منتج للسلة
export function useAddToCart() {
  return useMutation({
    mutationFn: ({ userId, productId, quantity }: { userId: string; productId: string; quantity: number }) =>
      senders.addToCart(userId, productId, quantity),
  });
}

// تحديث كمية منتج في السلة
export function useUpdateCartItem() {
  return useMutation({
    mutationFn: ({ userId, productId, quantity }: { userId: string; productId: string; quantity: number }) =>
      senders.updateCartItem(userId, productId, quantity),
  });
}

// حذف منتج من السلة
export function useRemoveFromCart() {
  return useMutation({
    mutationFn: ({ userId, productId }: { userId: string; productId: string }) =>
      senders.removeFromCart(userId, productId),
  });
}

// حذف كل السلة
export function useClearUserCart() {
  return useMutation({
    mutationFn: (userId: string) => senders.clearUserCart(userId),
  });
}

// إنشاء ملف تعريف
export function useInsertProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: TablesInsert<'profiles'>) => senders.createProfile(profile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// تحديث ملف تعريف
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: TablesUpdate<'profiles'> }) => senders.updateProfile(userId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// تغيير كلمة المرور
export function useChangeUserPassword() {
  return useMutation({
    mutationFn: ({ email, currentPassword, newPassword }: { email: string; currentPassword: string; newPassword: string }) =>
      senders.changeUserPassword(email, currentPassword, newPassword),
  });
}

// تسجيل الدخول
export function useSignIn() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      senders.signIn(email, password),
  });
}
// تسجيل حساب جديد
export function useSignUp() {
  return useMutation({
    mutationFn: ({ email, password, fullName, phone }: { email: string; password: string; fullName: string; phone?: string }) =>
      senders.signUp(email, password, fullName, phone),
  });
}
// تسجيل الخروج
export function useSignOut() {
  return useMutation({
    mutationFn: () => senders.signOut(),
  });
}

// رفع صورة إلى التخزين
export function useUploadImageToStorage() {
  return useMutation({
    mutationFn: ({ bucket, filePath, file }: { bucket: string; filePath: string; file: File }) =>
      senders.uploadImageToStorage(bucket, filePath, file),
  });
}
// جلب رابط صورة عامة
export function useGetPublicImageUrl() {
  return useMutation({
    mutationFn: ({ bucket, filePath }: { bucket: string; filePath: string }) =>
      senders.getPublicImageUrl(bucket, filePath),
  });
}

// إعادة إرسال إيميل التفعيل
export function useResendConfirmationEmail() {
  return useMutation({
    mutationFn: (email: string) => senders.resendConfirmationEmail(email),
  });
}

// إحصائيات الطلبات للوحة التحكم
export function useAdminOrdersStats(t: (key: string) => string) {
  return useQuery({
    queryKey: ['admin-orders-stats'],
    queryFn: () => fetchers.fetchAdminOrdersStats(t),
    gcTime: 1000 * 60 * 10,
    staleTime: 1000 * 60 * 5,
  });
}

// إضافة فئة جديدة
export function useInsertCategory() {
  return useMutation({
    mutationFn: (category: { name_ar: string; name_en: string; name_he: string; image: string; active: boolean; icon: string }) =>
      senders.insertCategory(category),
  });
}

// إضافة منتج جديد
export function useInsertProduct() {
  return useMutation({
    mutationFn: (product: TablesInsert<'products'>) => senders.insertProduct(product),
  });
}

// جلب البانرات
export function useBannersQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['banners'],
    queryFn: fetchers.getBanners,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    ...options,
  });
}

// إضافة بانر
export function useAddBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bannerData: Omit<fetchers.Banner, 'id' | 'created_at'>) => senders.addBanner(bannerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
  });
}

// تعديل بانر
export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, bannerData }: { id: string; bannerData: Partial<Omit<fetchers.Banner, 'id' | 'created_at'>> }) => senders.updateBanner(id, bannerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
  });
}

// حذف بانر
export function useDeleteBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => senders.deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
  });
}

// تفعيل/تعطيل بانر
export function useToggleBannerActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, currentStatus }: { id: string; currentStatus: boolean }) => senders.toggleBannerActive(id, currentStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
  });
}

// رفع صورة بانر
export function useUploadBannerImage() {
  return useMutation({
    mutationFn: (file: File) => senders.uploadBannerImage(file),
  });
}

// جلب معلومات الاتصال
export function useGetContactInfo() {
  return useQuery({
    queryKey: ['contact-info'],
    queryFn: fetchers.getContactInfo,
    gcTime: 1000 * 60 * 10,
    staleTime: 1000 * 60 * 5,
  });
}

// تحديث معلومات الاتصال
export function useUpdateContactInfo() {
  return useMutation({
    mutationFn: (info: Partial<fetchers.ContactInfo>) => senders.updateContactInfo(info),
  });
}

// إضافة عرض جديد
export function useAddOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (offerData: TablesInsert<'offers'>) => senders.addOffer(offerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });
}

// تعديل عرض
export function useUpdateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updateData }: { id: string; updateData: Partial<TablesUpdate<'offers'>> }) => senders.updateOffer(id, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });
}

// حذف عرض
export function useDeleteOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => senders.deleteOffer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });
}

// تحديث حالة الطلب
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, newStatus, userMeta }: { orderId: string; newStatus: string; userMeta?: { full_name?: string; email?: string } }) =>
      senders.updateOrderStatus(orderId, newStatus, userMeta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// إضافة طلب جديد
export function useAddOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderInsertObj, orderItems }: { orderInsertObj: TablesInsert<'orders'>; orderItems: Omit<TablesInsert<'order_items'>, 'order_id'>[] }) =>
      senders.addOrder(orderInsertObj, orderItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// تعديل طلب
export function useEditOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ editOrderId, updateObj, orderItems }: { editOrderId: string; updateObj: TablesUpdate<'orders'>; orderItems: Omit<TablesInsert<'order_items'>, 'order_id'>[] }) =>
      senders.editOrder(editOrderId, updateObj, orderItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// حذف طلب
export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => senders.deleteOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// حذف منتج
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => senders.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// جلب جميع المستخدمين (للاستخدام الإداري)
export function useAdminUsersQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchers.fetchAllUsers,
    staleTime: 1000 * 60 * 5, // 5 دقائق
    gcTime: 1000 * 60 * 10, // 10 دقائق
    ...options,
  });
}

// تعطيل/تفعيل مستخدم
export function useDisableUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, disabled }: { userId: string; disabled: boolean }) => {
      return await disableUserById(userId, disabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

// تسجيل نشاط الأدمن
export function useLogUserActivityMutation() {
  return useMutation({
    mutationFn: async (params: { adminId: string; userId: string; action: string; details?: Record<string, unknown> }) => {
      return await logUserActivity(params.adminId, params.userId, params.action, params.details);
    },
  });
}

// جلب الفئات مع عدد المنتجات لكل فئة (للاستخدام الإداري)
export function useCategoriesWithProductCountQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['admin-categories-with-count'],
    queryFn: fetchers.fetchCategoriesWithProductCount,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    ...options,
  });
}

// جلب الطلبات مع تفاصيل المستخدم والعناصر
export function useOrdersWithDetailsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['admin-orders-with-details'],
    queryFn: fetchers.fetchOrdersWithDetails,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    ...options,
  });
}

// جلب طلبات مستخدم مع تفاصيل المنتجات
export function useUserOrdersWithDetailsQuery(userId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['user-orders-with-details', userId],
    queryFn: () => fetchers.fetchUserOrdersWithDetails(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    ...options,
  });
}

// إلغاء طلب من قبل المستخدم
export function useCancelUserOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { orderId: string; userMeta: { full_name?: string; email?: string; displayName?: string } }) => {
      return await cancelUserOrder(params.orderId, params.userMeta);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-orders-with-details'] });
    },
  });
}

// حذف فئة
export function useDeleteCategory() {
  return useMutation({
    mutationFn: (categoryId: string) => senders.deleteCategory(categoryId),
  });
}

// --- Removed hook referencing non-existent fetcher ---
// useGetUserCart
// --- End of removals ---
