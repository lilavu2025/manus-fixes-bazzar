// مكونات Loading محسنة لتجربة مستخدم أفضل
import React from 'react';
import { Loader2, ShoppingBag, Users, Package, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';

// Loading العام
export const LoadingSpinner = ({ size = 'default', text }: { 
  size?: 'small' | 'default' | 'large'; 
  text?: string 
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    </div>
  );
};

// Loading للمنتجات
export const ProductsLoading = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: 8 }).map((_, i) => (
      <Card key={i} className="overflow-hidden">
        <div className="aspect-square bg-gray-200 animate-pulse" />
        <div className="p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>
      </Card>
    ))}
  </div>
);

// Loading للوحة التحكم
export const DashboardLoading = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <BarChart3 className="h-8 w-8 animate-pulse text-primary" />
      <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
    </div>
    
    {/* Stats Cards Loading */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
            <div className="h-12 w-12 bg-gray-200 rounded animate-pulse" />
          </div>
        </Card>
      ))}
    </div>

    {/* Chart Loading */}
    <Card className="p-6">
      <div className="h-64 bg-gray-200 rounded animate-pulse" />
    </Card>
  </div>
);

// Loading للجداول
export const TableLoading = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="space-y-3">
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="h-6 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div key={colIndex} className="h-4 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    ))}
  </div>
);

// Loading للصفحات مع أيقونات مناسبة
export const PageLoadingWithIcon = ({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType; 
  title: string; 
  description?: string 
}) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <div className="relative">
      <Icon className="h-16 w-16 text-gray-300" />
      <Loader2 className="h-6 w-6 animate-spin text-primary absolute -bottom-1 -right-1" />
    </div>
    <div className="text-center space-y-1">
      <h3 className="font-semibold text-lg">{title}</h3>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  </div>
);

// Loading مخصص للأقسام المختلفة
export const AdminProductsLoading = () => (
  <PageLoadingWithIcon 
    icon={Package} 
    title="جاري تحميل المنتجات..." 
    description="يرجى الانتظار أثناء تحميل بيانات المنتجات"
  />
);

export const AdminUsersLoading = () => (
  <PageLoadingWithIcon 
    icon={Users} 
    title="جاري تحميل المستخدمين..." 
    description="يرجى الانتظار أثناء تحميل بيانات العملاء"
  />
);

export const AdminOrdersLoading = () => (
  <PageLoadingWithIcon 
    icon={ShoppingBag} 
    title="جاري تحميل الطلبات..." 
    description="يرجى الانتظار أثناء تحميل بيانات الطلبات"
  />
);

// Loading Button للأزرار
export const LoadingButton = ({ 
  children, 
  loading, 
  size = 'default',
  ...props 
}: { 
  children: React.ReactNode; 
  loading: boolean; 
  size?: 'small' | 'default' | 'large';
  [key: string]: any;
}) => {
  const sizeClasses = {
    small: 'h-3 w-3',
    default: 'h-4 w-4',
    large: 'h-5 w-5'
  };

  return (
    <button disabled={loading} {...props}>
      <div className="flex items-center gap-2">
        {loading && <Loader2 className={`animate-spin ${sizeClasses[size]}`} />}
        {children}
      </div>
    </button>
  );
};
