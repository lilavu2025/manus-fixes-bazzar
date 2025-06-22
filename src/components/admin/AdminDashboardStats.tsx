import React, { useState, useEffect } from "react";
import { useAdminOrdersStats } from "@/integrations/supabase/reactQueryHooks";
import { useLanguage } from "../../utils/languageContextUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Package, ShoppingCart, Users, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UserProfile } from "@/types/profile";
import type { Product } from "@/types/index";
import { useCategoriesRealtime } from "@/hooks/useCategoriesRealtime";

// Helper types
interface UsersByType {
  [key: string]: number;
}
interface ProductsByCategoryStats {
  total: number;
  inStock: number;
  outOfStock: number;
}
interface Category {
  id: string;
  name_ar?: string;
  name_en?: string;
  name_he?: string;
}

interface LowStockProduct {
  id: string;
  name: string;
  name_ar?: string;
  name_en?: string;
  name_he?: string;
  stock_quantity: number;
}

interface AdminDashboardStatsProps {
  onFilterUsers?: (userType: string) => void;
  onFilterOrders?: (status: string) => void;
  pendingOrders?: {
    id: string;
    created_at: string;
    profiles?: { full_name: string; email?: string; phone?: string };
  }[];
  lowStockProductsData?: LowStockProduct[];
  users?: UserProfile[];
  products?: Product[];
}

const AdminDashboardStats: React.FC<AdminDashboardStatsProps> = ({
  onFilterUsers,
  onFilterOrders,
  pendingOrders = [],
  lowStockProductsData = [],
  users = [],
  products = [],
}) => {
  const { categories: categoriesList } = useCategoriesRealtime();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [isUsersExpanded, setIsUsersExpanded] = useState(false);
  const [isOrdersExpanded, setIsOrdersExpanded] = useState(false);
  const [isRevenueExpanded, setIsRevenueExpanded] = useState(false);
  const [showPendingOrdersDetails, setShowPendingOrdersDetails] =
    useState(false);
  const [showLowStockDetails, setShowLowStockDetails] = useState(false);
  const [isTotalOrdersExpanded, setIsTotalOrdersExpanded] = useState(false);
  const [isProductsExpanded, setIsProductsExpanded] = useState(false);

  // إحصائيات الطلبات
  const {
    data: ordersStats,
    isLoading: ordersLoading,
    error: ordersError,
  } = useAdminOrdersStats(t);

  const handleUserTypeClick = (userType: string) => {
    if (onFilterUsers) {
      onFilterUsers(userType);
    }
    navigate("/admin/users", { state: { filterType: userType } });
  };

  const handleOrderStatusClick = (status: string) => {
    if (onFilterOrders) {
      onFilterOrders(status);
    }
    navigate("/admin/orders", { state: { filterStatus: status } });
  };

  // Fetch monthly orders and revenue data
  const { data: monthlyData = [], isLoading: monthlyLoading } = useQuery({
    queryKey: ["admin-monthly-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("created_at, total, status")
        .gte(
          "created_at",
          new Date(new Date().getFullYear(), 0, 1).toISOString(),
        )
        .order("created_at", { ascending: true });

      if (error) throw error;

      // طباعة بيانات الطلبات الخام قبل التجميع
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.log('orders raw', data);
      }

      const monthNames = [
        t("january"),
        t("february"),
        t("march"),
        t("april"),
        t("may"),
        t("june"),
        t("july"),
        t("august"),
        t("september"),
        t("october"),
        t("november"),
        t("december"),
      ];
      // تجهيز إحصائيات الطلبات والإيرادات لكل شهر حتى الشهر الحالي فقط
      const now = new Date();
      const currentMonth = now.getMonth(); // 0-based
      const monthlyStats: Record<
        number,
        { month: string; orders: number; revenue: number }
      > = {};
      // املأ الشهور من 0 حتى الشهر الحالي فقط
      for (let i = 0; i <= currentMonth; i++) {
        monthlyStats[i] = { month: monthNames[i], orders: 0, revenue: 0 };
      }
      // اجمع الطلبات حسب الشهر
      data.forEach((order: { created_at: string; status: string; total: number }) => {
        const date = new Date(order.created_at);
        const monthKey = date.getMonth();
        if (monthKey <= currentMonth) {
          monthlyStats[monthKey].orders += 1;
          if (order.status !== "cancelled") {
            monthlyStats[monthKey].revenue += order.total || 0;
          }
        }
      });
      // فقط الشهور حتى الشهر الحالي
      const result = Object.values(monthlyStats);
      // طباعة بيانات الطلبات الخام قبل التجميع
      if (typeof window !== 'undefined') {
        console.log('orders raw', data);
      }
      // طباعة بيانات الرسم البياني للتشخيص
      if (typeof window !== 'undefined') {
        console.log('monthlyData', result);
      }
      return result;
    },
    retry: 3,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: false, // تم تعطيل polling (refetchInterval) لأن المتصفح يوقفه بالخلفية،
    // والاعتماد على WebSocket أو إعادة الجلب عند العودة للواجهة أفضل
  });

  // Fetch recent activity data
  const {
    data: recentActivity = [],
    isLoading: activityLoading,
    refetch: refetchRecentActivity,
  } = useQuery({
    queryKey: ["admin-recent-activity"],
    queryFn: async () => {
      const activities = [];

      // Get recent users
      const { data: recentUsers } = await supabase
        .from("profiles")
        .select("created_at, full_name")
        .order("created_at", { ascending: false })
        .limit(2);

      // Get recent orders
      const { data: recentOrders } = await supabase
        .from("orders")
        .select("created_at, status")
        .order("created_at", { ascending: false })
        .limit(2);

      // Get products with low stock
      const { data: lowStockProducts } = await supabase
        .from("products")
        .select("name_ar, name_en, name_he, stock_quantity, updated_at")
        .lte("stock_quantity", 5)
        .order("updated_at", { ascending: false })
        .limit(2);

      // Add user registrations
      recentUsers?.forEach((user) => {
        activities.push({
          type: "user",
          message: t("newUserRegistered"),
          time: user.created_at,
          color: "green",
        });
      });

      // Add order activities
      recentOrders?.forEach((order) => {
        const message =
          order.status === "cancelled"
            ? t("orderCancelled")
            : t("newOrderReceived");
        const color = order.status === "cancelled" ? "red" : "blue";
        activities.push({
          type: "order",
          message,
          time: order.created_at,
          color,
        });
      });

      // Add low stock alerts
      lowStockProducts?.forEach((product) => {
        activities.push({
          type: "stock",
          message: t("productOutOfStock"),
          time: product.updated_at,
          color: "yellow",
        });
      });

      // Sort by time and return latest 4
      return activities
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 4);
    },
    retry: 3,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: false, // تم تعطيل polling (refetchInterval) لأن المتصفح يوقفه بالخلفية،
    // والاعتماد على WebSocket أو إعادة الجلب عند العودة للواجهة أفضل
  });

  // إعادة جلب النشاط الأخير عند تغيير اللغة
  useEffect(() => {
    refetchRecentActivity();
  }, [language, refetchRecentActivity]);

  const chartConfig = {
    users: { label: t("users"), color: "#3b82f6" },
    products: { label: t("products"), color: "#10b981" },
    orders: { label: t("orders"), color: "#f59e0b" },
    revenue: { label: t("revenue"), color: "#ef4444" },
    inStock: { label: t("inStock"), color: "#10b981" },
    outOfStock: { label: t("outOfStock"), color: "#ef4444" },
    admin: { label: t("admin"), color: "#ef4444" },
    wholesale: { label: t("wholesale"), color: "#3b82f6" },
    retail: { label: t("retail"), color: "#10b981" },
  };

  // حساب إجمالي المستخدمين والمنتجات من البيانات القادمة من الصفحة الرئيسية
  const totalUsers = Array.isArray(users) ? users.length : 0;
  const totalProducts = Array.isArray(products) ? products.length : 0;

  // Show loading state
  if (ordersLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t("adminPanel")}</h1>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto animate-spin rounded-full border-primary"></div>
          <p className="mt-4 text-gray-600">{t("loadingAdminDashboard")}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (ordersError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-red-600 font-medium mb-2">{t("error")}</p>
          <p className="text-muted-foreground text-sm">
            {ordersError?.message || t("unexpectedError")}
          </p>
        </div>
      </div>
    );
  }

  // توزيع المستخدمين حسب النوع
  const usersDistributionData = [
    {
      name: t("admin"),
      value: users.filter((u) => u.user_type === "admin").length,
      color: "#ef4444",
    },
    {
      name: t("wholesale"),
      value: users.filter((u) => u.user_type === "wholesale").length,
      color: "#3b82f6",
    },
    {
      name: t("retail"),
      value: users.filter((u) => u.user_type === "retail").length,
      color: "#10b981",
    },
  ];

  // المنتجات حسب الفئة (عرض الاسم الصحيح)
  const categoriesStats: {
    name: string;
    inStock: number;
    outOfStock: number;
  }[] = [];
  if (Array.isArray(products) && Array.isArray(categoriesList)) {
    const categoriesMap: Record<
      string,
      { name: string; inStock: number; outOfStock: number }
    > = {};
    categoriesList.forEach((cat) => {
      // اختر الاسم المناسب حسب اللغة
      let catName = cat.name;
      if (language === "en" && cat.nameEn) catName = cat.nameEn;
      else if (language === "he" && cat.nameHe) catName = cat.nameHe;
      categoriesMap[cat.id] = { name: catName, inStock: 0, outOfStock: 0 };
    });
    products.forEach((product) => {
      const catId = product.category;
      if (categoriesMap[catId]) {
        if (product.inStock) categoriesMap[catId].inStock += 1;
        else categoriesMap[catId].outOfStock += 1;
      } else {
        // منتجات بدون فئة معروفة
        const unknown = t("unknown");
        if (!categoriesMap[unknown])
          categoriesMap[unknown] = { name: unknown, inStock: 0, outOfStock: 0 };
        if (product.inStock) categoriesMap[unknown].inStock += 1;
        else categoriesMap[unknown].outOfStock += 1;
      }
    });
    for (const key in categoriesMap) categoriesStats.push(categoriesMap[key]);
  }

  // بيانات رسم توزيع الطلبات حسب الحالة
  const ordersStatusData = Array.isArray(ordersStats?.statusStats)
    ? ordersStats.statusStats.map((s) => ({
        name: s.label || s.status,
        value: s.value,
        color: s.color || "#8884d8",
      }))
    : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-2">
        {/* إجمالي الإيرادات */}
        <Card
          className="group relative overflow-hidden shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all cursor-pointer"
          onClick={() => setIsRevenueExpanded((v) => !v)}
        >
          <div className="absolute -top-6 -right-6 bg-blue-400/20 rounded-full w-24 h-24 z-0 group-hover:scale-110 transition-transform" />
          <CardContent className="relative z-10 flex flex-col items-center justify-center py-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-blue-500 text-white rounded-full p-4 shadow-lg flex items-center justify-center">
                <BarChart3 className="h-8 w-8" />
              </div>
              <div>
                <div className="text-4xl font-extrabold text-blue-900">
                  {ordersStats && typeof ordersStats.totalRevenue === "number"
                    ? ordersStats.totalRevenue.toLocaleString()
                    : 0}
                  <span className="text-lg font-bold text-blue-600 ml-1">
                    {t("currency")}
                  </span>
                </div>
                <div className="text-base font-semibold text-blue-700 mt-1">
                  {t("totalRevenue")}
                </div>
              </div>
            </div>
            {isRevenueExpanded &&
              Array.isArray(ordersStats?.statusStats) && (
                <div className="w-full mt-4">
                  <table className="w-full text-sm border rounded-lg bg-white">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="p-2 text-left">{t("status")}</th>
                        <th className="p-2 text-right">{t("revenue")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((statusKey) => {
                        const stat = ordersStats.statusStats.find(s => s.status === statusKey);
                        return (
                          <tr
                            key={statusKey}
                            className="hover:bg-blue-50 cursor-pointer"
                            onClick={() => navigate('/admin/orders', { state: { filterStatus: statusKey } })}
                          >
                            <td className="p-2">{t(statusKey)}</td>
                            <td
                              className="p-2 text-right font-bold"
                              style={{ color: stat?.color || undefined }}
                            >
                              {stat && typeof stat.revenue === "number"
                                ? stat.revenue.toLocaleString()
                                : 0} {t("currency")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
          </CardContent>
        </Card>

        {/* إجمالي المستخدمين */}
        <Card
          className="group relative overflow-hidden shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all cursor-pointer"
          onClick={() => setIsUsersExpanded((v) => !v)}
        >
          <div className="absolute -top-6 -right-6 bg-green-400/20 rounded-full w-24 h-24 z-0 group-hover:scale-110 transition-transform" />
          <CardContent className="relative z-10 flex flex-col items-center justify-center py-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-green-500 text-white rounded-full p-4 shadow-lg flex items-center justify-center">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <div className="text-4xl font-extrabold text-green-900">{totalUsers}</div>
                <div className="text-base font-semibold text-green-700 mt-1">{t("users")}</div>
              </div>
            </div>
            {isUsersExpanded && (
              <div className="w-full mt-4">
                <table className="w-full text-sm border rounded-lg bg-white">
                  <thead>
                    <tr className="bg-green-100">
                      <th className="p-2 text-left">{t("userType")}</th>
                      <th className="p-2 text-right">{t("count")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersDistributionData.map((type) => (
                      <tr key={type.name} className="hover:bg-green-50 cursor-pointer" onClick={() => navigate('/admin/users', { state: { filterType: type.name } })}>
                        <td className="p-2">{type.name}</td>
                        <td className="p-2 text-right font-bold" style={{ color: type.color }}>{type.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* إجمالي المنتجات */}
        <Card
          className="group relative overflow-hidden shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all cursor-pointer"
          onClick={() => setIsProductsExpanded((v) => !v)}
        >
          <div className="absolute -top-6 -right-6 bg-purple-400/20 rounded-full w-24 h-24 z-0 group-hover:scale-110 transition-transform" />
          <CardContent className="relative z-10 flex flex-col items-center justify-center py-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-purple-500 text-white rounded-full p-4 shadow-lg flex items-center justify-center">
                <Package className="h-8 w-8" />
              </div>
              <div>
                <div className="text-4xl font-extrabold text-purple-900">{totalProducts}</div>
                <div className="text-base font-semibold text-purple-700 mt-1">{t("products")}</div>
              </div>
            </div>
            {/* تفاصيل المنتجات حسب الفئة */}
            {isProductsExpanded && categoriesStats.length > 0 && (
              <div className="w-full mt-4">
                <table className="w-full text-sm border rounded-lg bg-white">
                  <thead>
                    <tr className="bg-purple-100">
                      <th className="p-2 text-left">{t("category")}</th>
                      <th className="p-2 text-right">{t("inStock")}</th>
                      <th className="p-2 text-right">{t("outOfStock")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoriesStats.map((cat) => (
                      <tr
                        key={cat.name}
                        className="hover:bg-purple-50 cursor-pointer"
                        onClick={() => {
                          // إذا كان اسم الفئة "الكل" أو "غير معروف" لا ترسل فلتر
                          if (cat.name === t("allCategories") || cat.name === t("unknown")) {
                            navigate('/admin/products');
                          } else {
                            navigate('/admin/products', { state: { filterCategory: cat.name } });
                          }
                        }}
                      >
                        <td className="p-2">{cat.name}</td>
                        <td className="p-2 text-right text-green-700 font-bold">{cat.inStock}</td>
                        <td className="p-2 text-right text-red-700 font-bold">{cat.outOfStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* الطلبات الجديدة */}
        <Card
          className="group relative overflow-hidden shadow-lg border-0 bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 transition-all cursor-pointer"
          onClick={() => setShowPendingOrdersDetails((v) => !v)}
        >
          <div className="absolute -top-6 -right-6 bg-yellow-400/20 rounded-full w-24 h-24 z-0 group-hover:scale-110 transition-transform" />
          <CardContent className="relative z-10 flex flex-col items-center justify-center py-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-yellow-400 text-white rounded-full p-4 shadow-lg flex items-center justify-center">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <div>
                <div className="text-4xl font-extrabold text-yellow-900">{pendingOrders.length}</div>
                <div className="text-base font-semibold text-yellow-700 mt-1">{t("newOrders")}</div>
              </div>
            </div>
            {showPendingOrdersDetails && pendingOrders.length > 0 && (
              <div className="w-full mt-4 max-h-64 overflow-y-auto">
                <table className="w-full text-sm border rounded-lg bg-white">
                  <thead>
                    <tr className="bg-yellow-100">
                      <th className="p-2 text-left">{t("customer")}</th>
                      <th className="p-2 text-right">{t("orderDate")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-yellow-50 cursor-pointer"
                        onClick={() => navigate(`/admin/orders`, { state: { filterOrderId: order.id } })}
                      >
                        <td className="p-2">{order.profiles?.full_name || t("unknownCustomer")}</td>
                        <td className="p-2 text-right font-mono">
                          {order.created_at ? new Date(order.created_at).toLocaleString() : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* المنتجات منخفضة المخزون */}
        <Card
          className="group relative overflow-hidden shadow-lg border-0 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 transition-all cursor-pointer"
          onClick={() => setShowLowStockDetails((v) => !v)}
        >
          <div className="absolute -top-6 -right-6 bg-red-400/20 rounded-full w-24 h-24 z-0 group-hover:scale-110 transition-transform" />
          <CardContent className="relative z-10 flex flex-col items-center justify-center py-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-red-500 text-white rounded-full p-4 shadow-lg flex items-center justify-center">
                <Package className="h-8 w-8" />
              </div>
              <div>
                <div className="text-4xl font-extrabold text-red-900">{lowStockProductsData.length}</div>
                <div className="text-base font-semibold text-red-700 mt-1">{t("lowStockProducts")}</div>
              </div>
            </div>
            {showLowStockDetails && lowStockProductsData.length > 0 && (
              <div className="w-full mt-4 max-h-64 overflow-y-auto">
                <table className="w-full text-sm border rounded-lg bg-white">
                  <thead>
                    <tr className="bg-red-100">
                      <th className="p-2 text-left">{t("productName")}</th>
                      <th className="p-2 text-right">{t("stockQuantity")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProductsData.map(product => {
                      let productName = product.name;
                      if (language === "ar" && product.name_ar)
                        productName = product.name_ar;
                      else if (language === "en" && product.name_en)
                        productName = product.name_en;
                      else if (language === "he" && product.name_he)
                        productName = product.name_he;
                      return (
                        <tr key={product.id} className="hover:bg-red-50 cursor-pointer" onClick={() => navigate(`/admin/products`, { state: { filterProductId: product.id } })}>
                          <td className="p-2">{productName}</td>
                          <td className="p-2 text-right">{product.stock_quantity}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* كرت إجمالي الطلبات */}
        <Card
          className="group relative overflow-hidden shadow-lg border-0 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 transition-all cursor-pointer"
          onClick={() => setIsTotalOrdersExpanded((v) => !v)}
        >
          <div className="absolute -top-6 -right-6 bg-orange-400/20 rounded-full w-24 h-24 z-0 group-hover:scale-110 transition-transform" />
          <CardContent className="relative z-10 flex flex-col items-center justify-center py-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-orange-500 text-white rounded-full p-4 shadow-lg flex items-center justify-center">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <div>
                <div className="text-4xl font-extrabold text-orange-900">
                  {ordersStats?.totalOrders ?? (ordersStats?.statusStats?.reduce((acc, s) => acc + (s.value || 0), 0) ?? 0)}
                </div>
                <div className="text-base font-semibold text-orange-700 mt-1">{t("totalOrders")}</div>
              </div>
            </div>
            {isTotalOrdersExpanded && (
              <div className="w-full mt-4">
                <table className="w-full text-sm border rounded-lg bg-white">
                  <tbody>
                    {(() => {
                      // استخدم statusStats إذا لم تتوفر القيم مباشرة
                      const stats = ordersStats?.statusStats || [];
                      const getCount = (status) => {
                        const found = stats.find(s => s.status === status);
                        return found ? found.value : 0;
                      };
                      return [
                        { key: 'pending', label: t('pending'), color: 'text-yellow-700', status: 'pending' },
                        { key: 'processing', label: t('processing'), color: 'text-blue-700', status: 'processing' },
                        { key: 'shipped', label: t('shipped'), color: 'text-purple-700', status: 'shipped' },
                        { key: 'delivered', label: t('delivered'), color: 'text-green-700', status: 'delivered' },
                        { key: 'cancelled', label: t('cancelled'), color: 'text-red-700', status: 'cancelled' },
                      ].map(row => (
                        <tr
                          key={row.key}
                          className={`hover:bg-orange-50 cursor-pointer`}
                          onClick={e => {
                            e.stopPropagation();
                            navigate(`/admin/orders`, { state: { filterStatus: row.status } });
                          }}
                        >
                          <td className="p-2 font-medium">{row.label}</td>
                          <td className={`p-2 text-right font-bold ${row.color}`}>{ordersStats?.[row.key] ?? getCount(row.status)}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Users Distribution Chart */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {t("usersDistribution")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <PieChart>
                <Pie
                  data={usersDistributionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                >
                  {usersDistributionData.map((entry, idx) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Products by Category Chart */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {t("productsByCategory")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <BarChart
                data={categoriesStats}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Bar dataKey="inStock" fill="#10b981" name={t("inStock")} />
                <Bar
                  dataKey="outOfStock"
                  fill="#ef4444"
                  name={t("outOfStock")}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Orders by Status Chart */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {t("ordersByStatus")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <PieChart>
                <Pie
                  data={ordersStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                >
                  {ordersStatusData.map((entry, idx) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Orders Trend Chart */}
        <Card className="xl:col-span-2 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {t("ordersAndRevenueTrend")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {monthlyLoading ? (
              <div className="flex justify-center items-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-80 w-full">
                <LineChart
                  data={monthlyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="orders"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    name={t("orders")}
                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#ef4444"
                    strokeWidth={3}
                    name={t("revenue")}
                    dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {t("recentActivity")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-4">
            {activityLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => {
                const getTimeAgo = (time: string) => {
                  const now = new Date();
                  const activityTime = new Date(time);
                  const diffInMinutes = Math.floor(
                    (now.getTime() - activityTime.getTime()) / (1000 * 60),
                  );

                  if (diffInMinutes < 1) return t("now");
                  if (diffInMinutes < 60) {
                    // ترجمة دقيقة
                    const minutes = diffInMinutes.toString();
                    return t("minutesAgo").replace("{count}", minutes);
                  }
                  if (diffInMinutes < 1440) {
                    // ترجمة ساعة
                    const hours = Math.floor(diffInMinutes / 60).toString();
                    return t("hoursAgo").replace("{count}", hours);
                  }
                  // ترجمة يوم
                  const days = Math.floor(diffInMinutes / 1440).toString();
                  return t("daysAgo").replace("{count}", days);
                };

                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: activity.color,
                        color: "white",
                      }}
                    >
                      {activity.type === "user" && (
                        <Users className="w-5 h-5" />
                      )}
                      {activity.type === "order" && (
                        <ShoppingCart className="w-5 h-5" />
                      )}
                      {activity.type === "stock" && (
                        <Package className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getTimeAgo(activity.time)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-500 py-12">
                {t("noRecentActivity")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardStats;
