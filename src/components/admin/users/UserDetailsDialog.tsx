import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle, XCircle, Mail, Phone, User, Shield, Activity, ShoppingBag } from 'lucide-react';
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
      <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 -m-6 mb-6 p-6 border-b border-blue-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-blue-800 flex items-center justify-center gap-2">
              <User className="h-6 w-6" />
              {t('userDetails') || 'تفاصيل المستخدم'}
            </DialogTitle>
          </DialogHeader>
        </div>
        
        <div className="space-y-6">
          {/* قسم المعلومات الشخصية */}
          <Card className="border-l-4 border-l-green-500 bg-green-50/50">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-green-800 flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('personalInformation') || 'المعلومات الشخصية'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">
                    {user.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-green-900">{user.full_name}</h3>
                  <Badge className={`${getUserTypeColor(user.user_type)} mt-2`}>
                    <span className="ml-1">{getUserTypeIcon(user.user_type)}</span>
                    {t(user.user_type)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-green-100 rounded-lg">
                  <User className="h-4 w-4 text-green-600" />
                  <div>
                    <span className="text-sm text-green-700 font-medium">{t('id') || 'المعرف'}:</span>
                    <span className="text-sm font-mono bg-green-200 px-2 py-1 rounded ml-2">
                      {user.id.slice(0, 8)}...
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-100 rounded-lg">
                  <Mail className="h-4 w-4 text-green-600" />
                  <div>
                    <span className="text-sm text-green-700 font-medium">{t('email') || 'البريد الإلكتروني'}:</span>
                    <span className="text-sm ml-2">{user.email || t('notProvided')}</span>
                  </div>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 p-3 bg-green-100 rounded-lg">
                    <Phone className="h-4 w-4 text-green-600" />
                    <div>
                      <span className="text-sm text-green-700 font-medium">{t('phone') || 'الهاتف'}:</span>
                      <span className="text-sm ml-2">{user.phone}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* قسم حالة الحساب */}
          <Card className="border-l-4 border-l-purple-500 bg-purple-50/50">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-purple-800 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('accountStatusAndDates') || 'حالة الحساب والتواريخ'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* حالة الحساب */}
                <div className="flex items-center gap-3 p-3 bg-purple-100 rounded-lg">
                  {user.disabled ? (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-sm text-red-600 font-medium">{t('accountDisabled') || 'الحساب معطل'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm text-green-600 font-medium">{t('accountActive') || 'الحساب نشط'}</span>
                    </>
                  )}
                </div>
                {/* حالة الإيميل */}
                <div className="flex items-center gap-3 p-3 bg-purple-100 rounded-lg">
                  {user.email_confirmed_at ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm text-green-600 font-medium">{t('emailConfirmed') || 'البريد مؤكد'}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-orange-500" />
                      <span className="text-sm text-orange-600 font-medium">{t('emailNotConfirmedAdmin') || 'البريد غير مؤكد'}</span>
                    </>
                  )}
                </div>
                {/* تاريخ التسجيل */}
                <div className="flex items-center gap-3 p-3 bg-purple-100 rounded-lg">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <div>
                    <span className="text-sm text-purple-700 font-medium">{t('registrationDate') || 'تاريخ التسجيل'}:</span>
                    <span className="text-sm ml-2">{safeDate(user.created_at)}</span>
                  </div>
                </div>
                {/* تاريخ آخر تعديل */}
                <div className="flex items-center gap-3 p-3 bg-purple-100 rounded-lg">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <div>
                    <span className="text-sm text-purple-700 font-medium">{t('lastAccountUpdate') || 'آخر تحديث'}:</span>
                    <span className="text-sm ml-2">{safeDate(user.updated_at)}</span>
                  </div>
                </div>
                {/* آخر دخول */}
                <div className="flex items-center gap-3 p-3 bg-purple-100 rounded-lg md:col-span-2">
                  <Activity className="h-4 w-4 text-purple-600" />
                  <div>
                    <span className="text-sm text-purple-700 font-medium">{t('lastLogin') || 'آخر دخول'}:</span>
                    <span className="text-sm ml-2">{safeDate(user.last_sign_in_at)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* قسم إحصائيات الطلبات */}
          <Card className="border-l-4 border-l-orange-500 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-orange-800 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                {t('orderStats') || 'إحصائيات الطلبات'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* آخر طلبية */}
                <div className="flex items-center gap-3 p-3 bg-orange-100 rounded-lg">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <div>
                    <span className="text-sm text-orange-700 font-medium">{t('lastOrder') || 'آخر طلبية'}:</span>
                    <span className="text-sm ml-2">{safeDate(user.last_order_date)}</span>
                  </div>
                </div>
                {/* أكبر طلبية */}
                <div className="flex items-center gap-3 p-3 bg-orange-100 rounded-lg">
                  <ShoppingBag className="h-4 w-4 text-orange-600" />
                  <div>
                    <span className="text-sm text-orange-700 font-medium">{t('highestOrder') || 'أكبر طلبية'}:</span>
                    <span className="text-sm ml-2">{safeNumber(user.highest_order_value)}</span>
                  </div>
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
