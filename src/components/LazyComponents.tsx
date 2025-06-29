// تحسين تحميل الصفحات مع Lazy Loading
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Loading Component محسن
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">جاري التحميل...</p>
    </div>
  </div>
);

// Lazy loading للصفحات الثقيلة
export const LazyAdminDashboard = lazy(() => 
  import('@/pages/AdminDashboard').then(module => ({
    default: module.default
  }))
);

export const LazyAdminProducts = lazy(() => 
  import('@/components/admin/AdminProducts').then(module => ({
    default: module.default
  }))
);

export const LazyAdminUsers = lazy(() => 
  import('@/components/admin/AdminUsers').then(module => ({
    default: module.default
  }))
);

export const LazyAdminOrders = lazy(() => 
  import('@/components/admin/AdminOrders').then(module => ({
    default: module.default
  }))
);

export const LazyAdminCategories = lazy(() => 
  import('@/components/admin/AdminCategories').then(module => ({
    default: module.default
  }))
);

export const LazyProducts = lazy(() => 
  import('@/pages/Products').then(module => ({
    default: module.default
  }))
);

// Wrapper مع Suspense محسن
export const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingSpinner />}>
    {children}
  </Suspense>
);

// HOC للتحميل التدريجي
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  FallbackComponent: React.ComponentType = LoadingSpinner
) => {
  return (props: P) => (
    <Suspense fallback={<FallbackComponent />}>
      <Component {...props} />
    </Suspense>
  );
};
