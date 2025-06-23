import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext.context";
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/integrations/supabase/types";
import { setCookie, getCookie, deleteCookie } from "../utils/cookieUtils";
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
        await createProfile({
          id: data.user.id,
          email,
          full_name: fullName,
          phone: phone || "",
          user_type: "retail",
        });
        await fetchAndSetProfile(data.user.id);
        handleUserRedirection({ ...profile!, id: data.user.id });
      } catch (e) {
        /* ignore if profile exists */
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
      async (_, session) => {
        setSession(session);
        sessionRef.current = session;
        if (session?.user?.id) {
          setTimeout(async () => {
            // جلب البروفايل عبر الدالة المخصصة فقط (وليس مباشرة من قاعدة البيانات)
            await fetchAndSetProfile(session.user.id);
          });
        } else {
          setProfile(null);
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

  const value = {
    user: profile,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
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
};
