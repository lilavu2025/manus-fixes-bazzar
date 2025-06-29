import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext.context";
import { useEnhancedToast } from "@/hooks/useEnhancedToast";
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/integrations/supabase/types";
import { setCookie, getCookie, deleteCookie } from "@/utils/commonUtils";
import {
  useSignIn,
  useSignUp,
  useSignOut,
  useUpdateProfile,
} from "@/integrations/supabase/reactQueryHooks";
import { fetchUserProfile } from "@/integrations/supabase/dataFetchers";
import { supabase } from "@/integrations/supabase/client";
import { createProfile } from "@/integrations/supabase/dataSenders";
import type { Session } from "@supabase/auth-js";

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  email?: string;
  user_type: "admin" | "wholesale" | "retail";
  created_at?: string;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const sessionRef = useRef<Session | null>(null);
  const lastSessionCheck = useRef<number>(Date.now());
  const hasShownToastRef = useRef<boolean>(false); // منع تكرار Toast
  const enhancedToast = useEnhancedToast();

  // hooks
  const signInMutation = useSignIn();
  const signUpMutation = useSignUp();
  const signOutMutation = useSignOut();
  const updateProfileMutation = useUpdateProfile();

  // حفظ آخر صفحة زارها المستخدم (عدا صفحات auth)
  useEffect(() => {
    if (
      location.pathname !== "/auth" &&
      location.pathname !== "/email-confirmation"
    ) {
      setCookie(
        "lastVisitedPath",
        location.pathname + location.search + location.hash,
        60 * 60 * 24 * 30,
      );
    }
  }, [location.pathname, location.search, location.hash]);

  // توجيه الأدمن دائمًا للوحة الإدارة بعد تسجيل الدخول
  const handleUserRedirection = useCallback(
    (profile: Profile) => {
      if (profile.user_type === "admin") {
        const lastVisitedPath = getCookie("lastVisitedPath");
        if (
          lastVisitedPath &&
          lastVisitedPath.startsWith("/admin") &&
          lastVisitedPath !== "/auth"
        ) {
          if (location.pathname !== lastVisitedPath) {
            navigate(lastVisitedPath, { replace: true });
          }
        } else if (!location.pathname.startsWith("/admin")) {
          navigate("/admin", { replace: true });
        }
        return;
      }
      if (profile.user_type === "wholesale") {
        navigate("/", { replace: true });
        return;
      }
      navigate("/", { replace: true });
    },
    [navigate, location.pathname],
  );

  // جلب بيانات البروفايل بناءً على session
  const fetchAndSetProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const profileData = await fetchUserProfile(userId);
    if (profileData) setProfile(profileData);
    else setProfile(null);
  }, []);

  // التحقق من اكتمال بيانات المستخدم بعد Google OAuth
  const checkProfileCompleteness = useCallback((profile: Profile | null) => {
    if (!profile) return false;
    
    // التحقق من وجود الاسم الكامل ورقم الهاتف
    const isComplete = profile.full_name && 
                      profile.full_name.trim().length > 1 && 
                      profile.phone && 
                      profile.phone.trim().length > 0;
    
    return isComplete;
  }, []);

  // إكمال البيانات الناقصة للمستخدم الذي سجل عبر Google
  const completeGoogleProfile = async (fullName: string, phone: string) => {
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        // التأكد من أن البيانات صحيحة قبل الإرسال
        const updates = {
          full_name: fullName?.trim() || null,
          phone: phone?.trim() || null,
          email_confirmed_at: new Date().toISOString() // تأكيد الإيميل للتسجيل عبر Google
        };
        
        const result = await updateProfileMutation.mutateAsync({
          userId: session.user.id,
          updates
        });
        
        // انتظار قصير لضمان تطبيق التحديث في قاعدة البيانات
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // إعادة جلب البيانات لتحديث الحالة
        await fetchAndSetProfile(session.user.id);
        
        // التوجيه بعد إكمال البيانات - انتظار قصير للتأكد من تحديث الحالة
        setTimeout(() => {
          const updatedProfile = { 
            ...profile!, 
            full_name: fullName?.trim() || null,
            phone: phone?.trim() || null 
          };
          handleUserRedirection(updatedProfile);
        }, 500);
        
        // إذا وصلنا هنا، العملية نجحت
        return;
        
      } catch (error) {
        retryCount++;
        
        if (retryCount >= maxRetries) {
          throw error;
        }
        
        // انتظار قبل المحاولة التالية
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
  };

  // تسجيل الدخول
  const signIn = async (email: string, password: string) => {
    const data = await signInMutation.mutateAsync({ email, password });
    setCookie("lastLoginTime", Date.now().toString(), 60 * 60 * 24 * 30);
    if (data && data.user && data.user.id) {
      await fetchAndSetProfile(data.user.id);
      handleUserRedirection({ ...profile!, id: data.user.id });
    }
    if (data.session) setSession(data.session);
  };

  // تسجيل حساب جديد
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
  ) => {
    const data = await signUpMutation.mutateAsync({
      email,
      password,
      fullName,
      phone,
    });
    if (!data.user) {
      throw new Error("فشل في إنشاء الحساب. يرجى المحاولة مرة أخرى.");
    }
    if (data.user.id) {
      try {
        // تنظيف رقم الهاتف قبل الإرسال
        const cleanPhone = phone && phone.trim() !== '' ? phone.trim() : null;
        
        await createProfile({
          id: data.user.id,
          email,
          full_name: fullName,
          phone: cleanPhone,
          user_type: "retail",
        });
        await fetchAndSetProfile(data.user.id);
        handleUserRedirection({ ...profile!, id: data.user.id });
      } catch (e) {
        console.error("Profile creation error:", e);
        /* ignore if profile exists, but log other errors */
      }
    }
    if (!data.session) {
      throw new Error(
        "تم إرسال رابط التأكيد إلى بريدك الإلكتروني. يرجى التحقق من بريدك الإلكتروني وتأكيد حسابك.",
      );
    }
    setSession(data.session);
  };

  // تسجيل الخروج
  const signOut = async () => {
    await signOutMutation.mutateAsync();
    setProfile(null);
    setSession(null);
    hasShownToastRef.current = false; // إعادة تعيين التوست عند تسجيل الخروج
    deleteCookie("lastLoginTime");
    deleteCookie("lastVisitedPath");
    navigate("/", { replace: true });
  };

  // تحديث ملف المستخدم
  const updateProfile = async (data: Partial<Profile>) => {
    if (!profile) throw new Error("المستخدم غير مسجل الدخول");
    await updateProfileMutation.mutateAsync({
      userId: profile.id,
      updates: data,
    });
    setProfile((prev) => (prev ? { ...prev, ...data } : null));
  };

  // تسجيل الدخول بالهاتف
  const signInWithPhone = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        shouldCreateUser: true,
      }
    });
    if (error) throw error;
  };

  // التحقق من رمز الهاتف
  const verifyPhoneOtp = async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    });
    if (error) throw error;
    
    if (data.user) {
      await fetchAndSetProfile(data.user.id);
      handleUserRedirection({ ...profile!, id: data.user.id });
    }
    if (data.session) setSession(data.session);
  };

  // تسجيل الدخول بـ Google
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    if (error) throw error;
  };

  // مراقبة جلسة supabase وتحديث البروفايل تلقائياً
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!ignore) {
        setSession(session);
        sessionRef.current = session;
        fetchAndSetProfile(session?.user?.id);
        setLoading(false);
      }
    });
    // مراقبة تغيّر حالة المصادقة، وعند وجود مستخدم جديد يتم جلب بياناته بعد التأكد من وجود session.user باستخدام setTimeout
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        sessionRef.current = session;
        
        if (session?.user?.id && !hasShownToastRef.current) {
          setTimeout(async () => {
            // جلب البروفايل عبر الدالة المخصصة فقط (وليس مباشرة من قاعدة البيانات)
            await fetchAndSetProfile(session.user.id);
            
            if (event === 'SIGNED_IN' && !hasShownToastRef.current) {
              // التحقق من أن المستخدم لديه بيانات كاملة
              const currentProfile = await fetchUserProfile(session.user.id);
              
              if (currentProfile && currentProfile.full_name && currentProfile.phone) {
                // مستخدم موجود مع بيانات كاملة - تسجيل دخول عادي
                enhancedToast.authSuccess('login');
                handleUserRedirection(currentProfile);
              } else {
                // مستخدم جديد أو ناقص البيانات - يحتاج إكمال البيانات
                enhancedToast.authSuccess('signup');
                // ستظهر نافذة إكمال البيانات تلقائياً في صفحة Auth
              }
              hasShownToastRef.current = true;
            }
          }, 1000); // زيادة الانتظار لضمان اكتمال العمليات
        } else if (!session?.user?.id) {
          setProfile(null);
          hasShownToastRef.current = false; // إعادة تعيين التوست عند تسجيل الخروج
        }
      },
    );
    return () => {
      ignore = true;
      listener.subscription.unsubscribe();
    };
  }, [fetchAndSetProfile]);

  // التعامل مع انتهاء التوكن أو انقطاع الجلسة
  const checkSessionValidity = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session || !data.session.user) {
      setProfile(null);
      setSession(null);
      return;
    }
    setSession(data.session);
    sessionRef.current = data.session;
    await fetchAndSetProfile(data.session.user.id);
  }, [fetchAndSetProfile]);

  // refetch عند click/focus/visibilitychange
  useEffect(() => {
    const refetchSession = async (source?: string) => {
      // لا تكرر الفحص أكثر من مرة كل 3 ثواني
      if (Date.now() - lastSessionCheck.current < 3000) return;
      lastSessionCheck.current = Date.now();
      await checkSessionValidity();
    };
    const clickHandler = () => refetchSession("click");
    const focusHandler = () => refetchSession("focus");
    const visibilityHandler = () => {
      if (document.visibilityState === "visible") {
        refetchSession("visibilitychange");
      }
    };
    document.addEventListener("click", clickHandler, true);
    window.addEventListener("focus", focusHandler);
    document.addEventListener("visibilitychange", visibilityHandler);
    return () => {
      document.removeEventListener("click", clickHandler, true);
      window.removeEventListener("focus", focusHandler);
      document.removeEventListener("visibilitychange", visibilityHandler);
    };
  }, [checkSessionValidity]);

  // فحص عام لاكتمال بيانات المستخدم - إجباري للوصول لأي صفحة
  useEffect(() => {
    // تجاهل الفحص في صفحات معينة أو أثناء التحميل
    if (loading || 
        location.pathname === "/auth" || 
        location.pathname === "/email-confirmation" ||
        !session?.user?.id ||
        !profile) {
      return;
    }

    // التحقق من اكتمال البيانات
    if (!checkProfileCompleteness(profile)) {
      // توجيه إجباري لصفحة Auth لإكمال البيانات
      if (location.pathname !== "/auth") {
        navigate("/auth", { replace: true });
      }
    }
  }, [profile, session, loading, location.pathname, navigate, checkProfileCompleteness]);

  const value = {
    user: profile,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    signInWithPhone,
    verifyPhoneOtp,
    signInWithGoogle,
    checkProfileCompleteness,
    completeGoogleProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export type AuthContextType = {
  user: Profile | null;
  session: unknown;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  signInWithPhone: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  checkProfileCompleteness: (profile: Profile | null) => boolean;
  completeGoogleProfile: (fullName: string, phone: string) => Promise<void>;
};
