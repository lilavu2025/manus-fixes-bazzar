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
        console.log("Immediate redirect after login to:", redirectParam);
        // استخدام navigate للتوجيه السلس
        navigate(`/${redirectParam}`, { replace: true });
        return; // منع التنفيذ الإضافي
      } else if (state && state.from) {
        navigate(state.from, { replace: true });
      } else {
        navigate("/");
      }
    }
  }, [user, loading, navigate, state, checkProfileCompleteness]);

  // التحقق من وجود بيانات مؤقتة عند تحميل الصفحة
  useEffect(() => {
    const tempUserData = localStorage.getItem('tempUserData');
    if (tempUserData && user) {
      console.log('Found temp user data on page load, user exists');
      // إذا كان المستخدم موجود والبيانات المؤقتة موجودة، 
      // هذا يعني أن OAuth نجح لكن البيانات لم تُطبق بعد
      setShowCompleteProfile(true);
    }
  }, [user]);

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
      enhancedToast.authSuccess('login');
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
      <div className="w-full max-w-md mx-auto relative">
        <div className="flex justify-center mb-6">
          <LanguageSwitcher />
        </div>

        {showEmailConfirmation ? (
          <EmailConfirmationPending
            email={pendingEmail}
            onBack={handleBackFromConfirmation}
          />
        ) : (
          <Card className="relative">
            {/* زر رجوع دائري صغير داخل الكرت بالطرف مع مسافة عن الحدود */}
            <button
              onClick={() => navigate(-1)}
              className="absolute top-4 ltr:left-4 rtl:right-4 w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-center shadow-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 z-10 border-4 border-white dark:border-neutral-900"
              aria-label={t("back")}
              type="button"
            >
              <svg
                className="h-5 w-5 rtl:rotate-180"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">م</span>
              </div>
              <CardTitle className="text-2xl">{t("storeName")}</CardTitle>
              <CardDescription>{t("storeDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 rounded-lg overflow-hidden shadow">
                  <TabsTrigger
                    value="login"
                    className="text-base font-semibold flex items-center justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                  >
                    {t("login") || "تسجيل الدخول"}
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="text-base font-semibold flex items-center justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                  >
                    {t("signup") || "إنشاء حساب"}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  {authMethod === 'email' && (
                    <form onSubmit={handleLogin} className="space-y-4">
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

                  {/* طرق المصادقة البديلة */}
                  <div className="mt-6 space-y-3">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          {t("orLoginWith")}
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
                </TabsContent>

                <TabsContent value="signup">
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

                  {/* طرق المصادقة البديلة */}
                  <div className="mt-6 space-y-3">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          {t("orSignupWith")}
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
          // إعادة تشغيل useEffect للتوجيه بعد إكمال البيانات
          window.location.reload();
        }}
      />
    </div>
  );
};

export default Auth;
