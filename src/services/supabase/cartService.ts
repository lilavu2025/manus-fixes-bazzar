import { supabase } from "@/integrations/supabase/client";

export class CartService {
  /** جلب عناصر العربة للمستخدم */
  static async getUserCart(userId: string) {
    const { data, error } = await supabase
      .from("cart")
      .select("*, product:products(*)")
      .eq("user_id", userId);
    if (error) {
      console.error("Error fetching cart:", error);
      return [];
    }
    return data;
  }
}
