import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import { User, Phone, Shield } from 'lucide-react';
import { useLanguage } from '@/utils/languageContextUtils';

interface FormData {
  full_name: string;
  phone: string;
  user_type: 'admin' | 'wholesale' | 'retail';
}

interface EditUserFormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  loading: boolean;
  isRTL?: boolean;
}

const EditUserForm: React.FC<EditUserFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  loading,
  isRTL
}) => {
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
    <form onSubmit={onSubmit} className={`space-y-4 lg:space-y-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="space-y-2">
        <Label htmlFor="full_name" className="flex items-center gap-2 font-medium text-gray-700 text-sm lg:text-base">
          <User className="h-4 w-4" />
          {t('fullName') || 'الاسم الكامل'}
        </Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          className="h-10 lg:h-11 border-2 border-gray-200 focus:border-blue-500 transition-colors rounded-lg text-sm lg:text-base"
          placeholder={typeof t('enterFullName') === 'string' ? t('enterFullName') as string : 'أدخل الاسم الكامل'}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2 font-medium text-gray-700 text-sm lg:text-base">
          <Phone className="h-4 w-4" />
          {t('phoneNumber') || 'رقم الهاتف'}
        </Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className={`h-10 lg:h-11 border-2 border-gray-200 focus:border-blue-500 transition-colors rounded-lg text-sm lg:text-base ${isRTL ? 'text-right' : 'text-left'}`}
          placeholder={typeof t('enterPhoneNumber') === 'string' ? t('enterPhoneNumber') as string : 'أدخل رقم الهاتف'}
          dir={isRTL ? 'rtl' : 'ltr'}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="user_type" className="flex items-center gap-2 font-medium text-gray-700 text-sm lg:text-base">
          <Shield className="h-4 w-4" />
          {t('userType') || 'نوع المستخدم'}
        </Label>
        <Select
          value={formData.user_type}
          onValueChange={(value: 'admin' | 'wholesale' | 'retail') => 
            setFormData({ ...formData, user_type: value })
          }
        >
          <SelectTrigger className={`h-10 lg:h-11 border-2 border-gray-200 focus:border-blue-500 transition-colors rounded-lg ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <SelectValue>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
                <span>{getUserTypeIcon(formData.user_type)}</span>
                <span>{formData.user_type === 'admin' ? t('admin') : formData.user_type === 'wholesale' ? t('wholesale') : t('retail')}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className={"border-0 shadow-xl"} dir={isRTL ? 'rtl' : 'ltr'}>
            <SelectItem value="retail" className={`py-3 hover:bg-green-50 transition-colors ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
                <span className="text-lg">🛒</span>
                <div>
                  <div className="font-medium">{t('retail') || 'تجزئة'}</div>
                  <div className="text-sm text-gray-500">{t('retailCustomer') || 'عميل تجزئة عادي'}</div>
                </div>
              </div>
            </SelectItem>
            <SelectItem value="wholesale" className={`py-3 hover:bg-blue-50 transition-colors ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
                <span className="text-lg">🏢</span>
                <div>
                  <div className="font-medium">{t('wholesale') || 'جملة'}</div>
                  <div className="text-sm text-gray-500">{t('wholesaleCustomer') || 'عميل جملة'}</div>
                </div>
              </div>
            </SelectItem>
            <SelectItem value="admin" className={`py-3 hover:bg-red-50 transition-colors ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
                <span className="text-lg">👑</span>
                <div>
                  <div className="font-medium">{t('admin') || 'مدير'}</div>
                  <div className="text-sm text-gray-500">{t('adminSystem') || 'مدير النظام'}</div>
                </div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter className={`gap-3 pt-4 lg:pt-6 flex-col sm:flex-row ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="h-10 lg:h-11 px-6 border-2 hover:bg-gray-50 transition-all duration-200 w-full sm:w-auto order-2 sm:order-1"
        >
          {t('cancel') || 'إلغاء'}
        </Button>
        <Button 
          type="submit" 
          disabled={loading}
          className={`h-10 lg:h-11 px-6 bg-gradient-to-r ${getUserTypeColor(formData.user_type)} hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border-0 text-white w-full sm:w-auto order-1 sm:order-2`}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {t('updating')}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>{getUserTypeIcon(formData.user_type)}</span>
              {t('saveChanges')}
            </div>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default EditUserForm;
