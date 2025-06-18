import * as React from "react";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/utils/languageContextUtils';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailConfirmationPendingProps {
  email: string;
  onBack: () => void;
}

const EmailConfirmationPending: React.FC<EmailConfirmationPendingProps> = ({ email, onBack }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  // Check if user gets confirmed automatically and redirect
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
          toast({
            title: t('success'),
            description: t('emailConfirmedSuccess'),
          });
          // Redirect to home page after successful confirmation
          setTimeout(() => {
            navigate('/');
          }, 1500);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [t, toast, navigate]);

  // If user is already confirmed, redirect to home
  useEffect(() => {
    if (user && user.email_confirmed_at) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleResendEmail = async () => {
    console.log('Resending email for:', email);
    setIsResending(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      console.log('Resend result:', { error });

      if (error) {
        console.error('Resend error:', error);
        throw error;
      }

      toast({
        title: t('success'),
        description: t('confirmationEmailResent'),
      });

      // Reset countdown
      setCountdown(60);
      setCanResend(false);
    } catch (error: unknown) {
      console.error('Error resending email:', error);
      toast({
        title: t('error'),
        description: typeof error === 'object' && error && 'message' in error ? (error as { message?: string }).message || t('resendEmailError') : t('resendEmailError'),
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="relative">
      {/* زر الرجوع صغير دائري أعلى طرف الكرت */}
      <button
        onClick={onBack}
        className="absolute -top-4 ltr:-left-4 rtl:-right-4 w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-center shadow-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 z-10 border-4 border-white dark:border-neutral-900"
        aria-label={t('back')}
        type="button"
      >
        <svg className="h-5 w-5 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
      </button>

      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">م</span>
        </div>
        <CardTitle className="text-2xl">{t('storeName')}</CardTitle>
        <CardDescription>{t('confirmYourEmail')}</CardDescription>
      </CardHeader>

      <CardContent className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{t('checkYourEmail')}</h3>
          <p className="text-gray-600">
            {t('sentConfirmationEmail')} <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500">
            {t('clickLinkToConfirm')}
          </p>
        </div>

        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={handleResendEmail}
            disabled={!canResend || isResending}
            className="w-full"
          >
            {isResending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {canResend 
              ? t('resendEmail') 
              : `${t('resendIn')} ${countdown}${t('seconds')}`
            }
          </Button>

          <Button variant="ghost" onClick={onBack} className="w-full">
            {t('backToSignup')}
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          <p>{t('didntReceiveEmail')}</p>
          <p>{t('checkSpamFolder')}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailConfirmationPending;
