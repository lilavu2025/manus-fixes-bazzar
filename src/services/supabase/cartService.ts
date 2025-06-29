import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export class CartService {
  /** جلب عناصر العربة للمستخدم */
  static async getUserCart(userId: string): Promise<Tables<"cart">[]> {
    const { data, error } = await supabase
      .from("cart")
      .select("*, product:products(*)")
      .eq("user_id", userId)
      .order("added_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching cart:", error);
      return [];
    }
    return data || [];
  }

  /** إضافة منتج للعربة */
  static async addToCart(userId: string, productId: string, quantity: number) {
    // تحقق إذا كان المنتج موجود مسبقاً
    const { data: existing, error: fetchError } = await supabase
      .from("cart")
      .select("*")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .maybeSingle();
    
    if (fetchError && fetchError.code !== "PGRST116") throw fetchError;
    
    if (existing) {
      // تحديث الكمية إذا كان المنتج موجود
      const { error } = await supabase
        .from("cart")
        .update({ quantity: existing.quantity + quantity })
        .eq("user_id", userId)
        .eq("product_id", productId);
      
      if (error) throw error;
    } else {
      // إضافة منتج جديد
      const { error } = await supabase
        .from("cart")
        .insert({ user_id: userId, product_id: productId, quantity });
      
      if (error) throw error;
    }
  }

  /** تحديث كمية منتج في العربة */
  static async updateCartItem(userId: string, productId: string, quantity: number) {
    const { error } = await supabase
      .from("cart")
      .update({ quantity })
      .eq("user_id", userId)
      .eq("product_id", productId);
    
    if (error) throw error;
  }

  /** حذف منتج من العربة */
  static async removeFromCart(userId: string, productId: string) {
    const { error } = await supabase
      .from("cart")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);
    
    if (error) throw error;
  }

  /** مسح كامل العربة */
  static async clearUserCart(userId: string) {
    const { error } = await supabase
      .from("cart")
      .delete()
      .eq("user_id", userId);
    
    if (error) throw error;
  }
}
