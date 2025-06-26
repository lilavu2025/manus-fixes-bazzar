import * as React from "react";
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { useLanguage } from '@/utils/languageContextUtils';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requireAuth = true 
}) => {
  const { user, profile, loading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  // Show loading spinner while authentication/profile is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 animate-pulse">{t('loadingPage')}</p>
        </div>
      </div>
    );
  }

  // For authentication requirement
  if (requireAuth && !user && !loading) {
    // إذا لم يكن هناك مستخدم بعد انتهاء التحميل، أرسل إلى صفحة auth مع حفظ المسار الحالي
    return <Navigate to="/auth" state={{ from: location.pathname + location.search + location.hash }} replace />;
  }

  // For admin requirement - check both user and profile
  if (requireAdmin) {
    if (!user) {
      return <Navigate to="/auth" state={{ from: location }} replace />;
    }
    if (!profile || profile.user_type !== 'admin') {
      // Show access denied message with toast and redirect after delay
      React.useEffect(() => {
        toast.error(t('accessDenied'), {
          description: t('adminAccessRequired')
        });
        
        const timer = setTimeout(() => {
          window.location.href = '/';
        }, 3000);
        
        return () => clearTimeout(timer);
      }, [t]);
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('accessDenied')}</h1>
            <p className="text-gray-600 mb-6">{t('accessDeniedMessage')}</p>
            <div className="animate-pulse">
              <p className="text-sm text-gray-500">{t('redirectingToHomePage')}</p>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
