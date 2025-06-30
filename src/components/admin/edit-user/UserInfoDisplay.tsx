import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/utils/languageContextUtils';
import type { UserProfile } from '@/types/profile';

interface UserInfoDisplayProps {
  user: UserProfile;
  isRTL?: boolean;
}

const UserInfoDisplay: React.FC<UserInfoDisplayProps> = ({ user, isRTL }) => {
  const { t } = useLanguage();

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'admin': return '👑';
      case 'wholesale': return '🏢';
      case 'retail': return '🛒';
      default: return '👤';
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'admin': return 'from-red-500 to-pink-500';
      case 'wholesale': return 'from-blue-500 to-purple-500';
      case 'retail': return 'from-green-500 to-teal-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className={`bg-gray-50 rounded-xl p-4 mb-6 space-y-3 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-sm">
            {user.full_name?.charAt(0) || 'U'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 truncate">{user.full_name}</p>
          <p className="text-sm text-gray-500 truncate">{user.email}</p>
        </div>
        <Badge className={`${getUserTypeColor(user.user_type)} bg-gradient-to-r text-white border-0 text-xs`}>
          <span className="ml-1">{getUserTypeIcon(user.user_type)}</span>
          {t(user.user_type)}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs lg:text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">
            {format(new Date(user.created_at), 'PPP')}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {user.email_confirmed_at ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-600">{t('confirmed')}</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-orange-500" />
              <span className="text-orange-600">{t('unconfirmed')}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserInfoDisplay;
