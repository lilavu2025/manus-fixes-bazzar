import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export class ProfileService {
  /** جلب ملف التعريف (بروفايل) لمستخدم */
  static async fetchProfile(userId: string): Promise<Tables<"profiles"> | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return data;
  }

  /** إنشاء ملف تعريف جديد */
  static async createProfile(profile: TablesInsert<"profiles">): Promise<Tables<"profiles"> | null> {
    const { data, error } = await supabase
      .from("profiles")
      .insert(profile)
      .select()
      .single();
    if (error) {
      console.error("Error creating profile:", error);
      return null;
    }
    return data;
  }

  /** تحديث ملف التعريف */
  static async updateProfile(userId: string, updates: TablesUpdate<"profiles">): Promise<boolean> {
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);
    if (error) console.error("Error updating profile:", error);
    return !error;
  }
}
