import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/utils/languageContextUtils";
import UserDetailsDialog from "./UserDetailsDialog";
import ActivityLogDialog from "./ActivityLogDialog";
import ActivityChangeDisplay from "./ActivityChangeDisplay";
import type { UserProfile } from "@/types/profile";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { 
  Download, 
  Activity, 
  User, 
  Shield, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX,
  Clock,
  FileSpreadsheet,
  Eye,
  Filter,
  Search,
  RotateCcw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";

const UserActivityLogTable: React.FC = () => {
  const { t, language, isRTL: isRTLDirection } = useLanguage();
  const ACTION_LABELS: Record<string, string> = {
    disable: t("disableUser") || "تعطيل المستخدم",
    enable: t("enableUser") || "تفعيل المستخدم", 
    delete: t("deleteUser") || "حذف المستخدم",
    restore: t("restoreUser") || "استعادة المستخدم",
    update: t("updateUser") || "تحديث بيانات المستخدم",
    create: t("createUser") || "إنشاء مستخدم جديد",
    password_reset: t("passwordReset") || "إعادة تعيين كلمة المرور",
    stock_increased: t("stockIncreased") || "زيادة المخزون",
    stock_decreased: t("stockDecreased") || "نقص المخزون",
    login: t("userLogin") || "دخول المستخدم",
    logout: t("userLogout") || "خروج المستخدم",
    profile_update: t("profileUpdate") || "تحديث الملف الشخصي",
    type_change: t("userTypeChange") || "تغيير نوع المستخدم",
  };

  const FIELD_LABELS: Record<string, string> = {
    full_name: t("fullName") || "الاسم الكامل",
    phone: t("phone") || "الهاتف",
    user_type: t("userType") || "نوع المستخدم",
    email: t("email") || "البريد الإلكتروني",
  };

  const USER_TYPE_LABELS: Record<string, string> = {
    admin: t("admin") || "مدير",
    wholesale: t("wholesale") || "جملة",
    retail: t("retail") || "تجزئة",
  };

  type ProfileMap = Record<
    string,
    { full_name: string; email: string; phone: string | null } | undefined
  >;

  interface UserActivityLog {
    id: string;
    admin_id: string;
    user_id: string;
    action: string;
    target_field?: string;
    old_value?: string;
    new_value?: string;
    details: any | null;
    created_at: string;
  }

  const [logs, setLogs] = useState<UserActivityLog[]>([]);
  const [allLogs, setAllLogs] = useState<UserActivityLog[]>([]);
  const [profileMap, setProfileMap] = useState<ProfileMap>({});
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserProfile | null>(null);
  const [selectedActivityLog, setSelectedActivityLog] = useState<UserActivityLog | null>(null);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  
  // Filters state
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10); // عدد العناصر في كل صفحة - تم تغييره من 20 إلى 10
  const [initialLoad, setInitialLoad] = useState(true);
  
  // إحصائيات شاملة (من قاعدة البيانات بدون فلاتر)
  const [totalStats, setTotalStats] = useState({
    total: 0,
    deletes: 0,
    disables: 0,
    enables: 0,
    updates: 0,
    uniqueAdmins: 0,
    uniqueUsers: 0,
  });

  // جلب الإحصائيات الشاملة من قاعدة البيانات
  const fetchTotalStats = async () => {
    const { data: statsData } = await supabase
      .from("user_activity_log")
      .select("action, admin_id, user_id");

    if (statsData) {
      const newStats = {
        total: statsData.length,
        deletes: statsData.filter(l => l.action === 'delete').length,
        disables: statsData.filter(l => l.action === 'disable').length,
        enables: statsData.filter(l => l.action === 'enable').length,
        updates: statsData.filter(l => l.action === 'update').length,
        uniqueAdmins: new Set(statsData.map(l => l.admin_id)).size,
        uniqueUsers: new Set(statsData.map(l => l.user_id)).size,
      };
      setTotalStats(newStats);
    }
  };

  // جلب البيانات مع دعم pagination والفلاتر
  const fetchLogsAndProfiles = async (page: number = 1, resetData: boolean = false) => {
    setLoading(true);
    
    // بناء الاستعلام مع الفلاتر
    let query = supabase
      .from("user_activity_log")
      .select("*", { count: 'exact' });

    // تطبيق فلاتر التاريخ
    if (fromDate) {
      const fromDateTime = new Date(fromDate);
      fromDateTime.setHours(0, 0, 0, 0);
      query = query.gte('created_at', fromDateTime.toISOString());
    }

    if (toDate) {
      const toDateTime = new Date(toDate);
      toDateTime.setHours(23, 59, 59, 999);
      query = query.lte('created_at', toDateTime.toISOString());
    }

    // تطبيق فلتر نوع الإجراء
    if (actionFilter && actionFilter !== "all") {
      query = query.eq('action', actionFilter);
    }

    // تطبيق ترتيب وتقسيم الصفحات
    const offset = (page - 1) * pageSize;
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data: logsData, error, count } = await query;
    
    if (error || !logsData) {
      setLoading(false);
      return;
    }

    // تحديث العدد الإجمالي
    setTotalCount(count || 0);

    // إذا كان resetData = true، استبدل البيانات. وإلا أضف إليها
    if (resetData) {
      setLogs(logsData);
      setAllLogs(logsData);
    } else {
      setLogs(prev => [...prev, ...logsData]);
      setAllLogs(prev => [...prev, ...logsData]);
    }

    // اجمع كل الـ id المطلوبة من البيانات الجديدة
    const newIds = Array.from(
      new Set(logsData.flatMap((l) => [l.admin_id, l.user_id]))
    );
    
    if (newIds.length === 0) {
      setLoading(false);
      return;
    }

    // اجلب بيانات المستخدمين من profiles فقط للـ IDs الجديدة
    const existingIds = Object.keys(profileMap);
    const missingIds = newIds.filter(id => !existingIds.includes(id));
    
    if (missingIds.length > 0) {
      // اجلب بيانات المستخدمين من profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,full_name,email,phone")
        .in("id", missingIds);

      const newProfileMap: ProfileMap = { ...profileMap };
      profiles?.forEach((p) => {
        newProfileMap[p.id] = { full_name: p.full_name, email: p.email, phone: p.phone };
      });

      // جلب بيانات المحذوفين إذا لم يوجدوا في profiles
      const stillMissingIds = missingIds.filter((id) => !newProfileMap[id]);
      if (stillMissingIds.length > 0) {
        const { data: deletedUsers } = await supabase
          .from("deleted_users")
          .select("user_id,full_name,email,phone")
          .in("user_id", stillMissingIds);

        (
          deletedUsers as
            | Array<{
                user_id: string;
                full_name: string | null;
                email: string | null;
                phone: string | null;
              }>
            | undefined
        )?.forEach((u) => {
          newProfileMap[u.user_id] = {
            full_name: u.full_name || t("deletedUser"),
            email: u.email,
            phone: u.phone,
          };
        });
      }
      
      setProfileMap(newProfileMap);
    }

    setLoading(false);
  };

  // جلب البيانات عند تحميل المكون
  useEffect(() => {
    fetchTotalStats(); // جلب الإحصائيات الشاملة أولاً
    fetchLogsAndProfiles(1, true);
    setInitialLoad(false);
  }, [t]);

  // إعادة تطبيق الفلاتر عند تغييرها (تجنب التشغيل في التحميل الأولي)
  useEffect(() => {
    if (!initialLoad) {
      setCurrentPage(1);
      fetchLogsAndProfiles(1, true);
    }
  }, [fromDate, toDate, actionFilter, initialLoad]);

  // تطبيق البحث المحلي على البيانات الموجودة مع تحسين البحث
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const adminName = profileMap[log.admin_id]?.full_name?.toLowerCase() || "";
    const userName = profileMap[log.user_id]?.full_name?.toLowerCase() || "";
    const adminEmail = profileMap[log.admin_id]?.email?.toLowerCase() || "";
    const userEmail = profileMap[log.user_id]?.email?.toLowerCase() || "";
    
    // البحث في تفاصيل النشاط أيضاً
    let detailsText = "";
    if (log.details && typeof log.details === "object") {
      const details = log.details as any;
      detailsText = [
        details.full_name,
        details.user_name, 
        details.deletedUserName,
        details.email,
        details.user_email,
        details.admin_name,
        details.admin_full_name,
        details.admin_email
      ].filter(Boolean).join(" ").toLowerCase();
    }
    
    // البحث في نص الإجراء المترجم
    const actionText = (ACTION_LABELS[log.action] || log.action).toLowerCase();
    
    return adminName.includes(searchLower) || 
           userName.includes(searchLower) ||
           adminEmail.includes(searchLower) ||
           userEmail.includes(searchLower) ||
           detailsText.includes(searchLower) ||
           actionText.includes(searchLower);
  });

  // جلب تفاصيل المستخدم عند الضغط
  const handleUserDetails = async (userId: string) => {
    setSelectedUser(userId);
    // جرب أولاً من profiles
    let { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (!data) {
      // إذا لم يوجد، جرب من deleted_users
      const { data: deleted } = await supabase
        .from("deleted_users")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (deleted) {
        data = {
          id: deleted.user_id,
          full_name: deleted.full_name || t("deletedUser"),
          phone: deleted.phone,
          user_type: "retail",
          last_sign_in_at: deleted.last_sign_in_at,
          created_at: deleted.deleted_at,
          updated_at: deleted.deleted_at,
          email: deleted.email,
          disabled: true,
          email_confirmed_at: "",
          highest_order_value: 0,
          language: "",
          last_order_date: "",
        };
      }
    } else {
      // إذا كان من profiles، مرر updated_at
      data.updated_at = data.updated_at || data.created_at || "";
    }
    setUserDetails(data);
  };

  // فتح ديالوج تفاصيل النشاط
  const handleActivityDetails = (log: UserActivityLog) => {
    setSelectedActivityLog(log);
    setActivityDialogOpen(true);
  };

  // إعادة تعيين الفلاتر
  const resetFilters = () => {
    setFromDate("");
    setToDate("");
    setActionFilter("all");
    setSearchTerm("");
    setCurrentPage(1);
  };

  // دوال التحكم في pagination
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const goToFirstPage = () => {
    setCurrentPage(1);
    fetchLogsAndProfiles(1, true);
  };

  const goToPrevPage = () => {
    if (hasPrevPage) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      fetchLogsAndProfiles(newPage, true);
    }
  };

  const goToNextPage = () => {
    if (hasNextPage) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      fetchLogsAndProfiles(newPage, true);
    }
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
    fetchLogsAndProfiles(totalPages, true);
  };

  // زر تصدير سجل النشاط إلى Excel
  const exportAdminActivityToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredLogs.map((l) => {
        // بيانات الأدمن
        let adminName = profileMap[l.admin_id]?.full_name;
        let adminEmail = profileMap[l.admin_id]?.email;
        let adminPhone = profileMap[l.admin_id]?.phone;
        // بيانات المستخدم
        let userName = profileMap[l.user_id]?.full_name;
        let userEmail = profileMap[l.user_id]?.email;
        let userPhone = profileMap[l.user_id]?.phone;
        // إذا لم يوجد اسم المستخدم، جرب من details
        if (
          (!userName || userName === l.user_id) &&
          l.details &&
          typeof l.details === "object"
        ) {
          const detailsObj = l.details as {
            full_name?: string;
            email?: string;
            phone?: string;
            user_name?: string;
            user_email?: string;
            user_phone?: string;
            deletedUserName?: string;
          };
          userName = detailsObj.full_name || detailsObj.user_name || detailsObj.deletedUserName || userName || "مستخدم غير معروف";
          userEmail = detailsObj.email || detailsObj.user_email || userEmail || "";
          userPhone = detailsObj.phone || detailsObj.user_phone || userPhone || "";
        }
        // إذا لم يوجد اسم الأدمن، جرب من details (نادراً)
        if (
          (!adminName || adminName === l.admin_id) &&
          l.details &&
          typeof l.details === "object"
        ) {
          const detailsObj = l.details as {
            admin_full_name?: string;
            admin_email?: string;
            admin_phone?: string;
            admin_name?: string;
          };
          adminName =
            detailsObj.admin_full_name || detailsObj.admin_name || adminName || "مدير غير معروف";
          adminEmail = detailsObj.admin_email || adminEmail || "";
          adminPhone = detailsObj.admin_phone || adminPhone || "";
        }
        return {
          ID: l.id,
          Admin: adminName || "مدير غير معروف",
          "Admin Email": adminEmail || "غير متوفر",
          "Admin Phone": adminPhone || "غير متوفر",
          User: userName || "مستخدم غير معروف",
          "User Email": userEmail || "غير متوفر",
          "User Phone": userPhone || "غير متوفر",
          Action: ACTION_LABELS[l.action] || l.action,
          Field: l.target_field || "",
          "Old Value": l.old_value || "",
          "New Value": l.new_value || "",
          Details: JSON.stringify(l.details),
          Date: l.created_at,
        };
      }),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AdminActivity");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      "admin-activity.xlsx",
    );
  };

  // حساب إحصائيات سريعة للبيانات المعروضة في الصفحة الحالية
  const currentPageStats = {
    displayed: filteredLogs.length,
  };

  // استخدام الإحصائيات الشاملة للعرض
  const displayStats = totalStats;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'delete': return <Trash2 className="h-4 w-4" />;
      case 'disable': return <UserX className="h-4 w-4" />;
      case 'enable': return <UserCheck className="h-4 w-4" />;
      case 'update': return <Edit className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'delete': return 'destructive';
      case 'disable': return 'warning';
      case 'enable': return 'success';
      case 'update': return 'info';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6 mt-8">
      {/* Header Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-blue-900">
                  {t("activityLog") || "سجل نشاط الأدمن"}
                </CardTitle>
                <p className="text-sm text-blue-600 mt-1">
                  {t("adminActivityDescription") || "سجل جميع عمليات الأدمن على النظام"}
                </p>
              </div>
            </div>
            <Button
              onClick={exportAdminActivityToExcel}
              variant="outline"
              className="flex items-center gap-2 hover:bg-blue-50"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {t("exportExcel") || "تصدير Excel"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-900">{totalStats.total}</div>
            <p className="text-xs text-blue-600">{t("totalActivities") || "إجمالي العمليات"}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-900">{totalStats.deletes}</div>
            <p className="text-xs text-red-600">{t("deletions") || "حذف"}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <UserX className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-900">{totalStats.disables}</div>
            <p className="text-xs text-yellow-600">{t("disables") || "تعطيل"}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-900">{totalStats.enables}</div>
            <p className="text-xs text-green-600">{t("enables") || "تفعيل"}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Edit className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-900">{totalStats.updates}</div>
            <p className="text-xs text-purple-600">{t("updates") || "تحديث"}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Shield className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-900">{totalStats.uniqueAdmins}</div>
            <p className="text-xs text-indigo-600">{t("admins") || "مدراء"}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <User className="h-5 w-5 text-teal-600" />
            </div>
            <div className="text-2xl font-bold text-teal-900">{totalStats.uniqueUsers}</div>
            <p className="text-xs text-teal-600">{t("affectedUsers") || "مستخدمين متأثرين"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Filter className="h-5 w-5 text-gray-600" />
            </div>
            <CardTitle className="text-lg text-gray-900">
              {t("logFilters") || "فلاتر السجل"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* فلتر التاريخ من */}
            <div className="space-y-2">
              <Label htmlFor="fromDate" className="text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4 inline mr-2" />
                {t("fromDate") || "من تاريخ"}
              </Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full"
              />
            </div>

            {/* فلتر التاريخ إلى */}
            <div className="space-y-2">
              <Label htmlFor="toDate" className="text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4 inline mr-2" />
                {t("toDate") || "إلى تاريخ"}
              </Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full"
              />
            </div>

            {/* فلتر نوع الإجراء */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                <Activity className="h-4 w-4 inline mr-2" />
                {t("actionType") || "نوع الإجراء"}
              </Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("selectAction") || "اختر الإجراء"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allActions") || "جميع الإجراءات"}</SelectItem>
                  <SelectItem value="delete">{t("deleteUser") || "حذف مستخدم"}</SelectItem>
                  <SelectItem value="disable">{t("disableUser") || "تعطيل مستخدم"}</SelectItem>
                  <SelectItem value="enable">{t("enableUser") || "تفعيل مستخدم"}</SelectItem>
                  <SelectItem value="update">{t("updateUser") || "تحديث مستخدم"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* بحث */}
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-medium text-gray-700">
                <Search className="h-4 w-4 inline mr-2" />
                {t("search") || "بحث"}
              </Label>
              <Input
                id="search"
                type="text"
                placeholder={t("searchInLog") || "البحث في السجل"}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex-1"></div>
            <Button
              variant="outline"
              onClick={resetFilters}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {t("resetLogFilters") || "إعادة تعيين الفلاتر"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
        {loading ? (
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto border-primary"></div>
              <p className="mt-4 text-muted-foreground">
                {t("loadingData") || "جاري التحميل..."}
              </p>
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-50 rounded-lg inline-block mb-4">
              <Activity className="h-12 w-12 text-gray-400 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("noActivities") || "لا توجد عمليات"}
            </h3>
            <p className="text-gray-500">
              {t("noActivitiesDescription") || "لم يتم تسجيل أي نشاط للأدمن بعد"}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-gray-50/80 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className={`w-1/4 font-semibold ${isRTLDirection ? 'text-right' : 'text-left'}`}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {t("admin")}
                      </div>
                    </TableHead>
                    <TableHead className={`w-1/4 font-semibold ${isRTLDirection ? 'text-right' : 'text-left'}`}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t("user")}
                      </div>
                    </TableHead>
                    <TableHead className={`w-1/6 text-center font-semibold ${isRTLDirection ? 'text-right' : 'text-left'}`}>
                      <div className="flex items-center gap-2 justify-center">
                        <Activity className="h-4 w-4" />
                        {t("actions")}
                      </div>
                    </TableHead>
                    <TableHead className={`w-1/3 text-center font-semibold ${isRTLDirection ? 'text-right' : 'text-left'}`}>
                      <div className="flex items-center gap-2 justify-center">
                        <Clock className="h-4 w-4" />
                        {t("dateAndDetails")}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log, index) => {
                    // استخراج بيانات المستخدم مع تحسين العرض
                    const userProfile = profileMap[log.user_id];
                    let displayName = userProfile?.full_name;
                    let displayEmail = userProfile?.email;
                    let displayPhone = userProfile?.phone;
                    
                    // محاولة الحصول على البيانات من details إذا لم تتوفر في profiles
                    if (
                      (!displayName || !displayEmail) &&
                      log.details &&
                      typeof log.details === "object"
                    ) {
                      const detailsObj = log.details as {
                        full_name?: string;
                        email?: string;
                        phone?: string;
                        user_name?: string;
                        user_email?: string;
                        user_phone?: string;
                        deletedUserName?: string;
                      };
                      displayName = displayName || detailsObj.full_name || detailsObj.user_name || detailsObj.deletedUserName;
                      displayEmail = displayEmail || detailsObj.email || detailsObj.user_email;
                      displayPhone = displayPhone || detailsObj.phone || detailsObj.user_phone;
                    }
                    
                    // تحسين عرض الاسم
                    if (!displayName || displayName.trim() === '') {
                      displayName = t("unknownUser") || "مستخدم غير معروف";
                    }
                    if (!displayEmail || displayEmail.trim() === '') {
                      displayEmail = t("emailNotAvailable") || "البريد غير متوفر";
                    }
                    
                    const canShowDetails = userProfile || (displayName && displayName !== "مستخدم غير معروف");
                    const adminProfile = profileMap[log.admin_id];
                    
                    // تحسين عرض اسم الأدمن
                    const adminDisplayName = adminProfile?.full_name || t("unknownAdmin") || "مدير غير معروف";
                    
                    return (
                      <TableRow 
                        key={log.id} 
                        className={`hover:bg-gray-50/50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        }`}
                      >
                        {/* عمود الأدمن */}
                        <TableCell className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 rounded-full">
                              <Shield className="h-3 w-3 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-blue-900 text-sm truncate">
                                {adminDisplayName}
                              </div>
                              {adminProfile?.email && (
                                <div className="text-xs text-blue-600 truncate">
                                  {adminProfile.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* عمود المستخدم */}
                        <TableCell className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-gray-100 rounded-full">
                              <User className="h-3 w-3 text-gray-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              {canShowDetails ? (
                                <Button
                                  variant="link"
                                  className="p-0 h-auto font-medium text-sm text-gray-900 hover:text-blue-600 truncate"
                                  onClick={async () => {
                                    if (userProfile) {
                                      await handleUserDetails(log.user_id);
                                    } else {
                                      setUserDetails({
                                        id: log.user_id,
                                        full_name: displayName,
                                        phone: null,
                                        user_type: "retail",
                                        created_at: "",
                                        updated_at: "",
                                        email: displayEmail,
                                        disabled: true,
                                      });
                                      setSelectedUser(log.user_id);
                                    }
                                  }}
                                >
                                  {displayName}
                                </Button>
                              ) : (
                                <span className="text-sm text-gray-500 italic truncate">
                                  {displayName}
                                </span>
                              )}
                              {displayEmail && (
                                <div className="text-xs text-gray-500 truncate">
                                  {displayEmail}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* عمود الإجراء */}
                        <TableCell className="p-3">
                          <div className="flex justify-center">
                            <Badge 
                              variant={getActionColor(log.action) as any}
                              className="flex items-center gap-1 px-2 py-1"
                            >
                              {getActionIcon(log.action)}
                              <span className="text-xs font-medium">
                                {ACTION_LABELS[log.action] || log.action}
                              </span>
                            </Badge>
                          </div>
                        </TableCell>

                        {/* عمود التاريخ والتفاصيل */}
                        <TableCell className="p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <div className="text-xs text-gray-600">
                                <div className="font-medium">
                                  {new Date(log.created_at).toLocaleDateString(
                                    'en-US',
                                    { 
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      calendar: 'gregory'
                                    }
                                  )}
                                </div>
                                <div className="text-gray-400">
                                  {new Date(log.created_at).toLocaleTimeString(
                                    'en-US',
                                    { 
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true,
                                      calendar: 'gregory'
                                    }
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivityDetails(log)}
                              className="flex items-center gap-1 hover:bg-blue-50 hover:border-blue-300 text-xs px-2 py-1 h-7"
                            >
                              <Eye className="h-3 w-3" />
                              {t("details") || "تفاصيل"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && filteredLogs.length > 0 && totalPages > 1 && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* معلومات الصفحة */}
              <div className="text-sm text-gray-600">
                {t("showingResults") || "عرض"} {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} {t("paginationOf") || "من"} {totalCount} {t("paginationResults") || "نتيجة"}
              </div>

              {/* أزرار التنقل */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToFirstPage}
                  disabled={!hasPrevPage}
                  className="flex items-center gap-1"
                >
                  <ChevronsLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("first") || "الأول"}</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={!hasPrevPage}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("previous") || "السابق"}</span>
                </Button>

                {/* معلومات الصفحة الحالية */}
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-md">
                  <span className="text-sm font-medium text-gray-700">
                    {t("page") || "صفحة"} {currentPage} {t("paginationOf") || "من"} {totalPages}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={!hasNextPage}
                  className="flex items-center gap-1"
                >
                  <span className="hidden sm:inline">{t("next") || "التالي"}</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToLastPage}
                  disabled={!hasNextPage}
                  className="flex items-center gap-1"
                >
                  <span className="hidden sm:inline">{t("last") || "الأخير"}</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* معلومات إضافية على الهواتف */}
            <div className="mt-3 sm:hidden text-center">
              <div className="text-xs text-gray-500">
                {pageSize} {t("itemsPerPage") || "عنصر في كل صفحة"}
              </div>
            </div>
          </div>
        )}

        {/* User Details Dialog */}
        {userDetails && (
          <UserDetailsDialog
            user={userDetails}
            open={!!selectedUser}
            onOpenChange={() => {
              setSelectedUser(null);
              setUserDetails(null);
            }}
          />
        )}

        {/* Activity Log Dialog */}
        <ActivityLogDialog
          log={selectedActivityLog}
          adminProfile={selectedActivityLog ? profileMap[selectedActivityLog.admin_id] : undefined}
          userProfile={selectedActivityLog ? profileMap[selectedActivityLog.user_id] : undefined}
          open={activityDialogOpen}
          onOpenChange={setActivityDialogOpen}
        />
        </CardContent>
      </Card>
    </div>
  );
};

export default UserActivityLogTable;
