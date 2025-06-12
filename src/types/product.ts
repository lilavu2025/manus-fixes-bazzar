export interface Product {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
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
}

export type AdminProductForm = ProductFormData & { id: string; category_id: string; category: string };

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
  count: number;
  active?: boolean; // تمت الإضافة لدعم فلترة الفئات الفعالة/غير الفعالة
}
