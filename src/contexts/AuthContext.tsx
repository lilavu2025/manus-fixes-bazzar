import React, { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from './AuthContext.context';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { ProfileService } from '@/services/supabase/profileService';

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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // إضافة متغير لتتبع حالة الاتصال
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // مراقبة حالة الاتصال بالإنترنت
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // إضافة مراقب لحالة visibility للصفحة
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && session) {
        // عند العودة للصفحة، تحقق من صحة الجلسة
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
          if (!currentSession && session) {
            // إذا انقطعت الجلسة، حاول استعادتها
            console.log('Session lost, attempting to restore...');
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [session]);

  // Fetch profile by userId, return the profile or null
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const data = await ProfileService.fetchProfile(userId);
    if (!data) {
      setProfile(null);
      setTimeout(() => {
        navigate('/account-deleted', { replace: true });
      }, 100);
      return null;
    }
    setProfile(data as Profile);
    return data as Profile | null;
  }, [navigate]);

  // Create profile for new user and return it
  const createProfile = async (userId: string): Promise<Profile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    // Fix: use const for user_type to satisfy literal type
    const user_type = 'retail' as const;
    const profileData = {
      id: userId,
      full_name: user.user_metadata?.full_name || '',
      phone: user.user_metadata?.phone || null,
      user_type,
      email: user.email || ''
    };
    const data = await ProfileService.createProfile(profileData);
    if (data) setProfile(data as Profile);
    return data as Profile | null;
  };

  // توجيه الأدمن دائمًا للوحة الإدارة بعد تسجيل الدخول
  const handleUserRedirection = useCallback((profile: Profile, event: string) => {
    if (event !== 'SIGNED_IN') return;
    if (profile.user_type === 'admin') {
      navigate('/admin', { replace: true });
      return;
    }
    // باقي الأنواع
    if (profile.user_type === 'wholesale') {
      navigate('/', { replace: true });
      return;
    }
    navigate('/', { replace: true });
  }, [navigate]);

  // حفظ آخر صفحة زارها المستخدم (عدا صفحات auth)
  useEffect(() => {
    if (
      location.pathname !== '/auth' &&
      location.pathname !== '/email-confirmation'
    ) {
      localStorage.setItem('lastVisitedPath', location.pathname + location.search + location.hash);
    }
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    // Use correct type for subscription from Supabase
    let subscription: { unsubscribe: () => void } | null = null;

    const initializeAuth = async () => {
      // التحقق من الجلسة الحالية أولاً
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
        await fetchProfile(initialSession.user.id);
      }

      // إعداد مراقب تغيير حالة المصادقة
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state change:', event, 'session:', !!session);
          
          // تجنب التحديثات غير الضرورية
          if (event === 'TOKEN_REFRESHED' && session?.user?.id === user?.id) {
            setSession(session);
            return;
          }

          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            const fetchedProfile = await fetchProfile(session.user.id);
            
            // Only redirect on sign in event
            if (event === 'SIGNED_IN' && fetchedProfile) {
              handleUserRedirection(fetchedProfile, event);
            }
          } else {
            setProfile(null);
          }

          setLoading(false);
        }
      );
      subscription = authSubscription;

      setLoading(false);
    };

    initializeAuth();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [fetchProfile, handleUserRedirection, user?.id]);

  // SignIn function
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('disabled')
        .eq('id', data.user.id as string)
        .single();
      if (profileError) throw profileError;
      if (profileData && typeof profileData === 'object' && 'disabled' in profileData && profileData.disabled) {
        await supabase.auth.signOut();
        throw new Error('تم تعطيل حسابك من قبل الإدارة. يرجى التواصل مع الدعم.');
      }
    }
    localStorage.setItem('lastLoginTime', Date.now().toString());
  };

  // SignUp function with comprehensive email existence check
  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    // Check if user already exists by attempting to sign up
    // Supabase will return an error if the email is already registered
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || '',
        },
      },
    });

    if (error) {
      // Handle specific error cases
      if (error.message.includes('already registered')) {
        throw new Error('هذا البريد الإلكتروني مسجل مسبقاً. يرجى تسجيل الدخول بدلاً من ذلك.');
      }
      throw error;
    }

    if (!data.user) {
      throw new Error('فشل في إنشاء الحساب. يرجى المحاولة مرة أخرى.');
    }

    // If signup was successful but user needs to confirm email
    if (!data.session) {
      throw new Error('تم إرسال رابط التأكيد إلى بريدك الإلكتروني. يرجى التحقق من بريدك الإلكتروني وتأكيد حسابك.');
    }
  };

  // SignOut function
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear local state
    setUser(null);
    setSession(null);
    setProfile(null);
    
    // Clear any stored data
    localStorage.removeItem('lastLoginTime');
    localStorage.removeItem('lastVisitedPath');
    
    // Redirect to home
    navigate('/', { replace: true });
  };

  // Fix: move updateProfile definition above value assignment
  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) throw new Error('المستخدم غير مسجل الدخول');
    await ProfileService.updateProfile(user.id, data);
    setProfile(prev => prev ? { ...prev, ...data } : null);
  };

  const value = {
    user,
    session,
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
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
};

