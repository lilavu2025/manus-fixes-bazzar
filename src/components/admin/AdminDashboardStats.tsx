import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../../utils/languageContextUtils';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Package, ShoppingCart, Users, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Helper types
interface UsersByType { [key: string]: number; }
interface ProductsByCategoryStats { total: number; inStock: number; outOfStock: number; }

interface AdminDashboardStatsProps {
  onFilterUsers?: (userType: string) => void;
  onFilterOrders?: (status: string) => void;
  pendingOrders?: { id: string; created_at: string; profiles?: { full_name: string; email?: string; phone?: string } }[];
  lowStockProductsData?: { id: string; name: string; stock_quantity: number }[];
}

const AdminDashboardStats: React.FC<AdminDashboardStatsProps> = ({ 
  onFilterUsers, 
  onFilterOrders,
  pendingOrders = [],
  lowStockProductsData = []
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isUsersExpanded, setIsUsersExpanded] = useState(false);
  const [isOrdersExpanded, setIsOrdersExpanded] = useState(false);
  const [isRevenueExpanded, setIsRevenueExpanded] = useState(false);
  const [showPendingOrdersDetails, setShowPendingOrdersDetails] = useState(false);
  const [showLowStockDetails, setShowLowStockDetails] = useState(false);

  // Fetch users statistics
  const { data: usersStats = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ["admin-users-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_type, created_at');

      if (error) throw error;

      const usersByType: UsersByType = data.reduce((acc: UsersByType, user: { user_type: string }) => {
        acc[user.user_type] = (acc[user.user_type] || 0) + 1;
        return acc;
      }, {});

      return [
        { name: t('admin'), value: usersByType.admin || 0, color: '#ef4444' },
        { name: t('wholesale'), value: usersByType.wholesale || 0, color: '#3b82f6' },
        { name: t('retail'), value: usersByType.retail || 0, color: '#10b981' },
      ];
    },
    retry: 3,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: false, // تم تعطيل polling (refetchInterval) لأن المتصفح يوقفه بالخلفية،
    // والاعتماد على WebSocket أو إعادة الجلب عند العودة للواجهة أفضل
  });

  // Fetch products statistics
  const { data: productsStats = [], isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ["admin-products-stats"],
    queryFn: async () => {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('category_id, in_stock, active');

      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name_ar, name_en');

      if (productsError || categoriesError) throw productsError || categoriesError;

      const productsByCategory: Record<string, ProductsByCategoryStats> = products.reduce((acc: Record<string, ProductsByCategoryStats>, product: { category_id: string; in_stock: boolean; active: boolean }) => {
        const category = categories.find((cat: { id: string }) => cat.id === product.category_id);
        const categoryName = category?.name_ar || 'غير محدد';
        if (!acc[categoryName]) {
          acc[categoryName] = { total: 0, inStock: 0, outOfStock: 0 };
        }
        acc[categoryName].total += 1;
        if (product.in_stock) {
          acc[categoryName].inStock += 1;
        } else {
          acc[categoryName].outOfStock += 1;
        }
        return acc;
      }, {});
      return Object.entries(productsByCategory).map(([name, stats]: [string, ProductsByCategoryStats]) => ({
        name,
        total: stats.total,
        inStock: stats.inStock,
        outOfStock: stats.outOfStock,
      }));
    },
    retry: 3,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: false, // تم تعطيل polling (refetchInterval) لأن المتصفح يوقفه بالخلفية،
    // والاعتماد على WebSocket أو إعادة الجلب عند العودة للواجهة أفضل
  });

  // Fetch orders statistics
  const { data: ordersStats, isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ["admin-orders-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('status, total, created_at');

      if (error) throw error;

      const ordersByStatus: Record<string, number> = data.reduce((acc: Record<string, number>, order: { status: string }) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});
      const revenueByStatus: Record<string, number> = data.reduce((acc: Record<string, number>, order: { status: string; total: number }) => {
        if (!acc[order.status]) acc[order.status] = 0;
        // لا نحسب الإيرادات للطلبات الملغية
        if (order.status !== 'cancelled') {
          acc[order.status] += order.total || 0;
        }
        return acc;
      }, {});

      const totalRevenue = data
        .filter(order => order.status !== 'cancelled')
        .reduce((sum, order) => sum + (order.total || 0), 0);

      return {
        statusStats: [
          { 
            status: 'pending', 
            label: 'في الانتظار', 
            value: ordersByStatus.pending || 0, 
            revenue: revenueByStatus.pending || 0,
            color: '#8b5cf6' 
          },
          { 
            status: 'processing', 
            label: 'قيد المعالجة', 
            value: ordersByStatus.processing || 0, 
            revenue: revenueByStatus.processing || 0,
            color: '#f59e0b' 
          },
          { 
            status: 'shipped', 
            label: 'تم الشحن', 
            value: ordersByStatus.shipped || 0, 
            revenue: revenueByStatus.shipped || 0,
            color: '#3b82f6' 
          },
          { 
            status: 'delivered', 
            label: 'تم التسليم', 
            value: ordersByStatus.delivered || 0, 
            revenue: revenueByStatus.delivered || 0,
            color: '#10b981' 
          },
          { 
            status: 'cancelled', 
            label: 'ملغية', 
            value: ordersByStatus.cancelled || 0, 
            revenue: 0,
            color: '#ef4444' 
          },
        ],
        totalOrders: data.length,
        totalRevenue
      };
    },
    retry: 3,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: false, // تم تعطيل polling (refetchInterval) لأن المتصفح يوقفه بالخلفية،
    // والاعتماد على WebSocket أو إعادة الجلب عند العودة للواجهة أفضل
  });

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
          'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
          'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
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
  const { data: recentActivity = [], isLoading: activityLoading } = useQuery({
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

  // Show loading state
  if (usersLoading || productsLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loading')}...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (usersError || productsError || ordersError) {
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
             {usersError?.message || productsError?.message || ordersError?.message || t('unexpectedError')}
           </p>
        </div>
      </div>
    );
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
                  {usersStats.reduce((sum, stat) => sum + stat.value, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('registeredUsers')}
                </p>
              </>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {usersStats.map((stat) => (
                  <div 
                    key={stat.name} 
                    className="rounded-lg border bg-card p-2 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleUserTypeClick(stat.name)}
                  >
                    <div className="text-[0.9rem] font-medium">{stat.name}</div>
                    <div className="text-xl font-bold mt-1">{stat.value}</div>
                  </div>
                ))}
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
              {productsStats.reduce((sum, stat) => sum + stat.total, 0)}
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
                  {ordersStats?.totalOrders || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('totalOrders')}
                </p>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {ordersStats?.statusStats?.map((stat) => (
                  <div 
                    key={stat.status} 
                    className="rounded-lg border bg-card p-2 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleOrderStatusClick(stat.status)}
                  >
                    <div className="text-[0.9rem] font-medium">{stat.label}</div>
                    <div className="text-xl font-bold mt-1" style={{ color: stat.color }}>
                      {stat.value}
                    </div>
                  </div>
                )) || []}
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
                  {ordersStats?.totalRevenue?.toLocaleString() || 0} {t('currency')}
                </div>
                <p className="text-xs text-muted-foreground">
                  إجمالي الإيرادات
                </p>
              </>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {ordersStats?.statusStats?.filter(stat => stat.status !== 'cancelled').map((stat) => (
                  <div 
                    key={stat.status} 
                    className="rounded-lg border bg-card p-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="text-[0.8rem] font-medium">{stat.label}</div>
                    <div className="text-lg font-bold mt-1" style={{ color: stat.color }}>
                      {stat.revenue?.toLocaleString() || 0} {t('currency')}
                    </div>
                  </div>
                )) || []}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* إشعارات الطلبات الجديدة والمنتجات منخفضة المخزون */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 mt-2">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-yellow-300 bg-yellow-50" onClick={() => setShowPendingOrdersDetails((v) => !v)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-900">طلبات جديدة</CardTitle>
            <ShoppingCart className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{pendingOrders.length}</div>
            <p className="text-xs text-yellow-800">طلبات بانتظار المعالجة</p>
            {showPendingOrdersDetails && pendingOrders.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {pendingOrders.slice(0, 3).map(order => (
                  <button key={order.id} className="underline text-yellow-700 hover:text-yellow-900 text-xs" onClick={e => { e.stopPropagation(); navigate(`/admin/orders?orderId=${order.id}`); }}>
                    تفاصيل الطلب {order.profiles?.full_name ? order.profiles.full_name : 'عميل غير محدد'}
                  </button>
                ))}
                {pendingOrders.length > 3 && <span className="text-xs text-yellow-700">والمزيد...</span>}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-red-300 bg-red-50" onClick={() => setShowLowStockDetails((v) => !v)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-900">منتجات منخفضة المخزون</CardTitle>
            <Package className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{lowStockProductsData.length}</div>
            <p className="text-xs text-red-800">منتجات بحاجة لإعادة التوريد</p>
            {showLowStockDetails && lowStockProductsData.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {lowStockProductsData.slice(0, 3).map(product => (
                  <button key={product.id} className="underline text-red-700 hover:text-red-900 text-xs" onClick={e => { e.stopPropagation(); navigate(`/admin/products?productId=${product.id}`); }}>
                    {product.name} ({product.stock_quantity})
                  </button>
                ))}
                {lowStockProductsData.length > 3 && <span className="text-xs text-red-700">والمزيد...</span>}
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
                  data={usersStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {usersStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
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
              <BarChart data={productsStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                  
                  if (diffInMinutes < 1) return 'الآن';
                  if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
                  if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
                  return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
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

// ملاحظة: للحصول على إحصائيات حية، يمكنك استخدام useProductsRealtime/useCategoriesRealtime لجلب المنتجات والفئات ثم حساب الإحصائيات منها مباشرة، أو إضافة اشتراك Realtime مخصص لجداول الإحصائيات إذا لزم الأمر.