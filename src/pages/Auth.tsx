import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/useAuth";
import { useLanguage } from "@/utils/languageContextUtils";
import { useEnhancedToast } from "@/hooks/useEnhancedToast";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import EmailConfirmationPending from "@/components/EmailConfirmationPending";
import { PhoneAuth } from "@/components/PhoneAuth";
import { GoogleSignupForm } from "@/components/GoogleSignupForm";
import { CompleteProfileAfterGoogle } from "@/components/CompleteProfileAfterGoogle";
import { getCookie } from "@/utils/commonUtils";
import config from "@/configs/activeConfig";

const primary = config.visual.primaryColor;
const secondary = config.visual.secondaryColor;
const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, loading, checkProfileCompleteness } = useAuth();
  const { t, isRTL } = useLanguage();
  const enhancedToast = useEnhancedToast();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
  });

  const [signupErrors, setSignupErrors] = useState<{ [key: string]: string }>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [authMethod, setAuthMethod] = useState<'email' | 'phone' | 'google'>('email');
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [showPhoneAuth] = useState(false); // تعطيل مصادقة الهاتف مؤقتاً

  const location = window.location;
  const state = (window.history.state && window.history.state.usr && window.history.state.usr.from) ? window.history.state.usr : undefined;

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidPhone = (phone: string) => /^05\d{8}$/.test(phone);

  const { primaryColor, secondaryColor } = config.visual;
  
  useEffect(() => {
    if (user && !loading) {
      // التحقق من اكتمال البيانات للمستخدمين الذين سجلوا عبر Google
      if (!checkProfileCompleteness(user)) {
        setShowCompleteProfile(true);
        return; // لا نتابع التوجيه حتى يكمل البيانات
      }

      // الحصول على redirect parameter من URL
      const urlParams = new URLSearchParams(window.location.search);
      const redirectParam = urlParams.get('redirect');
      
      if (user.user_type === "admin") {
        const lastVisitedPath = getCookie("lastVisitedPath");
        if (
          lastVisitedPath &&
          lastVisitedPath.startsWith("/admin") &&
          lastVisitedPath !== "/auth" &&
          window.location.pathname !== lastVisitedPath
        ) {
          navigate(lastVisitedPath, { replace: true });
        } else if (!window.location.pathname.startsWith("/admin")) {
          navigate("/admin", { replace: true });
        }
      } else if (redirectParam) {
        // التوجه للصفحة المحددة في redirect parameter فوراً
        navigate(`/${redirectParam}`, { replace: true });
        return; // منع التنفيذ الإضافي
      } else if (state && state.from) {
        navigate(state.from, { replace: true });
      } else {
        navigate("/");
      }
    }
  }, [user, loading, navigate, state, checkProfileCompleteness]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!isValidEmail(loginData.email)) {
        throw new Error(t("invalidEmail"));
      }

      if (loginData.password.length < 6) {
        throw new Error(t("passwordTooShort"));
      }

      await signIn(loginData.email, loginData.password);
      // Success message will be handled by AuthContext onAuthStateChange
    } catch (error: unknown) {
      console.error("Login error:", error);
      if (
        typeof error === "object" &&
        error &&
        "message" in error &&
        typeof (error as { message?: string }).message === "string" &&
        (error as { message: string }).message.includes(t("emailNotConfirmed"))
      ) {
        enhancedToast.authError('emailNotConfirmed');
      } else {
        const errorMessage = typeof error === "object" && error && "message" in error
          ? (error as { message?: string }).message
          : undefined;
        
        if (errorMessage === "Invalid login credentials") {
          enhancedToast.authError('invalidCredentials');
        } else {
          enhancedToast.authError('login', errorMessage);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSignupErrors({});
    try {
      if (!isValidEmail(signupData.email)) {
        setSignupErrors({ email: t("invalidEmail") });
        throw new Error(t("invalidEmail"));
      }
      if (signupData.password.length < 6) {
        setSignupErrors({ password: t("passwordTooShort") });
        throw new Error(t("passwordTooShort"));
      }
      if (signupData.password !== signupData.confirmPassword) {
        setSignupErrors({ confirmPassword: t("passwordMismatch") });
        throw new Error(t("passwordMismatch"));
      }
      if (!isValidPhone(signupData.phone)) {
        setSignupErrors({ phone: t("invalidPhone") });
      }
      
      console.log("Starting signup process for:", signupData.email);
      
      await signUp(
        signupData.email,
        signupData.password,
        signupData.fullName,
        signupData.phone,
      );
      setPendingEmail(signupData.email);
      setShowEmailConfirmation(true);
      enhancedToast.authSuccess('signup');
    } catch (error: unknown) {
      console.error("Signup error details:", error);
      
      // Enhanced error reporting for debugging
      if (error && typeof error === 'object') {
        const err = error as any;
        console.group("🚨 Detailed Error Information");
        console.log("Error message:", err.message);
        console.log("Error code:", err.code);
        console.log("Error details:", err.details);
        console.log("Error hint:", err.hint);
        console.log("Full error object:", err);
        console.groupEnd();
      }
      
      const errorMsg =
        typeof error === "object" && error && "message" in error
          ? (error as { message?: string }).message || "signupError"
          : "signupError";
          
      // Check for specific database errors
      if (errorMsg.includes("Database error saving new user")) {
        enhancedToast.error("Database configuration issue. Please check your Supabase setup.", {
          description: "This error usually indicates RLS policy or table configuration issues.",
          duration: 8000
        });
      } else if (
        errorMsg.toLowerCase().includes("confirmation") ||
        errorMsg.toLowerCase().includes("تحقق") ||
        errorMsg.toLowerCase().includes("confirm")
      ) {
        enhancedToast.success('emailConfirmationSent');
      } else {
        enhancedToast.authError('signup', errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (message: string) => {
    enhancedToast.success(message);
  };

  const handleAuthError = (error: string) => {
    enhancedToast.error(error);
  };

  const handleBackFromConfirmation = () => {
    setShowEmailConfirmation(false);
    setPendingEmail("");
    // Reset signup form
    setSignupData({
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      phone: "",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gray-50 flex items-center justify-center px-2 sm:px-4 ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* حاوية الكرت */}
      <div className="w-full max-w-md mx-auto relative">
        {/* سويتشر اللغة */}
        <div className="flex justify-center mb-6">
          <LanguageSwitcher />
        </div>

        {/* تأكيد الإيميل */}
        {showEmailConfirmation ? (
          <EmailConfirmationPending
            email={pendingEmail}
            onBack={handleBackFromConfirmation}
          />
        ) : (
          <Card className="relative">
            {/* // زر الرجوع الدائري */}
            {/* زر رجوع دائري صغير داخل الكرت بالطرف مع مسافة عن الحدود */}
            <button
              onClick={() => navigate(-1)}
              className="absolute top-4 ltr:left-4 rtl:right-4 w-10 h-10 rounded-full text-white flex items-center justify-center shadow-md transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--secondary] z-10 border-4 border-white dark:border-neutral-900"
              style={{ background: `linear-gradient(135deg, ${primaryColor})` }}
              aria-label={t("back")}
              type="button"
            >
              <svg
                className="h-5 w-5 rtl:rotate-180"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* رأس الكرت: لوجو واسم المتجر */}
            <CardHeader className="text-center">
              <div className="w-24 h-24 bg-gradient-to-r [hsl(var(--primary))] to-[hsl(var(--secondary))] text-[hsl(var(--primary-foreground))] rounded-full flex items-center justify-center mx-auto mb-4">
                <img
                  src={config.visual.logo}
                  alt={t('storeName')}
                  className="w-24 h-24 sm:w-24 sm:h-24 rounded-lg object-contain bg-white shadow"
                />
              </div>
              <CardTitle className="text-2xl">{t("storeName")}</CardTitle>
              <CardDescription>{t("storeDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* تبويبات تسجيل الدخول/التسجيل */}
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 rounded-lg overflow-hidden shadow">
                  {/* تبويب تسجيل الدخول */}
                  <TabsTrigger
                    value="login"
                    className="text-base font-semibold flex items-center justify-center px-4 py-2 transition-all duration-200
                              bg-white text-[color:var(--secondaryColor)]
                              data-[state=active]:bg-gradient-to-r
                              data-[state=active]:from-[var(--primaryColor)]
                              data-[state=active]:to-[var(--secondaryColor)]
                              data-[state=active]:text-white
                              data-[state=active]:shadow-md"
                    style={{
                      '--primaryColor': config.visual.primaryColor,
                      '--secondaryColor': config.visual.secondaryColor,
                    } as React.CSSProperties}
                  >
                    {t("login") || "تسجيل الدخول"}
                  </TabsTrigger>
                  {/* تبويب إنشاء حساب */}
                  <TabsTrigger
                    value="signup"
                    className="text-base font-semibold flex items-center justify-center px-4 py-2 transition-all duration-200
                              bg-white text-[color:var(--secondaryColor)]
                              data-[state=active]:bg-gradient-to-r
                              data-[state=active]:from-[var(--primaryColor)]
                              data-[state=active]:to-[var(--secondaryColor)]
                              data-[state=active]:text-white
                              data-[state=active]:shadow-md"
                    style={{
                      '--primaryColor': config.visual.primaryColor,
                      '--secondaryColor': config.visual.secondaryColor,
                    } as React.CSSProperties}
                  >
                    {t("signup") || "إنشاء حساب"}
                  </TabsTrigger>
                </TabsList>

                {/* محتوى تبويب تسجيل الدخول */}
                <TabsContent value="login">

                  {/* طرق المصادقة البديلة */}
                  <div className="mt-6 space-y-3 mb-5">
                    {/* فاصل نصي */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          {t("loginWith")}
                        </span>
                      </div>
                    </div>

                    {/* أزرار اختيار طريقة الدخول (إيميل/هاتف/جوجل) */}
                    <div className={`grid gap-2 ${showPhoneAuth ? 'grid-cols-3' : 'grid-cols-2'}`}>
                      {/* زر اختيار الإيميل */}
                      <Button
                        variant={authMethod === 'email' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAuthMethod('email')}
                        className="text-xs"
                      >
                        {t("email")}
                      </Button>
                      {/* زر اختيار الهاتف */}
                      {showPhoneAuth && (
                        <Button
                          variant={authMethod === 'phone' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAuthMethod('phone')}
                          className="text-xs"
                        >
                          {t("phone")}
                        </Button>
                      )}
                      {/* زر جوجل */}
                      <Button
                        variant={authMethod === "google" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAuthMethod("google")}
                        className="text-xs px-4 py-2 flex items-center gap-2"
                        aria-pressed={authMethod === "google"}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 48 48"
                          className="w-4 h-4"
                        >
                          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C34 32.2 29.6 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l6-6C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20.1-7.5 20.1-21 0-1.3-.1-2.5-.5-3.5z" />
                          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.3 16 18.8 13 24 13c3.1 0 5.9 1.2 8 3.1l6-6C34.5 5.1 29.5 3 24 3 16 3 9.1 7.6 6.3 14.7z" />
                          <path fill="#4CAF50" d="M24 45c5.3 0 10.2-1.8 14-4.9l-6.5-5.3C29.9 36.9 27.1 38 24 38c-5.5 0-10-3.7-11.6-8.7l-6.6 5C9 41.2 15.9 45 24 45z" />
                          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.2 3.4-3.8 6.1-7.3 7.6l6.5 5.3C38.4 37.4 43 31.4 43.6 20.5z" />
                        </svg>
                        Google
                      </Button>
                    </div>
                  </div>

                  {/* نموذج تسجيل الدخول بالإيميل */}
                  {authMethod === 'email' && (
                    <form onSubmit={handleLogin} className="space-y-4">
                      {/* حقل الإيميل */}
                      <div className="space-y-2">
                        <Label htmlFor="login-email">{t("email")}</Label>
                        <Input
                          id="login-email"
                          name="login-email"
                          type="email"
                          autoComplete="username"
                          value={loginData.email}
                          onChange={(e) =>
                            setLoginData((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      {/* حقل كلمة المرور */}
                      <div className="space-y-2">
                        <Label htmlFor="login-password">{t("password")}</Label>
                        <Input
                          id="login-password"
                          name="login-password"
                          type="password"
                          autoComplete="current-password"
                          value={loginData.password}
                          onChange={(e) =>
                            setLoginData((prev) => ({
                              ...prev,
                              password: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      {/* زر تسجيل الدخول */}
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? t("loading") : t("login")}
                      </Button>
                    </form>
                  )}

                  {authMethod === 'phone' && showPhoneAuth && (
                    <PhoneAuth
                      onSuccess={handleAuthSuccess}
                      onError={handleAuthError}
                      loading={isLoading}
                      setLoading={setIsLoading}
                    />
                  )}

                  {authMethod === 'google' && (
                    <div className="space-y-4">
                      <GoogleSignupForm
                        onSuccess={handleAuthSuccess}
                        onError={handleAuthError}
                        loading={isLoading}
                        setLoading={setIsLoading}
                        isSignUp={false}
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="signup">
                  {/* طرق المصادقة البديلة */}
                  <div className="mt-6 space-y-3 mb-5">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          {t("signupWith")}
                        </span>
                      </div>
                    </div>

                    <div className={`grid gap-2 ${showPhoneAuth ? 'grid-cols-3' : 'grid-cols-2'}`}>
                      <Button
                        variant={authMethod === 'email' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAuthMethod('email')}
                        className="text-xs"
                      >
                        {t("email")}
                      </Button>
                      {showPhoneAuth && (
                        <Button
                          variant={authMethod === 'phone' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAuthMethod('phone')}
                          className="text-xs"
                        >
                          {t("phone")}
                        </Button>
                      )}
                      <Button
                        variant={authMethod === 'google' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAuthMethod('google')}
                        className="text-xs"
                      >
                        Google
                      </Button>
                    </div>
                  </div>

                  {authMethod === 'email' && (
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">{t("fullName")}</Label>
                        <Input
                          id="signup-name"
                          name="signup-name"
                          type="text"
                          autoComplete="name"
                          value={signupData.fullName}
                          onChange={(e) =>
                            setSignupData((prev) => ({
                              ...prev,
                              fullName: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-phone">{t("phone")}</Label>
                        <Input
                          id="signup-phone"
                          name="signup-phone"
                          type="tel"
                          autoComplete="tel"
                          value={signupData.phone}
                          onChange={(e) =>
                            setSignupData((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                          required
                          aria-invalid={!!signupErrors.phone}
                          aria-describedby="signup-phone-error"
                        />
                        {signupErrors.phone && (
                          <span
                            id="signup-phone-error"
                            className="text-xs text-red-600 block mt-1"
                          >
                            {signupErrors.phone}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">{t("email")}</Label>
                        <Input
                          id="signup-email"
                          name="signup-email"
                          type="email"
                          autoComplete="email"
                          value={signupData.email}
                          onChange={(e) =>
                            setSignupData((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password">{t("password")}</Label>
                        <Input
                          id="signup-password"
                          name="signup-password"
                          type="password"
                          autoComplete="new-password"
                          value={signupData.password}
                          onChange={(e) =>
                            setSignupData((prev) => ({
                              ...prev,
                              password: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm">
                          {t("confirmPassword")}
                        </Label>
                        <Input
                          id="signup-confirm"
                          name="signup-confirm"
                          type="password"
                          autoComplete="new-password"
                          value={signupData.confirmPassword}
                          onChange={(e) =>
                            setSignupData((prev) => ({
                              ...prev,
                              confirmPassword: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      // زر إنشاء حساب جديد
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? t("loading") : t("signup")}
                      </Button>
                    </form>
                  )}

                  {authMethod === 'phone' && showPhoneAuth && (
                    <PhoneAuth
                      onSuccess={handleAuthSuccess}
                      onError={handleAuthError}
                      loading={isLoading}
                      setLoading={setIsLoading}
                    />
                  )}

                  {authMethod === 'google' && (
                    <div className="space-y-4">
                      <GoogleSignupForm
                        onSuccess={handleAuthSuccess}
                        onError={handleAuthError}
                        loading={isLoading}
                        setLoading={setIsLoading}
                        isSignUp={true}
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
        
      </div>
      
      {/* نافذة إكمال البيانات بعد Google OAuth */}
      <CompleteProfileAfterGoogle
        open={showCompleteProfile}
        onCompleted={() => {
          setShowCompleteProfile(false);
          // التوجيه سيحدث تلقائياً في AuthContext بعد إكمال البيانات
        }}
      />
    </div>
  );
};

export default Auth;
