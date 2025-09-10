import type { Product } from './index';
import type { ProductRow } from '@/integrations/supabase/dataFetchers';

/**
 * Maps a ProductRow (from Supabase) to the app's Product type.
 */
export function mapProductFromDb(row: ProductRow): Product {
  // prefer variant-level stock when variants are attached (products_with_variants)
  const maybeVariants = (row as any)?.variants;
  let derivedInStock = typeof row.in_stock === 'boolean' ? row.in_stock : (row.stock_quantity ?? 0) > 0;
  let derivedStockQuantity = typeof row.stock_quantity === 'number' ? row.stock_quantity : 0;

  if (Array.isArray(maybeVariants) && maybeVariants.length > 0) {
    // sum variant stock quantities (safely) and mark inStock if any variant available
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
    id: row.id ?? '',
    name: row.name_ar ?? '',
    nameEn: row.name_en ?? '',
    nameHe: row.name_he ?? '',
    description: row.description_ar ?? '',
    descriptionEn: row.description_en ?? '',
    descriptionHe: row.description_he ?? '',
    price: row.price ?? 0,
    originalPrice: row.original_price ?? 0, // Default to 0 if undefined
    wholesalePrice: row.wholesale_price ?? undefined,
    image: row.image ?? '',
    images: row.images ?? [],
    category: row.category_id ?? '',
  inStock: derivedInStock,
  stock_quantity: derivedStockQuantity,
    rating: row.rating ?? 0,
    reviews: row.reviews_count ?? 0,
    discount: row.discount ?? undefined,
    featured: row.featured ?? undefined,
    tags: row.tags ?? [],
    active: typeof row.active === 'boolean' ? row.active : true,
    created_at: row.created_at ?? 'N/A', // Default to 'N/A' if undefined
    sales_count: row.sales_count ?? 0,
  top_ordered: row.top_ordered ?? false,
  // تمرير بيانات الفيرنتس إن وُجدت (عند الجلب من products_with_variants)
  has_variants: (row as any)?.has_variants ?? undefined,
  variants: (row as any)?.variants ?? undefined,
  options: (row as any)?.options ?? undefined,
  };
}
