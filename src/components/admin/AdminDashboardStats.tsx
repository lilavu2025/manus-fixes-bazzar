import React, { useState, useEffect } from 'react';
import { useAdminOrdersStats } from '@/integrations/supabase/reactQueryHooks';
import { useLanguage } from '../../utils/languageContextUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Package, ShoppingCart, Users, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UserProfile } from '@/types/profile';
import type { Product } from '@/types/index';
import { useCategoriesRealtime } from '@/hooks/useCategoriesRealtime';

// Helper types
interface UsersByType { [key: string]: number; }
interface ProductsByCategoryStats { total: number; inStock: number; outOfStock: number; }
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
  pendingOrders?: { id: string; created_at: string; profiles?: { full_name: string; email?: string; phone?: string } }[];
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
  const [showPendingOrdersDetails, setShowPendingOrdersDetails] = useState(false);
  const [showLowStockDetails, setShowLowStockDetails] = useState(false);

  // إحصائيات الطلبات
  const { data: ordersStats, isLoading: ordersLoading, error: ordersError } = useAdminOrdersStats(t);

  const handleUserTypeClick = (userType: string) => {
    if (onFilterUsers) {
      onFilterUsers(userType);
    }
    navigate('/admin/users', { state: { filterType: userType } });
  };

  const handleOrderStatusClick = (status: string) => {
    if (onFilterOrders) {
      onFilterOrders(status);
    }
    navigate('/admin/orders', { state: { filterStatus: status } });
  };

  // Fetch monthly orders and revenue data
  const { data: monthlyData = [], isLoading: monthlyLoading } = useQuery({
    queryKey: ["admin-monthly-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('created_at, total, status')
        .gte('created_at', new Date(new Date().getFullYear(), 0, 1).toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      const monthlyStats: Record<number, { month: string; orders: number; revenue: number }> = data.reduce((acc: Record<number, { month: string; orders: number; revenue: number }>, order: { created_at: string; status: string; total: number }) => {
        const date = new Date(order.created_at);
        const monthKey = date.getMonth();
        const monthNames = [
          t('january'), t('february'), t('march'), t('april'), t('may'), t('june'),
          t('july'), t('august'), t('september'), t('october'), t('november'), t('december')
        ];
        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthNames[monthKey],
            orders: 0,
            revenue: 0
          };
        }
        acc[monthKey].orders += 1;
        if (order.status !== 'cancelled') {
          acc[monthKey].revenue += order.total || 0;
        }
        return acc;
      }, {});

      return Object.values(monthlyStats);
    },
    retry: 3,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: false, // تم تعطيل polling (refetchInterval) لأن المتصفح يوقفه بالخلفية،
    // والاعتماد على WebSocket أو إعادة الجلب عند العودة للواجهة أفضل
  });

  // Fetch recent activity data
  const { data: recentActivity = [], isLoading: activityLoading, refetch: refetchRecentActivity } = useQuery({
    queryKey: ["admin-recent-activity"],
    queryFn: async () => {
      const activities = [];
      
      // Get recent users
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('created_at, full_name')
        .order('created_at', { ascending: false })
        .limit(2);
      
      // Get recent orders
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('created_at, status')
        .order('created_at', { ascending: false })
        .limit(2);
      
      // Get products with low stock
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('name_ar, name_en, name_he, stock_quantity, updated_at')
        .lte('stock_quantity', 5)
        .order('updated_at', { ascending: false })
        .limit(2);
      
      // Add user registrations
      recentUsers?.forEach(user => {
        activities.push({
          type: 'user',
          message: t('newUserRegistered'),
          time: user.created_at,
          color: 'green'
        });
      });
      
      // Add order activities
      recentOrders?.forEach(order => {
        const message = order.status === 'cancelled' ? t('orderCancelled') : t('newOrderReceived');
        const color = order.status === 'cancelled' ? 'red' : 'blue';
        activities.push({
          type: 'order',
          message,
          time: order.created_at,
          color
        });
      });
      
      // Add low stock alerts
      lowStockProducts?.forEach(product => {
        activities.push({
          type: 'stock',
          message: t('productOutOfStock'),
          time: product.updated_at,
          color: 'yellow'
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
    users: { label: t('users'), color: '#3b82f6' },
    products: { label: t('products'), color: '#10b981' },
    orders: { label: t('orders'), color: '#f59e0b' },
    revenue: { label: t('revenue'), color: '#ef4444' },
    inStock: { label: t('inStock'), color: '#10b981' },
    outOfStock: { label: t('outOfStock'), color: '#ef4444' },
    admin: { label: t('admin'), color: '#ef4444' },
    wholesale: { label: t('wholesale'), color: '#3b82f6' },
    retail: { label: t('retail'), color: '#10b981' },
  };

  // حساب إجمالي المستخدمين والمنتجات من البيانات القادمة من الصفحة الرئيسية
  const totalUsers = Array.isArray(users) ? users.length : 0;
  const totalProducts = Array.isArray(products) ? products.length : 0;

  // Show loading state
  if (ordersLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t('adminPanel')}</h1>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto animate-spin rounded-full border-primary"></div>
          <p className="mt-4 text-gray-600">{t('loadingAdminDashboard')}</p>
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
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium mb-2">{t('error')}</p>
          <p className="text-muted-foreground text-sm">
             {ordersError?.message || t('unexpectedError')}
           </p>
        </div>
      </div>
    );
  }

  // توزيع المستخدمين حسب النوع
  const usersDistributionData = [
    { name: t('admin'), value: users.filter(u => u.user_type === 'admin').length, color: '#ef4444' },
    { name: t('wholesale'), value: users.filter(u => u.user_type === 'wholesale').length, color: '#3b82f6' },
    { name: t('retail'), value: users.filter(u => u.user_type === 'retail').length, color: '#10b981' },
  ];

  // المنتجات حسب الفئة (عرض الاسم الصحيح)
  const categoriesStats: { name: string; inStock: number; outOfStock: number }[] = [];
  if (Array.isArray(products) && Array.isArray(categoriesList)) {
    const categoriesMap: Record<string, { name: string; inStock: number; outOfStock: number }> = {};
    categoriesList.forEach(cat => {
      // اختر الاسم المناسب حسب اللغة
      let catName = cat.name;
      if (language === 'en' && cat.nameEn) catName = cat.nameEn;
      else if (language === 'he' && cat.nameHe) catName = cat.nameHe;
      categoriesMap[cat.id] = { name: catName, inStock: 0, outOfStock: 0 };
    });
    products.forEach(product => {
      const catId = product.category;
      if (categoriesMap[catId]) {
        if (product.inStock) categoriesMap[catId].inStock += 1;
        else categoriesMap[catId].outOfStock += 1;
      } else {
        // منتجات بدون فئة معروفة
        const unknown = t('unknown');
        if (!categoriesMap[unknown]) categoriesMap[unknown] = { name: unknown, inStock: 0, outOfStock: 0 };
        if (product.inStock) categoriesMap[unknown].inStock += 1;
        else categoriesMap[unknown].outOfStock += 1;
      }
    });
    for (const key in categoriesMap) categoriesStats.push(categoriesMap[key]);
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setIsUsersExpanded(!isUsersExpanded)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {!isUsersExpanded ? (
              <>
                <div className="text-2xl font-bold">
                  {totalUsers}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('registeredUsers')}
                </p>
              </>
            ) : (
              <div className="grid grid-cols-3 gap-4 py-2">
                {[{
                  type: 'admin',
                  color: 'bg-red-500',
                  icon: <Users className='w-5 h-5 text-red-500' />
                },
                {
                  type: 'wholesale',
                  color: 'bg-blue-500',
                  icon: <Users className='w-5 h-5 text-blue-500' />
                },
                {
                  type: 'retail',
                  color: 'bg-green-500',
                  icon: <Users className='w-5 h-5 text-green-500' />
                }].map(({ type, color, icon }) => {
                  const count = users.filter(u => u.user_type === type).length;
                  return (
                    <button
                      key={type}
                      className={`flex flex-col items-center justify-center rounded-lg p-3 shadow-sm border border-gray-200 bg-white hover:shadow-md transition group focus:outline-none focus:ring-2 focus:ring-primary/50`}
                      style={{ minHeight: 80 }}
                      onClick={() => handleUserTypeClick(type)}
                      type="button"
                    >
                      <span className={`rounded-full ${color} bg-opacity-10 p-2 mb-1`}>{icon}</span>
                      <span className="text-lg font-bold text-gray-800 group-hover:text-primary">{count}</span>
                      <span className="text-xs text-muted-foreground mt-1">{t(type)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalProducts')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalProducts}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('activeProducts')}
            </p>
          </CardContent>
        </Card>
        
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setIsOrdersExpanded(!isOrdersExpanded)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalOrders')}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {!isOrdersExpanded ? (
              <>
                <div className="text-2xl font-bold">
                  {ordersStats && typeof ordersStats.totalOrders === 'number' ? ordersStats.totalOrders : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('totalOrders')}
                </p>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {Array.isArray(ordersStats?.statusStats) && ordersStats.statusStats.length > 0
                  ? ordersStats.statusStats.map((stat) => (
                      <div 
                        key={stat.status} 
                        className="rounded-lg border bg-card p-2 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleOrderStatusClick(stat.status)}
                      >
                        <div className="text-[0.9rem] font-medium">{stat.label}</div>
                        <div className="text-xl font-bold mt-1" style={{ color: stat.color }}>
                          {typeof stat.value === 'number' ? stat.value : 0}
                        </div>
                      </div>
                    ))
                  : null}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setIsRevenueExpanded(!isRevenueExpanded)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalRevenue')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {!isRevenueExpanded ? (
              <>
                <div className="text-2xl font-bold">
                  {ordersStats && typeof ordersStats.totalRevenue === 'number' ? ordersStats.totalRevenue.toLocaleString() : 0} {t('currency')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('totalRevenue')}
                </p>
              </>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {Array.isArray(ordersStats?.statusStats) && ordersStats.statusStats.length > 0
                  ? ordersStats.statusStats.filter(stat => stat.status !== 'cancelled').map((stat) => (
                      <div 
                        key={stat.status} 
                        className="rounded-lg border bg-card p-2 hover:bg-muted/50 transition-colors"
                      >
                        <div className="text-[0.8rem] font-medium">{stat.label}</div>
                        <div className="text-lg font-bold mt-1" style={{ color: stat.color }}>
                          {typeof stat.revenue === 'number' ? stat.revenue.toLocaleString() : 0} {t('currency')}
                        </div>
                      </div>
                    ))
                  : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* إشعارات الطلبات الجديدة والمنتجات منخفضة المخزون */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 mt-2">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-yellow-300 bg-yellow-50" onClick={() => setShowPendingOrdersDetails((v) => !v)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-900">{t('newOrders')}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{pendingOrders.length}</div>
            <p className="text-xs text-yellow-800">{t('ordersPendingProcessing')}</p>
            {showPendingOrdersDetails && pendingOrders.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {pendingOrders.slice(0, 3).map(order => (
                  <button key={order.id} className="underline text-yellow-700 hover:text-yellow-900 text-xs" onClick={e => { e.stopPropagation(); navigate(`/admin/orders?orderId=${order.id}`); }}>
                    {t('orderDetails')} {order.profiles?.full_name ? order.profiles.full_name : t('unknownCustomer')}
                  </button>
                ))}
                {pendingOrders.length > 3 && <span className="text-xs text-yellow-700">{t('andMore')}</span>}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-red-300 bg-red-50" onClick={() => setShowLowStockDetails((v) => !v)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-900">{t('lowStockProducts')}</CardTitle>
            <Package className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{lowStockProductsData.length}</div>
            <p className="text-xs text-red-800">{t('restockNeededProducts')}</p>
            {showLowStockDetails && lowStockProductsData.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {lowStockProductsData.slice(0, 3).map(product => {
                  let productName = product.name;
                  if (language === 'ar' && product.name_ar) productName = product.name_ar;
                  else if (language === 'en' && product.name_en) productName = product.name_en;
                  else if (language === 'he' && product.name_he) productName = product.name_he;
                  return (
                    <button key={product.id} className="underline text-red-700 hover:text-red-900 text-xs" onClick={e => { e.stopPropagation(); navigate(`/admin/products?productId=${product.id}`); }}>
                      {productName} ({product.stock_quantity})
                    </button>
                  );
                })}
                {lowStockProductsData.length > 3 && <span className="text-xs text-red-700">{t('andMore')}</span>}
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
            <CardTitle className="text-lg font-semibold">{t('usersDistribution')}</CardTitle>
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
            <CardTitle className="text-lg font-semibold">{t('productsByCategory')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <BarChart data={categoriesStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Bar dataKey="inStock" fill="#10b981" name={t('inStock')} />
                <Bar dataKey="outOfStock" fill="#ef4444" name={t('outOfStock')} />
                <ChartTooltip content={<ChartTooltipContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Orders Trend Chart */}
        <Card className="xl:col-span-2 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t('ordersAndRevenueTrend')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {monthlyLoading ? (
              <div className="flex justify-center items-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-80 w-full">
                <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name={t('orders')}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  name={t('revenue')}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
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
            <CardTitle className="text-lg font-semibold">{t('recentActivity')}</CardTitle>
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
                  const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
                  
                  if (diffInMinutes < 1) return t('now');
                  if (diffInMinutes < 60) return t('minutesAgo').replace('{count}', diffInMinutes.toString());
                  if (diffInMinutes < 1440) return t('hoursAgo').replace('{count}', Math.floor(diffInMinutes / 60).toString());
                  return t('daysAgo').replace('{count}', Math.floor(diffInMinutes / 1440).toString());
                };
                
                const colorClasses = {
                  green: 'bg-green-500',
                  blue: 'bg-blue-500',
                  yellow: 'bg-yellow-500',
                  red: 'bg-red-500'
                };
                
                return (
                  <div key={index} className="flex items-start space-x-4 rtl:space-x-reverse">
                    <div className={`w-3 h-3 ${colorClasses[activity.color as keyof typeof colorClasses]} rounded-full mt-1 flex-shrink-0`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{getTimeAgo(activity.time)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p className="text-sm">{t('noRecentActivity')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardStats;

// تم حذف كل منطق الجلسة أو الأحداث (addEventListener, refetch, supabase.auth, visibilitychange) من هذا الملف. استخدم AuthContext فقط.
// ملاحظة: للحصول على إحصائيات حية، يمكنك استخدام useProductsRealtime/useCategoriesRealtime لجلب المنتجات والفئات ثم حساب الإحصائيات منها مباشرة، أو إضافة اشتراك Realtime مخصص لجداول الإحصائيات إذا لزم الأمر.