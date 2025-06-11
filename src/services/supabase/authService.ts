import { supabase } from "@/integrations/supabase/client";
import type { Session, User, AuthError } from "@supabase/supabase-js";

export class AuthService {
  /** تسجيل دخول */
  static async signIn(email: string, password: string): Promise<{ session: Session | null; user: User | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { session: data.session, user: data.user, error };
  }

  /** إنشاء حساب */
  static async signUp(email: string, password: string, fullName: string, phone?: string): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone: phone ?? "" } },
    });
    return { user: data.user, error };
  }

  /** تسجيل خروج */
  static async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  /** جلب الجلسة الحالية */
  static async getSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }
}
