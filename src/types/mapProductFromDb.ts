import type { Product } from './index';
import type { ProductRow } from '@/integrations/supabase/dataFetchers';

/**
 * Maps a ProductRow (from Supabase) to the app's Product type.
 */
export function mapProductFromDb(row: ProductRow): Product {
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
    inStock: typeof row.in_stock === 'boolean' ? row.in_stock : (row.stock_quantity ?? 0) > 0,
    stock_quantity: typeof row.stock_quantity === 'number' ? row.stock_quantity : 0,
    rating: row.rating ?? 0,
    reviews: row.reviews_count ?? 0,
    discount: row.discount ?? undefined,
    featured: row.featured ?? undefined,
    tags: row.tags ?? [],
    active: typeof row.active === 'boolean' ? row.active : true,
    created_at: row.created_at ?? 'N/A', // Default to 'N/A' if undefined
    sales_count: row.sales_count ?? 0,
    top_ordered: row.top_ordered ?? false,
  };
}
