import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export class AddressService {
  /** جلب عناوين المستخدم */
  static async getUserAddresses(userId: string): Promise<Tables<"addresses">[]> {
    const { data = [], error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false });
    if (error) {
      console.error("Error fetching addresses:", error);
      return [];
    }
    return data;
  }

  /** إضافة عنوان جديد */
  static async createAddress(userId: string, address: Omit<TablesInsert<"addresses">, "id" | "user_id">): Promise<Tables<"addresses"> | null> {
    const { data, error } = await supabase
      .from("addresses")
      .insert({ ...address, user_id: userId })
      .select()
      .single();
    if (error) {
      console.error("Error creating address:", error);
      return null;
    }
    return data;
  }

  /** تعديل عنوان */
  static async updateAddress(addressId: string, updates: Partial<Omit<TablesUpdate<"addresses">, "id" | "user_id">>): Promise<Tables<"addresses"> | null> {
    const { data, error } = await supabase
      .from("addresses")
      .update(updates)
      .eq("id", addressId)
      .select()
      .single();
    if (error) {
      console.error("Error updating address:", error);
      return null;
    }
    return data;
  }

  /** حذف عنوان */
  static async deleteAddress(addressId: string): Promise<boolean> {
    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", addressId);
    if (error) {
      console.error("Error deleting address:", error);
      return false;
    }
    return true;
  }
}
