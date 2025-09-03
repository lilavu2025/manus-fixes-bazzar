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

  /** إضافة منتج للعربة مع دعم الفيرنتس */
  static async addToCart(
    userId: string, 
    productId: string, 
    quantity: number, 
    variantId?: string,
    variantAttributes?: Record<string, any>
  ) {
    // تحقق إذا كان المنتج موجود مسبقاً (مع نفس الفيرنت إن وجد)
    let selectQuery = supabase
      .from("cart")
      .select("*")
      .eq("user_id", userId)
      .eq("product_id", productId);

    selectQuery = variantId
      ? selectQuery.eq("variant_id", variantId)
      : selectQuery.is("variant_id", null);

    const { data: existing, error: fetchError } = await selectQuery.maybeSingle();
    
    if (fetchError && fetchError.code !== "PGRST116") throw fetchError;
    
    if (existing) {
      // تحديث الكمية إذا كان المنتج موجود
      let updateQuery = supabase
        .from("cart")
        .update({ quantity: existing.quantity + quantity })
        .eq("user_id", userId)
        .eq("product_id", productId);

      updateQuery = variantId
        ? updateQuery.eq("variant_id", variantId)
        : updateQuery.is("variant_id", null);

      const { error } = await updateQuery;
      if (error) throw error;
    } else {
      // إضافة منتج جديد
      const insertData: any = { 
        user_id: userId, 
        product_id: productId, 
        quantity 
      };
      
      if (variantId) {
        insertData.variant_id = variantId;
      }
      
      if (variantAttributes) {
        insertData.variant_attributes = variantAttributes;
      }

      const { error } = await supabase
        .from("cart")
        .insert(insertData);
      
      if (error) throw error;
    }
  }

  /** تحديث كمية منتج في العربة */
  static async updateCartItem(
    userId: string, 
    productId: string, 
    quantity: number,
    variantId?: string
  ) {
    let updateQuery = supabase
      .from("cart")
      .update({ quantity })
      .eq("user_id", userId)
      .eq("product_id", productId);

    updateQuery = variantId
      ? updateQuery.eq("variant_id", variantId)
      : updateQuery.is("variant_id", null);

    const { error } = await updateQuery;
    
    if (error) throw error;
  }

  /** حذف منتج من العربة */
  static async removeFromCart(userId: string, productId: string, variantId?: string) {
    let deleteQuery = supabase
      .from("cart")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);

    deleteQuery = variantId
      ? deleteQuery.eq("variant_id", variantId)
      : deleteQuery.is("variant_id", null);

    const { error } = await deleteQuery;
    
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
