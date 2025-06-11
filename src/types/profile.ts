// تعريف موحد لواجهة المستخدم الإداري
export interface UserProfile {
  id: string;
  full_name: string;
  phone: string | null;
  user_type: 'admin' | 'wholesale' | 'retail';
  created_at: string;
  updated_at: string; // تاريخ آخر تحديث
  email?: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  last_order_date?: string | null;
  highest_order_value?: number | null;
  disabled?: boolean | null;
}
