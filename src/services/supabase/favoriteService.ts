import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export class FavoriteService {
  /** جلب منتجات المفضلة */
  static async getUserFavorites(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from("favorites")
      .select("product_id")
      .eq("user_id", userId)
      .order("added_at", { ascending: false });
    if (error) {
      console.error("Error fetching favorites:", error);
      return [];
    }
    return data.map((item: { product_id: string }) => item.product_id);
  }

  /** إضافة منتج للمفضلة */
  static async addFavorite(userId: string, productId: string): Promise<{ error: unknown | null }> {
    const { error } = await supabase
      .from("favorites")
      .insert({ user_id: userId, product_id: productId });
    return { error };
  }

  /** إزالة منتج من المفضلة */
  static async removeFavorite(userId: string, productId: string): Promise<{ error: unknown | null }> {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);
    return { error };
  }

  /** حذف جميع المفضلات للمستخدم */
  static async clearUserFavorites(userId: string): Promise<{ error: unknown | null }> {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId);
    return { error };
  }

  /** جلب تفاصيل المنتجات المفضلة */
  static async getFavoriteProductDetails(productIds: string[], language: string): Promise<{ data: Tables<"products">[]; error: unknown | null }> {
    if (!productIds.length) return { data: [], error: null };
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds);
    return { data: data || [], error };
  }
}
