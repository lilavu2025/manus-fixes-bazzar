import { supabase } from "@/integrations/supabase/client";
import type { Language } from "@/types/language";
import type { Banner as AppBanner } from "@/types/index";

export class BannerService {
  /** جلب البنرات */
  static async getBanners(language: Language): Promise<AppBanner[]> {
    const { data = [], error } = await supabase
      .from("banners")
      .select("*")
      .eq("active", true)
      .order("sort_order");
    if (error) {
      console.error("Error fetching banners:", error);
      return [];
    }
    return (data as import("@/integrations/supabase/types").Database["public"]["Tables"]["banners"]["Row"][]).map((b) => ({
      id: b.id,
      title: b[`title_${language}` as keyof typeof b] as string,
      subtitle: b[`subtitle_${language}` as keyof typeof b] as string,
      image: b.image,
      link: b.link ?? undefined,
      active: b.active ?? true,
    }));
  }
}
