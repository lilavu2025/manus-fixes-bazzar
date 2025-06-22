import * as React from "react";
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { useLanguage } from '@/utils/languageContextUtils';

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
  if (loading || (requireAdmin && (!profile || !user))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 animate-pulse">{t('loading')}...</p>
        </div>
      </div>
    );
  }

  // For authentication requirement
  if (requireAuth && !user) {
    // إذا لم يكن هناك مستخدم، أرسل إلى صفحة auth مع حفظ المسار الحالي
    return <Navigate to="/auth" state={{ from: location.pathname + location.search + location.hash }} replace />;
  }

  // For admin requirement - check both user and profile
  if (requireAdmin) {
    if (!user) {
      return <Navigate to="/auth" state={{ from: location }} replace />;
    }
    if (!profile || profile.user_type !== 'admin') {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
