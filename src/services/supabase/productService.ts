import { supabase } from "@/integrations/supabase/client";
import type { Language } from "@/types/language";
import type { Database } from "@/integrations/supabase/types";
import type { Product as AppProduct } from "@/types/index";
import type { Tables } from '@/integrations/supabase/types';

export class ProductService {
  /** جلب المنتجات */
  static async getProducts(
    language: Language,
    userType: Tables<'profiles'>['user_type'] | null,
    categoryId?: string
  ): Promise<AppProduct[]> {
    let query = supabase
      .from("products")
      .select(`*, category:categories(id, name_ar, name_en, name_he)`) // join مع جدول الفئات
      .eq("active", true);

    if (categoryId && categoryId !== "all") {
      query = query.eq("category_id", categoryId);
    }

    const { data = [], error } = await query.order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching products:", error);
      return [];
    }

    // تأكد أن كل منتج معه اسم الفئة الصحيح بناءً على اللغة
    const mapped = data.map((p: Tables<'products'> & { category?: { id: string; name_ar: string; name_en: string; name_he: string } }) => {
      const isWholesale = userType === "wholesale";
      const price = isWholesale && p.wholesale_price ? p.wholesale_price : p.price;
      // prefer variant-level stock when variants are joined in the query (products_with_variants)
      const maybeVariants = (p as any)?.variants;
      let derivedInStock = p.in_stock ?? false;
      let derivedStockQuantity = p.stock_quantity ?? 0;
      if (Array.isArray(maybeVariants) && maybeVariants.length > 0) {
        derivedStockQuantity = maybeVariants.reduce((sum: number, v: any) => {
          const q = typeof v.stock_quantity === 'number' ? v.stock_quantity : (v.stockQuantity ?? 0);
          return sum + (typeof q === 'number' ? q : 0);
        }, 0);
        derivedInStock = maybeVariants.some((v: any) => {
          if (typeof v.in_stock === 'boolean') return v.in_stock;
          const q = typeof v.stock_quantity === 'number' ? v.stock_quantity : (v.stockQuantity ?? 0);
          return (typeof q === 'number' ? q : 0) > 0;
        });
      }

      return {
        id: p.id,
        name: p[`name_${language}` as keyof Tables<'products'>] as string,
        nameEn: p.name_en,
        nameHe: p.name_he,
        description: p[`description_${language}` as keyof Tables<'products'>] as string,
        descriptionEn: p.description_en,
        descriptionHe: p.description_he,
        price: Number(price),
        originalPrice: p.original_price ?? undefined,
        wholesalePrice: p.wholesale_price ?? undefined,
        image: p.image,
        images: p.images ?? [],
        category: p.category_id, // id الفئة
        categoryName: p.category ? (p.category[`name_${language}`] || p.category.name_ar || p.category.name_en) : '',
  inStock: derivedInStock,
        rating: Number(p.rating) || 0,
        reviews: p.reviews_count || 0,
        discount: p.discount ?? undefined,
        featured: p.featured ?? false,
        tags: p.tags ?? [],
  stock_quantity: derivedStockQuantity,
        active: p.active ?? true,
      };
    });
    return mapped;
  }
}
