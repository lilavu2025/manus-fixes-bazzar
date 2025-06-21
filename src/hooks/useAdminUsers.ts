import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/useAuth";
import type { UserProfile } from "@/types/profile";
import { toast } from "sonner";
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
  // فلترة وفرز
  const [searchQuery, setSearchQuery] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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
      const matchesType =
        userTypeFilter === "all" || user.user_type === userTypeFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.email_confirmed_at) ||
        (statusFilter === "inactive" && !user.email_confirmed_at);
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
      toast(disabled ? "تم تعطيل المستخدم بنجاح" : "تم تفعيل المستخدم بنجاح");
    } else {
      toast("فشل تعطيل/تفعيل المستخدم");
    }
  };

  // حذف مستخدم (كما هو: عبر Netlify Function)
  const deleteUser = async (userId: string) => {
    let error = null;
    try {
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
      const data = await response.json();
      if (!response.ok) {
        error = new Error(data.error || "فشل حذف المستخدم");
      }
    } catch (err) {
      error = err;
    }
    if (error) {
      toast.error(t("userDeleteFailed") || t("unexpectedError"));
      throw error;
    } else {
      toast.success(t("userDeletedSuccessfully"));
    }
  };

  const wholesaleCount = users.filter(
    (u) => u.user_type === "wholesale",
  ).length;
  const retailCount = users.filter((u) => u.user_type === "retail").length;
  const adminCount = users.filter((u) => u.user_type === "admin").length;

  return {
    users: filteredAndSortedUsers,
    allUsers: users,
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
  };
};
