import { supabase } from "@/integrations/supabase/client";
import type { Session, User, AuthError } from "@supabase/supabase-js";

// تمت إزالة جميع منطق supabase.auth من هنا. استخدم دوال AuthContext فقط.
export class AuthService {
  /** تسجيل دخول */
  static signIn() { throw new Error('Use AuthContext signIn instead'); }

  /** إنشاء حساب */
  static signUp() { throw new Error('Use AuthContext signUp instead'); }

  /** تسجيل خروج */
  static signOut() { throw new Error('Use AuthContext signOut instead'); }

  /** جلب الجلسة الحالية */
  static getSession() { throw new Error('Use AuthContext for session'); }

  /** حذف مستخدم من نظام المصادقة (Supabase Auth Admin) */
  static deleteUserFromAuth() { throw new Error('Use AuthContext for user deletion'); }
}
