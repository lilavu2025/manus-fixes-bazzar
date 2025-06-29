import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/utils/languageContextUtils';
import { useAuth } from '@/contexts/useAuth';
import PhoneInput from '@/components/PhoneInput';
import { isValidPhone } from '@/utils/phoneValidation';

interface GoogleSignupFormProps {
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  isSignUp?: boolean;
}

export const GoogleSignupForm: React.FC<GoogleSignupFormProps> = ({
  onSuccess,
  onError,
  loading,
  setLoading,
  isSignUp = false
}) => {
  const { t, language } = useLanguage();
  const { signInWithGoogle } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: ''
  });
  const [formErrors, setFormErrors] = useState<{
    fullName?: string;
    phone?: string;
  }>({});

  const isRTL = language === 'ar' || language === 'he';

  const handleGoogleClick = () => {
    if (isSignUp) {
      // للتسجيل: اطلب البيانات أولاً
      setShowForm(true);
    } else {
      // لتسجيل الدخول: اذهب مباشرة إلى Google
      handleGoogleAuth();
    }
  };

  const handleGoogleAuth = async (additionalData?: { fullName: string; phone: string }) => {
    setLoading(true);
    try {
      // حفظ البيانات الإضافية في localStorage مؤقتاً لاستخدامها بعد OAuth
      if (additionalData) {
        console.log('Saving temp user data:', additionalData);
        localStorage.setItem('tempUserData', JSON.stringify(additionalData));
        
        // التحقق من أن البيانات حُفظت فعلاً
        const savedData = localStorage.getItem('tempUserData');
        console.log('Verified saved data:', savedData);
      }

      // تشغيل Google OAuth (سيعيد التوجيه، لذلك لا نحتاج success/error هنا)
      await signInWithGoogle();
      
      // لا نظهر toast هنا لأن المستخدم سيُوجه إلى Google
      // سيتم التعامل مع النجاح/الفشل بعد العودة من Google
    } catch (error: any) {
      console.error('Google auth error:', error);
      onError(error.message || t('googleAuthError'));
    } finally {
      setLoading(false);
    }
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setShowForm(false);
      handleGoogleAuth(formData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // مسح الخطأ عند الكتابة
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <>
      <Button
        onClick={handleGoogleClick}
        disabled={loading}
        variant="outline"
        className="w-full flex items-center gap-2"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {loading ? t('loading') : (isSignUp ? t('signupWithGoogle') : t('loginWithGoogle'))}
      </Button>

      {/* نموذج طلب المعلومات قبل Google OAuth */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className={`max-w-md ${isRTL ? 'text-right' : 'text-left'}`}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center">
              {t('completeProfileBeforeGoogle')}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              {t('enterDetailsBeforeGoogleAuth')}
            </div>

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

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading}
              >
                {loading ? t('loading') : t('continueWithGoogle')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
