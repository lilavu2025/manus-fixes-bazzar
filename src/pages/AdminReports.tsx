import AdminTopOrderedReport from "@/components/admin/AdminTopOrderedReport";
import { useLanguage } from "@/utils/languageContextUtils";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAdminOrdersStats } from "@/integrations/supabase/reactQueryHooks";
import { useUsers } from "@/hooks/useSupabaseData";
import { useProductsRealtime } from "@/hooks/useProductsRealtime";
import { fetchTopOrderedProducts } from "@/integrations/supabase/dataSenders";
import { Users, ShoppingCart, Package, BarChart3, CheckCircle, XCircle, AlertTriangle, UserPlus, UserCog, Truck, CreditCard, Star } from "lucide-react";

const ReportCard = ({ icon, color, title, value, label, loading, emptyMsg }) => (
  <Card className="flex flex-col items-center justify-center p-4 shadow-md border-0 bg-white hover:shadow-lg transition-all min-h-[140px]">
    <div className={`rounded-full p-2 mb-2 bg-opacity-10 ${color}`}>
      {icon}
    </div>
    <div className={`text-2xl font-extrabold mb-1 ${color}`}>{loading ? "..." : value}</div>
    <div className="text-sm text-gray-700 font-medium mb-1">{label}</div>
    {(!loading && value === 0 && emptyMsg) && <div className="text-xs text-gray-400 mt-1">{emptyMsg}</div>}
    <div className="text-xs text-gray-400">{title}</div>
  </Card>
);

const AdminReports = () => {
  const { t } = useLanguage();
  // استخدم نفس الهُوكس كما في صفحة الأدمن الرئيسية
  const { data: ordersStats, isLoading: ordersLoading } = useAdminOrdersStats(t);
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { products = [], loading: productsLoading } = useProductsRealtime();

  // حساب القيم المطلوبة من البيانات
  const totalRevenue = ordersStats?.totalRevenue || 0;
  const completedOrders = ordersStats?.statusStats?.find(s => s.status === "delivered")?.value || 0;
  const pendingOrders = ordersStats?.statusStats?.find(s => s.status === "pending")?.value || 0;
  const processingOrders = ordersStats?.statusStats?.find(s => s.status === "processing")?.value || 0;
  const shippingOrders = ordersStats?.statusStats?.find(s => s.status === "shipping" || s.status === "shipped")?.value || 0;
  const paidOrders = ordersStats?.statusStats?.find(s => s.status === "paid")?.value || 0;
  const cancelledOrders = ordersStats?.statusStats?.find(s => s.status === "cancelled")?.value || 0;

  const admins = users.filter(u => u.user_type === "admin").length;
  const customers = users.filter(u => ["wholesale", "retail"].includes(u.user_type)).length;
  const newUsers = users.filter(u => new Date(u.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
  const wholesaleUsers = users.filter(u => u.user_type === "wholesale").length;
  const retailUsers = users.filter(u => u.user_type === "retail").length;

  const activeProducts = products.filter(p => p.active).length;
  const inactiveProducts = products.filter(p => !p.active).length;
  const lowStock = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length;
  const outOfStock = products.filter(p => p.stock_quantity === 0).length;

  const [topSelling, setTopSelling] = useState({ count: 0, totalSales: 0, loading: true });
  useEffect(() => {
    let mounted = true;
    fetchTopOrderedProducts().then((data) => {
      if (!mounted) return;
      const arr = Array.isArray(data) ? data : [];
      console.log("[TopOrderedProducts] arr:", arr); // تشخيص مباشر
      // بعض قواعد البيانات قد لا تعيد sales_count إذا لم يكن موجودًا في السكيما، لذلك نستخدم 0 كقيمة افتراضية
      const totalSales = arr.reduce((acc, p) => acc + (typeof p["sales_count"] === "number" ? p["sales_count"] : 0), 0);
      setTopSelling({ count: arr.length, totalSales, loading: false });
    });
    return () => { mounted = false; };
  }, []);

  const loading = ordersLoading || usersLoading || productsLoading;

  const reports = [
    {
      icon: <BarChart3 className="w-6 h-6 text-green-700" />, color: "text-green-700", title: t("revenueReport"), value: totalRevenue, label: t("currency"), loading, emptyMsg: t("noRevenue")
    },
    {
      icon: <Users className="w-6 h-6 text-blue-700" />, color: "text-blue-700", title: t("customersReport"), value: customers, label: t("customerCount"), loading, emptyMsg: t("noCustomers")
    },
    {
      icon: <Users className="w-6 h-6 text-blue-700" />, color: "text-blue-700", title: t("wholesaleUsersReport"), value: wholesaleUsers, label: t("customerCount"), loading, emptyMsg: t("noCustomers")
    },
    {
      icon: <Users className="w-6 h-6 text-blue-700" />, color: "text-blue-700", title: t("retailUsersReport"), value: retailUsers, label: t("customerCount"), loading, emptyMsg: t("noCustomers")
    },
    {
      icon: <UserCog className="w-6 h-6 text-indigo-700" />, color: "text-indigo-700", title: t("adminUsersReport"), value: admins, label: t("userCount"), loading, emptyMsg: t("noAdmins")
    },
    {
      icon: <UserPlus className="w-6 h-6 text-purple-700" />, color: "text-purple-700", title: t("newUsersReport"), value: newUsers, label: t("userCount"), loading, emptyMsg: t("noNewUsers")
    },
    {
      icon: <ShoppingCart className="w-6 h-6 text-green-700" />, color: "text-green-700", title: t("completedOrdersReport"), value: completedOrders, label: t("orderCount"), loading, emptyMsg: t("noCompletedOrders")
    },
    {
      icon: <AlertTriangle className="w-6 h-6 text-orange-700" />, color: "text-orange-700", title: t("pendingOrdersReport"), value: pendingOrders, label: t("orderCount"), loading, emptyMsg: t("noPendingOrders")
    },
    {
      icon: <AlertTriangle className="w-6 h-6 text-orange-700" />, color: "text-orange-700", title: t("processingOrdersReport"), value: processingOrders, label: t("orderCount"), loading, emptyMsg: t("noProcessingOrders")
    },
    {
      icon: <Truck className="w-6 h-6 text-blue-900" />, color: "text-blue-900", title: t("shippingOrdersReport"), value: shippingOrders, label: t("orderCount"), loading, emptyMsg: t("noShippingOrders")
    },
    // {
    //   icon: <CreditCard className="w-6 h-6 text-green-900" />, color: "text-green-900", title: t("paidOrdersReport"), value: paidOrders, label: t("orderCount"), loading, emptyMsg: t("noPaidOrders")
    // },
    {
      icon: <XCircle className="w-6 h-6 text-red-700" />, color: "text-red-700", title: t("cancelledOrdersReport"), value: cancelledOrders, label: t("orderCount"), loading, emptyMsg: t("noCancelledOrders")
    },
    {
      icon: <Package className="w-6 h-6 text-yellow-700" />, color: "text-yellow-700", title: t("lowStockProductsReport"), value: lowStock, label: t("productCount"), loading, emptyMsg: t("noLowStock")
    },
    {
      icon: <Package className="w-6 h-6 text-gray-700" />, color: "text-gray-700", title: t("outOfStockProductsReport"), value: outOfStock, label: t("productCount"), loading, emptyMsg: t("noOutOfStock")
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-green-700" />, color: "text-green-700", title: t("activeProductsReport"), value: activeProducts, label: t("productCount"), loading, emptyMsg: t("noActiveProducts")
    },
    {
      icon: <XCircle className="w-6 h-6 text-gray-500" />, color: "text-gray-500", title: t("inactiveProductsReport"), value: inactiveProducts, label: t("productCount"), loading, emptyMsg: t("noInactiveProducts")
    },
    {
      icon: <Star className="w-6 h-6 text-orange-500" />, color: "text-orange-500", title: t("topSellingReport"), value: topSelling.totalSales, label: t("salesCount"), loading: topSelling.loading, emptyMsg: t("noTopSellingProducts")
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">{t("reports")}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
        {reports.map((r, i) => (
          <ReportCard key={i} {...r} />
        ))}
      </div>
      <div className="max-w-4xl mx-auto">
        <AdminTopOrderedReport />
      </div>
    </div>
  );
};

export default AdminReports;
