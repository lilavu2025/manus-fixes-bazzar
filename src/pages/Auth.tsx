import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/useAuth';
import { useLanguage } from '@/utils/languageContextUtils';
import { useToast } from '@/hooks/use-toast';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import EmailConfirmationPending from '@/components/EmailConfirmationPending';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, loading } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidPhone = (phone: string) =>
    /^05\d{8}$/.test(phone);

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!isValidEmail(loginData.email)) {
        throw new Error(t('invalidEmail'));
      }

      if (loginData.password.length < 6) {
        throw new Error(t('passwordTooShort'));
      }

      await signIn(loginData.email, loginData.password);
      toast({
        title: t('success'),
        description: t('loginSuccess'),
      });
    } catch (error: unknown) {
      console.error('Login error:', error);
      if (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: string }).message === 'string' && (error as { message: string }).message.includes('Email not confirmed')) {
        toast({
          title: t('error'),
          description: t('emailNotConfirmed'),
        });
      } else {
        toast({
          title: t('error'),
          description: typeof error === 'object' && error && 'message' in error ? (error as { message?: string }).message || t('loginError') : t('loginError'),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!isValidEmail(signupData.email)) {
        throw new Error(t('invalidEmail'));
      }

      if (signupData.password.length < 6) {
        throw new Error(t('passwordTooShort'));
      }

      if (signupData.password !== signupData.confirmPassword) {
        throw new Error(t('passwordMismatch'));
      }

      if (!isValidPhone(signupData.phone)) {
        throw new Error(t('invalidPhone'));
      }

      await signUp(signupData.email, signupData.password, signupData.fullName, signupData.phone);
      
      // Show email confirmation screen
      setPendingEmail(signupData.email);
      setShowEmailConfirmation(true);

      toast({
        title: t('success'),
        description: t('signupSuccess'),
      });
    } catch (error: unknown) {
      console.error('Signup error:', error);
      toast({
        title: t('error'),
        description: typeof error === 'object' && error && 'message' in error ? (error as { message?: string }).message || t('signupError') : t('signupError'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackFromConfirmation = () => {
    setShowEmailConfirmation(false);
    setPendingEmail('');
    // Reset signup form
    setSignupData({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      phone: '',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <LanguageSwitcher />
        </div>

        {showEmailConfirmation ? (
          <EmailConfirmationPending
            email={pendingEmail}
            onBack={handleBackFromConfirmation}
          />
        ) : (
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">م</span>
              </div>
              <CardTitle className="text-2xl">{t('storeName')}</CardTitle>
              <CardDescription>{t('storeDescription')}</CardDescription>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">{t('login')}</TabsTrigger>
                  <TabsTrigger value="signup">{t('signup')}</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">{t('email')}</Label>
                      <Input
                        id="login-email"
                        name="login-email"
                        type="email"
                        autoComplete="username"
                        value={loginData.email}
                        onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">{t('password')}</Label>
                      <Input
                        id="login-password"
                        name="login-password"
                        type="password"
                        autoComplete="current-password"
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? t('loading') : t('login')}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">{t('fullName')}</Label>
                      <Input
                        id="signup-name"
                        name="signup-name"
                        type="text"
                        autoComplete="name"
                        value={signupData.fullName}
                        onChange={(e) => setSignupData(prev => ({ ...prev, fullName: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-phone">{t('phone')}</Label>
                      <Input
                        id="signup-phone"
                        name="signup-phone"
                        type="tel"
                        autoComplete="tel"
                        value={signupData.phone}
                        onChange={(e) => setSignupData(prev => ({ ...prev, phone: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">{t('email')}</Label>
                      <Input
                        id="signup-email"
                        name="signup-email"
                        type="email"
                        autoComplete="email"
                        value={signupData.email}
                        onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">{t('password')}</Label>
                      <Input
                        id="signup-password"
                        name="signup-password"
                        type="password"
                        autoComplete="new-password"
                        value={signupData.password}
                        onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm">{t('confirmPassword')}</Label>
                      <Input
                        id="signup-confirm"
                        name="signup-confirm"
                        type="password"
                        autoComplete="new-password"
                        value={signupData.confirmPassword}
                        onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? t('loading') : t('signup')}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Auth;
