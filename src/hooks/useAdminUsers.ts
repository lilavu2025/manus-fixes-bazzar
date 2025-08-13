import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/contexts/useAuth";
import type { UserProfile } from "@/types/profile";
import { toast } from "sonner";
import { useEnhancedToast } from "@/hooks/useEnhancedToast";
import {
  useAdminUsersQuery,
  useDisableUserMutation,
  useLogUserActivityMutation,
} from "@/integrations/supabase/reactQueryHooks";
import { useLanguage } from "@/utils/languageContextUtils";

// هوك مخصص لإدارة المستخدمين من قبل الأدمن
export const useAdminUsers = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const enhancedToast = useEnhancedToast();
  // فلترة وفرز
  const [searchQuery, setSearchQuery] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // عدد المستخدمين في كل صفحة

  // جلب المستخدمين
  const { data: users = [], isLoading, error, refetch } = useAdminUsersQuery();
  const allUsers = users; // جميع المستخدمين من قاعدة البيانات

  // تعطيل/تفعيل مستخدم
  const disableUserMutation = useDisableUserMutation();
  // تسجيل نشاط الأدمن
  const logUserActivityMutation = useLogUserActivityMutation();

  // تصفية وفرز المستخدمين بحسب الحالات
  const filteredAndSortedUsers = useMemo(() => {
    const filtered = users.filter((user) => {
      const matchesSearch =
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      let matchesType = false;
      if (userTypeFilter === "all") {
        matchesType = true;
      } else if (userTypeFilter === "new") {
        // New users: created in last 30 days
        matchesType = new Date(user.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      } else {
        matchesType = user.user_type === userTypeFilter;
      }
      let matchesStatus = true;
      if (statusFilter === "confirmed") {
        matchesStatus = !!user.email_confirmed_at;
      } else if (statusFilter === "unconfirmed") {
        matchesStatus = !user.email_confirmed_at;
      }
      // "all" or any other value
      return matchesSearch && matchesType && matchesStatus;
    });
    filtered.sort((a, b) => {
      let aValue = a[sortBy as keyof UserProfile];
      let bValue = b[sortBy as keyof UserProfile];
      if (
        sortBy === "created_at" ||
        sortBy === "last_sign_in_at" ||
        sortBy === "last_order_date"
      ) {
        if (typeof aValue === "boolean") aValue = aValue ? 1 : 0;
        if (typeof bValue === "boolean") bValue = bValue ? 1 : 0;
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      } else if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      return sortOrder === "asc"
        ? aValue > bValue
          ? 1
          : -1
        : aValue < bValue
          ? 1
          : -1;
    });
    return filtered;
  }, [users, searchQuery, userTypeFilter, statusFilter, sortBy, sortOrder]);

  // تطبيق pagination على البيانات المفلترة
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedUsers.slice(startIndex, endIndex);
  }, [filteredAndSortedUsers, currentPage, pageSize]);

  // معلومات pagination
  const totalCount = filteredAndSortedUsers.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // دوال التحكم في pagination
  const goToFirstPage = () => setCurrentPage(1);
  const goToPrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));
  const goToLastPage = () => setCurrentPage(totalPages);

  // إعادة تعيين الصفحة عند تغيير الفلاتر
  const resetPage = () => setCurrentPage(1);

  // إعادة تعيين الصفحة عند تغيير الفلاتر
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, userTypeFilter, statusFilter, sortBy, sortOrder]);

  // تعطيل/تفعيل مستخدم
  const disableUser = async (userId: string, disabled: boolean) => {
    const ok = await disableUserMutation.mutateAsync({ userId, disabled });
    if (ok) {
      await logUserActivityMutation.mutateAsync({
        adminId: profile?.id,
        userId,
        action: disabled ? "disable" : "enable",
        details: { disabled },
      });
      enhancedToast.success(disabled ? 'userDisabledSuccess' : 'userEnabledSuccess');
    } else {
      enhancedToast.error('userStatusUpdateFailed');
    }
  };

  // حذف مستخدم (مع fallback للتطوير)
  const deleteUser = async (userId: string) => {
    try {
      // محاولة استخدام Netlify function أولاً (للإنتاج)
      const response = await fetch(
        "/.netlify/functions/delete-and-archive-user",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            adminId: profile?.id || null,
            adminName: profile?.full_name || null,
          }),
        },
      );

      // إذا كانت الاستجابة ناجحة، استخدم الـ function
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          enhancedToast.adminSuccess('userDeleted');
          refetch();
          return;
        }
      }

      // إذا فشلت الـ function (404 في التطوير أو مشكلة في الإنتاج)
      // استخدم الحذف المباشر كـ fallback
      console.warn("Netlify function غير متوفر، استخدام الحذف المباشر");
      
      // استيراد الدالة المباشرة
      const { deleteUserDirectly } = await import('@/integrations/supabase/dataSenders');
      const success = await deleteUserDirectly(userId);
      
      if (!success) {
        throw new Error("فشل في حذف المستخدم");
      }

      // تسجيل النشاط
      if (profile?.id) {
        await logUserActivityMutation.mutateAsync({
          adminId: profile.id,
          userId,
          action: "delete",
          details: { deletedUser: true, method: "direct" },
        });
      }

      enhancedToast.adminSuccess('userDeleted');
      refetch();

    } catch (err) {
      console.error("خطأ في حذف المستخدم:", err);
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      enhancedToast.adminError('userDeleteFailed');
      throw new Error(errorMessage);
    }
  };

  const wholesaleCount = users.filter(
    (u) => u.user_type === "wholesale",
  ).length;
  const retailCount = users.filter((u) => u.user_type === "retail").length;
  const adminCount = users.filter((u) => u.user_type === "admin").length;

  return {
    users: paginatedUsers, // البيانات المقسمة للصفحة الحالية
    allUsers: users,
    filteredUsers: filteredAndSortedUsers, // جميع البيانات المفلترة قبل التقسيم
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    userTypeFilter,
    setUserTypeFilter,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    disableUser,
    deleteUser,
    refetch, // إرجاع refetch
    wholesaleCount,
    retailCount,
    adminCount,
    // pagination data
    currentPage,
    totalCount,
    totalPages,
    pageSize,
    hasNextPage,
    hasPrevPage,
    goToFirstPage,
    goToPrevPage,
    goToNextPage,
    goToLastPage,
    resetPage,
  };
};
