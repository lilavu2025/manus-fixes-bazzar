import React from 'react';
import { AuthMethodsDemo } from '@/components/AuthMethodsDemo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/utils/languageContextUtils';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const AuthTest: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen bg-gray-50 py-8 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4">
        {/* العودة للصفحة الرئيسية */}
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2"
        >
          {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          {t('home')}
        </Button>

        {/* معلومات عن الميزات الجديدة */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-4">
              🎉 ميزات المصادقة الجديدة
            </CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
                <Badge variant="secondary" className="mb-2 bg-blue-100 text-blue-800">
                  📧 البريد الإلكتروني
                </Badge>
                <p className="text-sm text-center">
                  المصادقة التقليدية باستخدام البريد الإلكتروني وكلمة المرور
                </p>
              </div>
              
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg opacity-60">
                <Badge variant="secondary" className="mb-2 bg-gray-100 text-gray-600">
                  📱 رقم الهاتف (معطل مؤقتاً)
                </Badge>
                <p className="text-sm text-center text-gray-500">
                  تحتاج لحساب Twilio مدفوع - معطلة حالياً
                </p>
              </div>
              
              <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
                <Badge variant="secondary" className="mb-2 bg-red-100 text-red-800">
                  🔍 Google OAuth
                </Badge>
                <p className="text-sm text-center">
                  تسجيل الدخول بنقرة واحدة باستخدام حساب Google
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ ملاحظات مهمة:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• ❌ مصادقة الهاتف معطلة مؤقتاً (تحتاج حساب Twilio مدفوع)</li>
                <li>• ✅ Google OAuth متاح للاستخدام</li>
                <li>• ✅ البريد الإلكتروني يعمل بشكل طبيعي</li>
                <li>• راجع ملف AUTH_SETUP.md لتفعيل مصادقة الهاتف لاحقاً</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">🔧 للمطورين:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• كود المصادقة في: <code className="bg-blue-100 px-1 rounded">src/components/PhoneAuth.tsx</code></li>
                <li>• مكون Google OAuth: <code className="bg-blue-100 px-1 rounded">src/components/GoogleAuth.tsx</code></li>
                <li>• تحديث AuthContext: <code className="bg-blue-100 px-1 rounded">src/contexts/AuthContext.tsx</code></li>
                <li>• صفحة المصادقة المحدثة: <code className="bg-blue-100 px-1 rounded">src/pages/Auth.tsx</code></li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* مكون عرض طرق المصادقة */}
        <AuthMethodsDemo />
        
        {/* روابط مفيدة */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-center">روابط مفيدة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/auth')}
                className="flex items-center gap-2"
              >
                🔐 صفحة المصادقة الرسمية
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                className="flex items-center gap-2"
              >
                ⚙️ لوحة تحكم Supabase
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.open('https://console.cloud.google.com', '_blank')}
                className="flex items-center gap-2"
              >
                🌐 Google Cloud Console
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.open('https://www.twilio.com', '_blank')}
                className="flex items-center gap-2"
              >
                📱 Twilio Console
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthTest;
