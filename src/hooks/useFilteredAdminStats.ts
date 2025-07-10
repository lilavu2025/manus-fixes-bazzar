import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FilteredStatsData {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  newUsers: number;
  activeProducts: number;
  inactiveProducts: number;
  statusStats: {
    status: string;
    label: string;
    value: number;
    revenue: number;
    color: string;
  }[];
}

export const useFilteredAdminStats = (dateFrom: string, dateTo: string) => {
  return useQuery({
    queryKey: ["admin-filtered-stats", dateFrom, dateTo],
    queryFn: async (): Promise<FilteredStatsData> => {
      const results = await Promise.all([
        // جلب إحصائيات الطلبات
        getOrdersStats(dateFrom, dateTo),
        // جلب إحصائيات المستخدمين
        getUsersStats(dateFrom, dateTo),
        // جلب إحصائيات المنتجات
        getProductsStats(dateFrom, dateTo),
      ]);

      const [ordersStats, usersStats, productsStats] = results;

      return {
        ...ordersStats,
        ...usersStats,
        ...productsStats,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 دقائق
    refetchOnWindowFocus: false,
  });
};

// جلب إحصائيات الطلبات
async function getOrdersStats(dateFrom: string, dateTo: string) {
  let query = supabase
    .from("orders")
    .select("status, total, discount_type, discount_value, total_after_discount, created_at");

  // تطبيق فلتر التاريخ
  if (dateFrom) {
    query = query.gte("created_at", dateFrom + "T00:00:00.000Z");
  }
  if (dateTo) {
    query = query.lte("created_at", dateTo + "T23:59:59.999Z");
  }

  const { data: orders, error } = await query;

  if (error) throw error;

  const stats = {
    totalOrders: orders?.length || 0,
    totalRevenue: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    statusStats: [] as {
      status: string;
      label: string;
      value: number;
      revenue: number;
      color: string;
    }[],
  };

  const revenueByStatus = {
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  orders?.forEach((order) => {
    // حساب الإيرادات
    const total = order.total_after_discount || order.total || 0;
    
    // حساب الطلبات حسب الحالة
    switch (order.status) {
      case "pending":
        stats.pendingOrders++;
        stats.totalRevenue += total;
        revenueByStatus.pending += total;
        break;
      case "processing":
        stats.processingOrders++;
        stats.totalRevenue += total;
        revenueByStatus.processing += total;
        break;
      case "shipped":
        stats.shippedOrders++;
        stats.totalRevenue += total;
        revenueByStatus.shipped += total;
        break;
      case "delivered":
        stats.deliveredOrders++;
        stats.totalRevenue += total;
        revenueByStatus.delivered += total;
        break;
      case "cancelled":
        stats.cancelledOrders++;
        // لا نضيف الإيرادات للطلبات الملغية
        revenueByStatus.cancelled += total;
        break;
    }
  });

  // إنشاء statusStats
  stats.statusStats = [
    { status: "pending", label: "قيد الانتظار", value: stats.pendingOrders, revenue: revenueByStatus.pending, color: "#f59e0b" },
    { status: "processing", label: "قيد المعالجة", value: stats.processingOrders, revenue: revenueByStatus.processing, color: "#3b82f6" },
    { status: "shipped", label: "تم الشحن", value: stats.shippedOrders, revenue: revenueByStatus.shipped, color: "#8b5cf6" },
    { status: "delivered", label: "تم التوصيل", value: stats.deliveredOrders, revenue: revenueByStatus.delivered, color: "#10b981" },
    { status: "cancelled", label: "ملغى", value: stats.cancelledOrders, revenue: revenueByStatus.cancelled, color: "#ef4444" },
  ];

  return stats;
}

// جلب إحصائيات المستخدمين
async function getUsersStats(dateFrom: string, dateTo: string) {
  let query = supabase
    .from("profiles")
    .select("user_type, created_at");

  // تطبيق فلتر التاريخ
  if (dateFrom) {
    query = query.gte("created_at", dateFrom + "T00:00:00.000Z");
  }
  if (dateTo) {
    query = query.lte("created_at", dateTo + "T23:59:59.999Z");
  }

  const { data: users, error } = await query;

  if (error) throw error;

  return {
    totalUsers: users?.length || 0,
    newUsers: users?.length || 0, // في حالة وجود فلتر تاريخ، كل المستخدمين يعتبرون جدد
  };
}

// جلب إحصائيات المنتجات
async function getProductsStats(dateFrom: string, dateTo: string) {
  let query = supabase
    .from("products")
    .select("active, created_at");

  // تطبيق فلتر التاريخ
  if (dateFrom) {
    query = query.gte("created_at", dateFrom + "T00:00:00.000Z");
  }
  if (dateTo) {
    query = query.lte("created_at", dateTo + "T23:59:59.999Z");
  }

  const { data: products, error } = await query;

  if (error) throw error;

  const stats = {
    totalProducts: products?.length || 0,
    activeProducts: 0,
    inactiveProducts: 0,
  };

  products?.forEach((product) => {
    if (product.active) {
      stats.activeProducts++;
    } else {
      stats.inactiveProducts++;
    }
  });

  return stats;
}
