import { Product, AdminProductForm } from '@/types/product';

export type ProductWithOptionalFields = Product & {
  name_he?: string;
  nameHe?: string;
  description_he?: string;
  descriptionHe?: string;
  category_id?: string;
  discount?: number;
};

export const mapProductToFormData = (product: ProductWithOptionalFields): AdminProductForm => ({
  id: product.id,
  name_ar: product.name || '',
  name_en: product.nameEn || '',
  name_he: product.nameHe || product.name_he || '',
  description_ar: product.description || '',
  description_en: product.descriptionEn || '',
  description_he: product.descriptionHe || product.description_he || '',
  price: product.price,
  original_price: product.originalPrice || 0,
  wholesale_price: product.wholesalePrice || 0,
  category_id: product.category_id || '',
  category: product.category || '',
  image: product.image,
  images: product.images || [],
  in_stock: product.inStock,
  stock_quantity: product.stock_quantity || 0,
  featured: product.featured || false,
  active: product.active ?? true,
  discount: typeof product.discount === 'number' ? product.discount : 0,
  tags: product.tags || [],
  created_at: product.created_at || '',
});
