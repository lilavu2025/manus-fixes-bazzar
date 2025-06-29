import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PhoneAuth } from './PhoneAuth';
import { GoogleAuth } from './GoogleAuth';
import { useLanguage } from '@/utils/languageContextUtils';
import { Phone, Mail, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/useAuth';

export const AuthMethodsDemo: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { signIn, signUp } = useAuth();
  const [activeMethod, setActiveMethod] = useState<'email' | 'phone' | 'google'>('email');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPhoneAuth] = useState(false); // تعطيل مصادقة الهاتف مؤقتاً
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: ''
  });

  const handleSuccess = (message: string) => {
    console.log('Success:', message);
  };

  const handleError = (error: string) => {
    console.error('Error:', error);
  };

  const handleEmailAuth = async () => {
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(formData.email, formData.password, formData.fullName, formData.phone);
        handleSuccess(t('signupSuccess'));
      } else {
        await signIn(formData.email, formData.password);
        handleSuccess(t('loginSuccess'));
      }
    } catch (error: any) {
      handleError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl mb-2">{t('alternativeLogin')}</CardTitle>
          <div className="flex justify-center gap-2 mb-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {t('email')}
            </Badge>
            {showPhoneAuth && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {t('phone')} (معطل مؤقتاً)
              </Badge>
            )}
            <Badge variant="outline" className="flex items-center gap-1">
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={isSignUp ? 'signup' : 'login'} className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="login"
                onClick={() => setIsSignUp(false)}
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                {t('login')}
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                onClick={() => setIsSignUp(true)}
                className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
              >
                {t('signup')}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* أزرار اختيار طريقة المصادقة */}
          <div className={`grid gap-2 ${showPhoneAuth ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <Button
              variant={activeMethod === 'email' ? 'default' : 'outline'}
              onClick={() => setActiveMethod('email')}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              {t('email')}
            </Button>
            {showPhoneAuth && (
              <Button
                variant={activeMethod === 'phone' ? 'default' : 'outline'}
                onClick={() => setActiveMethod('phone')}
                className="flex items-center gap-2"
                disabled
              >
                <Phone className="h-4 w-4" />
                {t('phone')} (معطل)
              </Button>
            )}
            <Button
              variant={activeMethod === 'google' ? 'default' : 'outline'}
              onClick={() => setActiveMethod('google')}
              className="flex items-center gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>
          </div>

          {/* محتوى طرق المصادقة */}
          <div className="min-h-[400px]">
            {activeMethod === 'email' && (
              <div className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t('fullName')}</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder={t('fullName')}
                    />
                  </div>
                )}
                
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('phone')}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="05X-XXX-XXXX"
                      dir="ltr"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={t('email')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t('password')}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder={t('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute ltr:right-0 rtl:left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleEmailAuth}
                  disabled={loading || !formData.email || !formData.password}
                  className="w-full"
                >
                  {loading ? t('loading') : (isSignUp ? t('signup') : t('login'))}
                </Button>
              </div>
            )}

            {activeMethod === 'phone' && showPhoneAuth && (
              <PhoneAuth
                onSuccess={handleSuccess}
                onError={handleError}
                loading={loading}
                setLoading={setLoading}
              />
            )}

            {activeMethod === 'phone' && !showPhoneAuth && (
              <div className="flex items-center justify-center min-h-[300px]">
                <div className="text-center space-y-4">
                  <Phone className="mx-auto h-16 w-16 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-600">مصادقة الهاتف معطلة مؤقتاً</h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    تحتاج مصادقة الهاتف لحساب Twilio مدفوع لإرسال رسائل SMS.
                    يمكنك استخدام البريد الإلكتروني أو Google للمصادقة.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setActiveMethod('email')}
                  >
                    استخدم البريد الإلكتروني
                  </Button>
                </div>
              </div>
            )}

            {activeMethod === 'google' && (
              <div className="flex items-center justify-center min-h-[300px]">
                <GoogleAuth
                  onSuccess={handleSuccess}
                  onError={handleError}
                  loading={loading}
                  setLoading={setLoading}
                  isSignUp={isSignUp}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
