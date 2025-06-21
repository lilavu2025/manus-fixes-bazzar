import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from './AuthContext.context';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { setCookie, getCookie, deleteCookie } from '../utils/cookieUtils';
import {
  useSignIn,
  useSignUp,
  useSignOut,
  useUpdateProfile,
} from '@/integrations/supabase/reactQueryHooks';
import { fetchUserProfile } from '@/integrations/supabase/dataFetchers';
import { supabase } from '@/integrations/supabase/client';
import { createProfile } from '@/integrations/supabase/dataSenders';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  email?: string;
  user_type: 'admin' | 'wholesale' | 'retail';
  created_at?: string;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // hooks
  const signInMutation = useSignIn();
  const signUpMutation = useSignUp();
  const signOutMutation = useSignOut();
  const updateProfileMutation = useUpdateProfile();

  useEffect(() => {
    setProfile(null);
    setLoading(false);
  }, []);

  // حفظ آخر صفحة زارها المستخدم (عدا صفحات auth)
  useEffect(() => {
    if (
      location.pathname !== '/auth' &&
      location.pathname !== '/email-confirmation'
    ) {
      setCookie('lastVisitedPath', location.pathname + location.search + location.hash, 60 * 60 * 24 * 30);
    }
  }, [location.pathname, location.search, location.hash]);

  // توجيه الأدمن دائمًا للوحة الإدارة بعد تسجيل الدخول
  const handleUserRedirection = useCallback((profile: Profile) => {
    if (profile.user_type === 'admin') {
      navigate('/admin', { replace: true });
      return;
    }
    if (profile.user_type === 'wholesale') {
      navigate('/', { replace: true });
      return;
    }
    navigate('/', { replace: true });
  }, [navigate]);

  // تسجيل الدخول
  const signIn = async (email: string, password: string) => {
    const data = await signInMutation.mutateAsync({ email, password });
    setCookie('lastLoginTime', Date.now().toString(), 60 * 60 * 24 * 30);
    // جلب بيانات البروفايل بعد تسجيل الدخول
    if (data && data.user && data.user.id) {
      const profileData = await fetchUserProfile(data.user.id);
      if (profileData) {
        setProfile(profileData);
        handleUserRedirection(profileData); // التوجيه فقط بعد تسجيل الدخول
      }
    }
  };

  // تسجيل حساب جديد
  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    const data = await signUpMutation.mutateAsync({ email, password, fullName, phone });
    if (!data.user) {
      throw new Error('فشل في إنشاء الحساب. يرجى المحاولة مرة أخرى.');
    }
    // إذا تم إنشاء الحساب بنجاح، أنشئ بروفايل للمستخدم في جدول profiles
    if (data.user.id) {
      try {
        await createProfile({
          id: data.user.id,
          email,
          full_name: fullName,
          phone: phone || '',
          user_type: 'retail',
        });
        // جلب البروفايل وتوجيه المستخدم بعد التسجيل
        const profileData = await fetchUserProfile(data.user.id);
        if (profileData) {
          setProfile(profileData);
          handleUserRedirection(profileData);
        }
      } catch (e) {
        // تجاهل الخطأ إذا كان البروفايل موجود مسبقاً
      }
    }
    if (!data.session) {
      throw new Error('تم إرسال رابط التأكيد إلى بريدك الإلكتروني. يرجى التحقق من بريدك الإلكتروني وتأكيد حسابك.');
    }
  };

  // تسجيل الخروج
  const signOut = async () => {
    await signOutMutation.mutateAsync();
    setProfile(null);
    deleteCookie('lastLoginTime');
    deleteCookie('lastVisitedPath');
    navigate('/', { replace: true });
  };

  // تحديث ملف المستخدم
  const updateProfile = async (data: Partial<Profile>) => {
    if (!profile) throw new Error('المستخدم غير مسجل الدخول');
    await updateProfileMutation.mutateAsync({ userId: profile.id, updates: data });
    setProfile(prev => prev ? { ...prev, ...data } : null);
  };

  // مراقبة جلسة supabase وتحديث البروفايل تلقائياً
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user?.id) {
        const profileData = await fetchUserProfile(session.user.id);
        if (profileData) setProfile(profileData);
      } else {
        setProfile(null);
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user: profile,
    session: null,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export type AuthContextType = {
  user: Profile | null;
  session: unknown;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
};

