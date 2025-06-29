import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/utils/languageContextUtils';
import { Phone, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

interface PhoneAuthProps {
  onSuccess: (phone: string) => void;
  onError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const PhoneAuth: React.FC<PhoneAuthProps> = ({
  onSuccess,
  onError,
  loading,
  setLoading
}) => {
  const { t, isRTL } = useLanguage();
  const { signInWithPhone, verifyPhoneOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (countdown > 0) {
      intervalRef.current = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [countdown]);

  const formatPhoneNumber = (phoneNumber: string): string => {
    // إزالة جميع الأحرف غير الرقمية
    const digits = phoneNumber.replace(/\D/g, '');
    
    // إذا بدأ بـ 05، نضيف كود الدولة +972
    if (digits.startsWith('05') && digits.length === 10) {
      return `+972${digits.substring(1)}`;
    }
    
    // إذا بدأ بـ 9725، فهو مكتمل بالفعل
    if (digits.startsWith('9725') && digits.length === 13) {
      return `+${digits}`;
    }
    
    // إذا بدأ بـ 972، نضيف +
    if (digits.startsWith('972') && digits.length === 12) {
      return `+${digits}`;
    }
    
    return phoneNumber;
  };

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    try {
      const formatted = formatPhoneNumber(phoneNumber);
      return isValidPhoneNumber(formatted, 'IL');
    } catch {
      // فحص بسيط إذا فشل parsePhoneNumber
      const digits = phoneNumber.replace(/\D/g, '');
      return digits.startsWith('05') && digits.length === 10;
    }
  };

  const handleSendOTP = async () => {
    if (!validatePhoneNumber(phone)) {
      onError(t('invalidPhone'));
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phone);
      
      await signInWithPhone(formattedPhone);

      setShowVerification(true);
      setCountdown(60);
      onSuccess(t('phoneVerificationSent'));
    } catch (error: any) {
      onError(error.message || t('phoneAuthError'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      onError(t('invalidCode'));
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phone);
      
      await verifyPhoneOtp(formattedPhone, verificationCode);

      onSuccess(t('phoneVerified'));
    } catch (error: any) {
      onError(error.message || t('invalidCode'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phone);
      
      await signInWithPhone(formattedPhone);

      setCountdown(60);
      onSuccess(t('phoneVerificationSent'));
    } catch (error: any) {
      onError(error.message || t('phoneAuthError'));
    } finally {
      setLoading(false);
    }
  };

  if (showVerification) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-primary" />
          <h3 className="text-lg font-semibold mt-2">{t('verificationCode')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('phoneVerificationSent')}
          </p>
          <p className="text-sm font-medium">{phone}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="verification-code">{t('enterCode')}</Label>
          <Input
            id="verification-code"
            type="text"
            placeholder="123456"
            value={verificationCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setVerificationCode(value);
            }}
            maxLength={6}
            className="text-center text-lg tracking-widest"
            dir="ltr"
          />
        </div>

        <Button
          onClick={handleVerifyOTP}
          disabled={loading || verificationCode.length !== 6}
          className="w-full"
        >
          {loading ? t('loading') : t('verifyCode')}
        </Button>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={handleResendCode}
            disabled={countdown > 0 || loading}
            className="text-sm"
          >
            {countdown > 0 
              ? `${t('resendIn')}${countdown}${t('seconds')}`
              : t('resendCode')
            }
          </Button>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            setShowVerification(false);
            setVerificationCode('');
            setCountdown(0);
          }}
          className="w-full"
        >
          {t('backToSignup')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <Phone className="mx-auto h-12 w-12 text-primary" />
        <h3 className="text-lg font-semibold mt-2">{t('loginWithPhone')}</h3>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">{t('phone')}</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="05X-XXX-XXXX"
          value={phone}
          onChange={(e) => {
            const value = e.target.value.replace(/[^\d-]/g, '');
            setPhone(value);
          }}
          dir="ltr"
        />
      </div>

      <Button
        onClick={handleSendOTP}
        disabled={loading || !phone}
        className="w-full"
      >
        {loading ? t('loading') : t('sendCode')}
      </Button>
    </div>
  );
};
