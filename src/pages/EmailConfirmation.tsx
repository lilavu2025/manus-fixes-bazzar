import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { useLanguage } from '@/utils/languageContextUtils';
import { toast } from 'sonner';

const EmailConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const { t, isRTL } = useLanguage();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        
        if (type === 'email_confirmation' && token) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email'
          });

          if (error) {
            console.error('Email confirmation error:', error);
            setStatus('error');
            setMessage(error.message);
            return;
          }

          if (data.user) {
            setStatus('success');
            setMessage(t('emailConfirmedSuccessfully'));
            toast.success(t('emailConfirmedSuccessfully'));
            
            // Auto redirect after successful confirmation
            setTimeout(() => {
              if (data.user && profile?.user_type === 'admin') {
                navigate('/admin');
              } else {
                navigate('/');
              }
            }, 2000);
          }
        } else {
          setStatus('error');
          setMessage(t('invalidConfirmationLink'));
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        setStatus('error');
        setMessage(t('unexpectedError'));
      }
    };

    // If user is already logged in, redirect based on their role
    if (user) {
      if (profile?.user_type === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
      return;
    }

    handleEmailConfirmation();
  }, [searchParams, navigate, user, profile, t]);

  const handleResendConfirmation = async () => {
    const email = searchParams.get('email');
    if (!email) {
      toast.error(t('emailNotFound'));
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t('confirmationEmailSent'));
      }
    } catch (error) {
      toast.error(t('unexpectedError'));
    }
  };

  const renderIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
      case 'expired':
        return <XCircle className="h-16 w-16 text-red-500" />;
      default:
        return <Mail className="h-16 w-16 text-gray-400" />;
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <CardTitle className="text-center">{t('confirmingEmail')}</CardTitle>
            <CardDescription className="text-center">
              {t('pleaseWait')}...
            </CardDescription>
          </>
        );
      case 'success':
        return (
          <>
            <CardTitle className="text-center text-green-600">
              {t('emailConfirmed')}
            </CardTitle>
            <CardDescription className="text-center">
              {message}
            </CardDescription>
            <p className="text-sm text-gray-500 text-center mt-2">
              {t('redirectingAutomatically')}...
            </p>
          </>
        );
      case 'error':
      case 'expired':
        return (
          <>
            <CardTitle className="text-center text-red-600">
              {t('confirmationFailed')}
            </CardTitle>
            <CardDescription className="text-center">
              {message}
            </CardDescription>
            <div className="flex flex-col gap-2 mt-4">
              <Button onClick={handleResendConfirmation} variant="outline">
                {t('resendConfirmation')}
              </Button>
              <Button onClick={() => navigate('/auth')} variant="default">
                {t('backToLogin')}
              </Button>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {renderIcon()}
            </div>
            {renderContent()}
          </CardHeader>
          <CardContent>
            {status === 'loading' && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailConfirmation;