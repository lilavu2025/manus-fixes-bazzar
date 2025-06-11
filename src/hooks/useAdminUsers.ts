import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import type { Json } from '@/integrations/supabase/types';
import type { UserProfile } from '@/types/profile';
import { toast } from 'sonner';

// Supabase type for deleted_users (مؤقت حتى تحديث الأنواع)
type DeletedUserInsert = {
  user_id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  deleted_by?: string | null;
  original_data?: Json;
};

// هوك مخصص لإدارة المستخدمين من قبل الأدمن
export const useAdminUsers = () => {
  const { profile } = useAuth();

  // حالة لتخزين جميع المستخدمين
  const [users, setUsers] = useState<UserProfile[]>([]);

  // حالة لتحديد ما إذا كانت البيانات قيد التحميل
  const [isLoading, setIsLoading] = useState(false);

  // حالة لتخزين الخطأ إن وُجد
  const [error, setError] = useState<string | null>(null);

  // حالات التحكم في الفلترة والفرز
  const [searchQuery, setSearchQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // دالة تحميل بيانات المستخدمين من Supabase
  const fetchUsers = useCallback(async () => {
    try {
      console.log('⏳ بدء تحميل بيانات المستخدمين...');
      setIsLoading(true);
      setError(null);

      // التحقق من أن المستخدم الحالي هو أدمن
      if (profile?.user_type !== 'admin') {
        const accessDeniedMsg = '🚫 صلاحيات غير كافية. يلزم أن تكون أدمن.';
        console.warn(accessDeniedMsg);
        setError(accessDeniedMsg);
        return;
      }

      // جلب جميع المستخدمين من جدول profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('❌ خطأ في جلب البيانات من Supabase:', profilesError);
        throw profilesError;
      }

      console.log('✅ البيانات المسترجعة من Supabase:', profilesData);

      // تحويل البيانات إلى صيغة UserProfile
      const allUsers: UserProfile[] = [];

      profilesData?.forEach(profile => {
        allUsers.push({
          id: profile.id,
          full_name: profile.full_name || 'غير محدد',
          phone: profile.phone,
          user_type: profile.user_type || 'retail',
          created_at: profile.created_at,
          email: profile.email || 'غير محدد',
          email_confirmed_at: profile.email_confirmed_at,
          last_sign_in_at: profile.last_sign_in_at,
          last_order_date: profile.last_order_date,
          highest_order_value: profile.highest_order_value,
          disabled: profile.disabled ?? false,
          updated_at: profile.updated_at
        });
      });

      console.log('📦 القائمة النهائية للمستخدمين:', allUsers);

      // تحديث الحالة
      setUsers(allUsers);
    } catch (err: unknown) {
      console.error('❌ فشل تحميل المستخدمين:', err);
      setError((err as Error).message || 'حدث خطأ أثناء تحميل المستخدمين');
    } finally {
      console.log('✅ الانتهاء من تحميل المستخدمين');
      setIsLoading(false);
    }
  }, [profile]);

  // تشغيل الدالة عند تحميل الصفحة أو عند تغير المستخدم الحالي
  useEffect(() => {
    if (profile) {
      fetchUsers();
    }
  }, [profile, fetchUsers]);

  // تصفية وفرز المستخدمين بحسب الحالات
  const filteredAndSortedUsers = useMemo(() => {
    console.log('🔍 تطبيق الفلاتر والفرز...');
    
    const filtered = users.filter(user => {
      const matchesSearch =
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        userTypeFilter === 'all' || user.user_type === userTypeFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.email_confirmed_at) ||
        (statusFilter === 'inactive' && !user.email_confirmed_at);

      return matchesSearch && matchesType && matchesStatus;
    });

    console.log('👥 عدد المستخدمين بعد الفلترة:', filtered.length);

    // تطبيق الفرز
    filtered.sort((a, b) => {
      let aValue = a[sortBy as keyof UserProfile];
      let bValue = b[sortBy as keyof UserProfile];

      // التعامل مع التواريخ
      if (sortBy === 'created_at' || sortBy === 'last_sign_in_at' || sortBy === 'last_order_date') {
        // إذا كانت القيمة منطقية (boolean)، حوّلها إلى رقم للمقارنة
        if (typeof aValue === 'boolean') aValue = aValue ? 1 : 0;
        if (typeof bValue === 'boolean') bValue = bValue ? 1 : 0;
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      return sortOrder === 'asc'
        ? aValue > bValue ? 1 : -1
        : aValue < bValue ? 1 : -1;
    });

    console.log('✅ الانتهاء من الفرز، عدد المستخدمين النهائي:', filtered.length);
    return filtered;
  }, [users, searchQuery, userTypeFilter, statusFilter, sortBy, sortOrder]);

  // دالة تسجيل النشاط
  const logUserActivity = async (userId: string, action: string, details: Record<string, unknown> = {}) => {
    if (!profile?.id) return;
    const { error } = await supabase.from('user_activity_log').insert([
      {
        admin_id: profile.id,
        user_id: userId,
        action,
        details: details as Json,
        created_at: new Date().toISOString(),
      }
    ]);
    // لا alert، فقط إرجاع النتيجة
    return error;
  };

  // دالة تعطيل مستخدم
  const disableUser = async (userId: string, disabled: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ disabled })
      .eq('id', userId);
    if (error) throw error;
    const logError = await logUserActivity(userId, disabled ? 'disable' : 'enable', { disabled });
    if (logError) {
      toast('فشل تسجيل النشاط في سجل الأدمن!');
    } else {
      toast(disabled ? 'تم تعطيل المستخدم بنجاح' : 'تم تفعيل المستخدم بنجاح');
    }
    await fetchUsers();
  };

  // دالة حذف مستخدم
  const deleteUser = async (userId: string) => {
    // جلب بيانات المستخدم قبل الحذف
    const { data: userData, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (fetchError || !userData) throw fetchError || new Error('User not found');

    // أرشفة بيانات المستخدم في جدول deleted_users
    const adminName = profile?.full_name || profile?.id || null;
    await supabase.from('deleted_users').insert([
      {
        user_id: userData.id,
        full_name: userData.full_name,
        email: userData.email,
        phone: userData.phone,
        address: userData.address ?? null,
        deleted_by: adminName,
        original_data: userData as Json,
        last_sign_in_at: userData.last_sign_in_at ?? null,
      }
    ]);

    // حذف المستخدم من profiles
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (error) throw error;
    await logUserActivity(userId, 'delete');
    await fetchUsers();
  };

  // حساب عدد حسابات الجملة والمفرق
  const wholesaleCount = users.filter(u => u.user_type === 'wholesale').length;
  const retailCount = users.filter(u => u.user_type === 'retail').length;

  // القيم التي يتم إرجاعها من الهوك
  return {
    users,
    filteredAndSortedUsers,
    isLoading,
    error,
    searchQuery, setSearchQuery,
    userTypeFilter, setUserTypeFilter,
    statusFilter, setStatusFilter,
    sortBy, setSortBy,
    sortOrder, setSortOrder,
    refetch: fetchUsers,
    disableUser,
    deleteUser,
    wholesaleCount,
    retailCount,
  };
};
