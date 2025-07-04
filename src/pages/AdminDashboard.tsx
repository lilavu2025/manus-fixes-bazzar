import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { useLanguage } from "@/utils/languageContextUtils";
import { useMemoryCleanup } from "@/hooks/useMemoryCleanup";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderOpen,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Image,
  Mail,
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminCategories from "@/components/admin/AdminCategories";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminDashboardStats from "@/components/admin/AdminDashboardStats";
import AdminOffers from "@/components/admin/AdminOffers";
import AdminBanners from "@/components/admin/AdminBanners";
import AdminContactInfo from "@/components/admin/AdminContactInfo";
import AdminTopOrderedProducts from "@/components/admin/AdminTopOrderedProducts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUsers } from "@/hooks/useSupabaseData";
import { useProductsRealtime } from "@/hooks/useProductsRealtime";
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";
import { mapProductFromDb } from "@/types/mapProductFromDb";
import type { Product } from "@/types/index";
import type { ProductRow } from "@/integrations/supabase/dataFetchers";
import AdminReports from "@/pages/AdminReports";
import config from "@/configs/activeConfig";

// تعريف أنواع الطلب والمنتج بشكل مبسط
interface PendingOrder {
  id: string;
  created_at: string;
  profiles?: {
    full_name: string;
    email?: string;
    phone?: string;
  };
}
interface LowStockProduct {
  id: string;
  name: string;
  stock_quantity: number;
}

const AdminDashboard: React.FC = () => {
  const { profile, signOut, loading, user } = useAuth();
  const { t, isRTL } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // استخدام hook تنظيف الذاكرة
  const memoryCleanup = useMemoryCleanup();

  const sidebarItems = [
    { path: "/admin", label: t("dashboard"), icon: LayoutDashboard },
    { path: "/admin/products", label: t("manageProducts"), icon: Package },
    {
      path: "/admin/categories",
      label: t("manageCategories"),
      icon: FolderOpen,
    },
    { path: "/admin/orders", label: t("manageOrders"), icon: ShoppingCart },
    { path: "/admin/users", label: t("manageUsers"), icon: Users },
    { path: "/admin/offers", label: t("manageOffers"), icon: Package },
    { path: "/admin/banners", label: t("manageBanners"), icon: Image },
    {
      path: "/admin/contact-info",
      label: t("manageContactInfo") || "معلومات الاتصال",
      icon: Mail,
    },
    // رابط التقارير الإدارية
    {
      path: "/admin/reports",
      label: t("reports"),
      icon: FolderOpen,
    },
  ];

  const isActive = (path: string) => {
    if (path === "/admin" && location.pathname === "/admin") return true;
    if (path !== "/admin" && location.pathname.startsWith(path)) return true;
    return false;
  };

  // لا تقم بعمل redirect إذا كان profile غير موجود (أي أثناء التحميل)، أو إذا كان المستخدم أدمن فعليًا
  // الحل: انتظر حتى ينتهي التحميل، ثم إذا كان البروفايل موجود وليس أدمن فقط أعد التوجيه
  useEffect(() => {
    // إذا لم يوجد مستخدم (أي لا يوجد session)، أعد التوجيه للهوم
    if (!user && !loading) {
      navigate("/", { replace: true });
      return;
    }
    // إذا كان هناك مستخدم لكن البروفايل لم يصل بعد، انتظر
    if (loading || !profile) return;
    // إذا انتهى التحميل والبروفايل موجود لكن ليس أدمن
    if (profile.user_type !== "admin") {
      navigate("/", { replace: true });
    }
    // إذا كان أدمن، لا تفعل شيء
  }, [profile, loading, user, navigate]);

  // جلب بيانات المستخدمين والمنتجات والطلبات
  const usersQuery = useUsers();
  const users = usersQuery.data || [];
  const usersLoading = usersQuery.isLoading;

  const { products = [], loading: productsLoading } = useProductsRealtime();
  const { orders = [], loading: ordersLoading } = useOrdersRealtime();

  // الطلبات قيد الانتظار
  const pendingOrders = orders.filter((order) => order.status === "pending");
  // المنتجات منخفضة المخزون
  const lowStockProductsData = products
    .filter((product) => product.stock_quantity && product.stock_quantity <= 5)
    .map((product) => ({
      id: product.id,
      name: product.name_ar || product.name_en || product.name_he || "",
      name_ar: product.name_ar || "",
      name_en: product.name_en || "",
      name_he: product.name_he || "",
      stock_quantity: product.stock_quantity || 0,
    }));

  const productsMapped: Product[] = Array.isArray(products)
    ? products.map((p) => {
        if ("name" in p) {
          return p as Product;
        } else {
          return mapProductFromDb(p as ProductRow);
        }
      })
    : [];
  const totalProducts = Array.isArray(productsMapped)
    ? productsMapped.length
    : 0;

  return (
    <div
      className={`min-h-screen bg-gray-50 ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            // للجوال فقط: إذا لم يكن مفتوحًا، أخفِ السايدبار بالكامل
            ${sidebarOpen ? "translate-x-0 w-72" : isRTL ? "translate-x-full w-0 p-0 border-none overflow-hidden pointer-events-none" : "-translate-x-full w-0 p-0 border-none overflow-hidden pointer-events-none"}
            // على الديسكتوب: السايدبار دائمًا ظاهر وتفاعلي، فقط العرض يتغير
            lg:translate-x-0 lg:w-auto lg:overflow-visible lg:pointer-events-auto
            ${sidebarCollapsed ? "lg:w-20" : "lg:w-72"}
            transition-all duration-300 ease-in-out
            bg-white shadow-2xl border-r border-gray-200
            flex flex-col min-h-screen
            fixed lg:relative z-50
          `}
        >
          {/* Toggle Button - Desktop */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`hidden lg:flex absolute -${isRTL ? "left" : "right"}-3 top-6 z-10 bg-white shadow-lg border rounded-full h-8 w-8 p-0 hover:bg-gray-50`}
          >
            {isRTL ? (
              sidebarCollapsed ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>

          {/* Close Button - Mobile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className={`lg:hidden absolute ${isRTL ? "left" : "right"}-4 top-4 z-10 bg-white shadow-lg border rounded-full h-8 w-8 p-0`}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="p-4 lg:p-6 flex-1">
            {/* Brand Section */}
            <div
              className={`flex items-center gap-4 mb-6 lg:mb-8 transition-all duration-300 ${sidebarCollapsed ? "lg:justify-center" : ""}`}
            >
              <div>
                <img
                  src={config.visual.logo}
                  alt={t('storeName')}
                  className="w-20 h-20 sm:w-20 sm:h-20 rounded-lg object-contain bg-white shadow"
                />
              </div>
              {(!sidebarCollapsed || sidebarOpen) && (
                <div className="animate-fade-in min-w-0">
                  <h2 className="font-bold text-base lg:text-lg text-gray-800 truncate">
                    {t("storeName")}
                  </h2>
                  <p className="text-xs lg:text-sm text-gray-500 truncate">
                    {t("adminPanel")}
                  </p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="space-y-2 lg:space-y-3">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-2 lg:py-3 rounded-xl transition-all duration-200 hover:shadow-md ${
                      active
                        ? "bg-gradient-to-r from-[hsl(var(--secondary))] to-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-lg transform scale-105"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                    } ${sidebarCollapsed ? "lg:justify-center lg:px-2" : ""}`}
                  >
                    <Icon
                      className={`h-5 w-5 transition-transform group-hover:scale-110 flex-shrink-0 ${active ? "text-white" : ""}`}
                    />
                    {(!sidebarCollapsed || sidebarOpen) && (
                      <span className="font-medium animate-fade-in text-sm lg:text-base truncate">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Section */}
          <div className="p-4 lg:p-6 border-t border-gray-200 bg-gray-50">
            {!sidebarCollapsed || sidebarOpen ? (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-xs lg:text-sm">
                        {profile?.full_name?.charAt(0) || "A"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 text-sm lg:text-base truncate">
                        {profile?.full_name}
                      </p>
                      <p className="text-xs lg:text-sm text-gray-500">
                        {t("admin")}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <LanguageSwitcher />
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full hover:bg-gray-100 transition-colors text-xs lg:text-sm h-8 lg:h-10"
                  >
                    <Link to="/">{t("backToStore")}</Link>
                  </Button>
                  <Button
                    onClick={signOut}
                    variant="ghost"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors text-xs lg:text-sm h-8 lg:h-10"
                  >
                    {t("logout")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">
                    {profile?.full_name?.charAt(0) || "A"}
                  </span>
                </div>
                <div className="flex justify-center">
                  <LanguageSwitcher />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Sticky Header */}
          <div
            className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-40 transition-all duration-300"
            style={{
              height: "56px",
              transition: "height 0.3s, padding 0.3s",
            }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="h-10 w-10"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="font-bold text-lg text-gray-800">
              {t("adminPanel")}
            </h1>
            <div className="w-10" /> {/* Spacer */}
          </div>

          {/* Content */}
          <div className="p-4 lg:p-8 overflow-hidden">
            <div className="max-w-7xl mx-auto">
              {location.pathname === "/admin" && (
                <>
                  <AdminDashboardStats
                    pendingOrders={pendingOrders
                      .filter((order) => typeof order.order_number === "number")
                      .map((order) => ({
                        id: order.id,
                        order_number: order.order_number as number,
                        created_at: order.created_at,
                        profiles: order.profiles,
                      }))}
                    lowStockProductsData={lowStockProductsData}
                    users={users}
                    products={productsMapped}
                  />
                </>
              )}
              <Routes>
                <Route path="/" element={null} />
                <Route path="/products" element={<AdminProducts />} />
                <Route path="/categories" element={<AdminCategories />} />
                <Route path="/orders" element={<AdminOrders />} />
                <Route path="/users" element={<AdminUsers />} />
                <Route path="/offers" element={<AdminOffers />} />
                <Route path="/banners" element={<AdminBanners />} />
                <Route path="/contact-info" element={<AdminContactInfo />} />
                <Route path="/reports" element={<AdminReports />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
