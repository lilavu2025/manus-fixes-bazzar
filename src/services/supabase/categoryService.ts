import { supabase } from "@/integrations/supabase/client";
import type { Language } from "@/types/language";
import type { Tables } from "@/integrations/supabase/types";
import type { Category as AppCategory } from "@/types/index";

export class CategoryService {
  /** جلب الفئات */
  static async getCategories(language: Language): Promise<AppCategory[]> {
    const { data = [], error } = await supabase
      .from("categories")
      .select("*")
      .eq("active", true)
      .order("created_at");
    if (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
    return (data as import("@/integrations/supabase/types").Database["public"]["Tables"]["categories"]["Row"][]).map((cat) => ({
      id: cat.id,
      name: cat[`name_${language}` as keyof typeof cat] as string,
      nameEn: cat.name_en,
      nameHe: cat.name_he,
      image: cat.image,
      icon: cat.icon,
      count: 0,
    }));
  }
}
