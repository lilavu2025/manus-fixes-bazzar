import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/utils/languageContextUtils';
import { useAuth } from '@/contexts/useAuth';
import PhoneInput from '@/components/PhoneInput';
import { isValidPhone } from '@/utils/phoneValidation';
import { useEnhancedToast } from '@/hooks/useEnhancedToast';

interface CompleteProfileAfterGoogleProps {
  open: boolean;
  onCompleted: () => void;
}

export const CompleteProfileAfterGoogle: React.FC<CompleteProfileAfterGoogleProps> = ({
  open,
  onCompleted
}) => {
  const { t, language } = useLanguage();
  const { completeGoogleProfile, signOut } = useAuth();
  const enhancedToast = useEnhancedToast();
  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: ''
  });
  const [formErrors, setFormErrors] = useState<{
    fullName?: string;
    phone?: string;
  }>({});

  const isRTL = language === 'ar' || language === 'he';

  // إعادة تعيين النموذج عند فتح/إغلاق النافذة
  useEffect(() => {
    if (open) {
      setFormData({
        fullName: '',
        phone: ''
      });
      setFormErrors({});
    }
  }, [open]);

  // منع إغلاق النافذة أو الضغط على خارجها
  const handleDialogChange = (open: boolean) => {
    // لا نفعل شيء، النافذة يجب أن تبقى مفتوحة
  };

  const validateForm = () => {
    const errors: { fullName?: string; phone?: string } = {};

    if (!formData.fullName.trim()) {
      errors.fullName = t('fullNameRequired');
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = t('fullNameTooShort');
    }

    if (!formData.phone.trim()) {
      errors.phone = t('phoneRequired');
    } else if (!isValidPhone(formData.phone)) {
      errors.phone = t('invalidPhone');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // مسح الخطأ عند الكتابة
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await completeGoogleProfile(formData.fullName, formData.phone);
      
      enhancedToast.success(t('profileCompletedSuccess'));
      onCompleted();
    } catch (error: any) {
      enhancedToast.error(error.message || t('profileCompletionError'));
    } finally {
      setLoading(false);
    }
  };

  // دالة تسجيل الخروج
  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await signOut();
      onCompleted(); // إغلاق النافذة
    } catch (error: any) {
      enhancedToast.error(error.message || t('logoutError'));
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent 
        className={`max-w-md ${isRTL ? 'text-right' : 'text-left'} [&>button]:hidden`}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            {t('completeYourProfile')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-sm text-muted-foreground mb-4 text-center">
          {t('completeProfileAfterGoogle')}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* اسم كامل */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium">
              {t('fullName')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder={t('fullNamePlaceholder')}
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className={formErrors.fullName ? 'border-red-500' : ''}
              dir={isRTL ? 'rtl' : 'ltr'}
              disabled={loading}
            />
            {formErrors.fullName && (
              <p className="text-red-500 text-sm">{formErrors.fullName}</p>
            )}
          </div>

          {/* رقم الهاتف */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              {t('phone')} <span className="text-red-500">*</span>
            </Label>
            <PhoneInput
              value={formData.phone}
              onChange={(value) => handleInputChange('phone', value)}
              label=""
              error={formErrors.phone}
              placeholder={t('phonePlaceholder')}
            />
            {formErrors.phone && (
              <p className="text-red-500 text-sm">{formErrors.phone}</p>
            )}
          </div>

          <div className="pt-4 space-y-3">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || logoutLoading}
            >
              {loading ? t('loading') : t('completeProfile')}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading || logoutLoading}
              onClick={handleLogout}
            >
              {logoutLoading ? t('loading') : t('logout')}
            </Button>
          </div>
        </form>

        <div className="text-xs text-muted-foreground text-center mt-4">
          {t('profileCompletionRequired')}
          <br />
          <span className="text-xs opacity-75">{t('orYouCanLogout')}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
