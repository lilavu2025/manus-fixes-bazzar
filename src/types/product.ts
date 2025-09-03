import { ProductVariant, ProductOption } from './variant';

export interface Product {
  id: string;
  name: string;
  nameEn: string;
  nameHe: string;
  description: string;
  descriptionEn: string;
  descriptionHe: string;
  price: number;
  originalPrice?: number;
  wholesalePrice?: number;
  image: string;
  images?: string[];
  category: string;
  inStock: boolean;
  rating: number;
  reviews: number;
  discount?: number;
  featured?: boolean;
  tags?: string[];
  stock_quantity?: number;
  active?: boolean;
  created_at?: string;
  sales_count?: number; // تمت الإضافة لدعم إحصائيات المبيعات
  top_ordered?: boolean; // تمت الإضافة لدعم إظهار البادج
  has_variants?: boolean; // إضافة دعم الفيرنتس
  options?: ProductOption[]; // خيارات المنتج
  variants?: ProductVariant[]; // فيرنتس المنتج
}

export interface ProductFormData {
  name_ar: string;
  name_en: string;
  name_he: string;
  description_ar: string;
  description_en: string;
  description_he: string;
  price: number;
  original_price: number;
  wholesale_price: number;
  category_id: string;
  image: string;
  images: string[];
  in_stock: boolean;
  featured: boolean;
  active: boolean;
  discount: number;
  tags: string[];
  stock_quantity: number;
  has_variants?: boolean; // إضافة دعم الفيرنتس
}

export type AdminProductForm = ProductFormData & { id: string; category_id: string; category: string; created_at?: string };

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  nameHe: string;
  image: string;
  icon?: string; // دعم الأيقونة للفئة
  count: number;
  active?: boolean; // تمت الإضافة لدعم فلترة الفئات الفعالة/غير الفعالة
}
