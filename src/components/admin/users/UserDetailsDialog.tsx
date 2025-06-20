import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, CheckCircle, XCircle, Mail, Phone, User, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/utils/languageContextUtils';
import type { UserProfile } from '@/types/profile';

interface UserDetailsDialogProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({ user, open, onOpenChange }) => {
  const { t, isRTL } = useLanguage();

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'admin':
        return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
      case 'wholesale':
        return 'bg-gradient-to-r from-blue-500 to-purple-500 text-white';
      case 'retail':
        return 'bg-gradient-to-r from-green-500 to-teal-500 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'admin': return '👑';
      case 'wholesale': return '🏢';
      case 'retail': return '🛒';
      default: return '👤';
    }
  };

  // دوال حماية التواريخ والأرقام
  const safeDate = (val: string | number | Date | undefined | null) => {
    if (!val) return '-';
    const d = new Date(val);
    return isNaN(d.getTime()) ? '-' : format(d, 'PPP');
  };
  const safeNumber = (val: string | number | undefined | null) => {
    if (val === undefined || val === null || val === '') return '-';
    const n = Number(val);
    return isNaN(n) ? '-' : n + ' ' + (t('currency') || 'ش.ج');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-2xl ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">{t('userDetails')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Profile Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {user.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{user.full_name}</h3>
                  <Badge className={`${getUserTypeColor(user.user_type)} mt-1`}>
                    <span className="ml-1">{getUserTypeIcon(user.user_type)}</span>
                    {t(user.user_type)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{t('id')}:</span>
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {user.id.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{t('email')}:</span>
                  <span className="text-sm">{user.email || t('notProvided')}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{t('phone')}:</span>
                    <span className="text-sm">{user.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Status and Dates */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {t('accountStatusAndDates')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* حالة الحساب */}
                <div className="flex items-center gap-2">
                  {user.disabled ? (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">{t('accountDisabled')}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">{t('accountActive')}</span>
                    </>
                  )}
                </div>
                {/* حالة الإيميل */}
                <div className="flex items-center gap-2">
                  {user.email_confirmed_at ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">{t('emailConfirmed')}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-orange-600">{t('emailNotConfirmedAdmin')}</span>
                    </>
                  )}
                </div>
                {/* تاريخ التسجيل */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{t('registrationDate')}:</span>
                  <span className="text-sm">{safeDate(user.created_at)}</span>
                </div>
                {/* تاريخ آخر تعديل */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{t('lastAccountUpdate')}:</span>
                  <span className="text-sm">{safeDate(user.updated_at)}</span>
                </div>
                {/* آخر دخول */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{t('lastLogin')}:</span>
                  <span className="text-sm">{safeDate(user.last_sign_in_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* كرت منفصل لإحصائيات الطلبيات */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <span className="text-lg">📦</span>
                {t('orderStats')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* آخر طلبية */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{t('lastOrder')}:</span>
                  <span className="text-sm">{safeDate(user.last_order_date)}</span>
                </div>
                {/* أكبر طلبية */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{t('highestOrder')}:</span>
                  <span className="text-sm">{safeNumber(user.highest_order_value)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsDialog;
