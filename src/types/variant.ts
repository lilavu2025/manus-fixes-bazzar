// أنواع بيانات الفيرنتس والخيارات
export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  price: number;
  wholesale_price: number;
  stock_quantity: number;
  active: boolean;
  image: string;
  option_values: Record<string, string>; // مثل: { "اللون": "أحمر", "الحجم": "كبير" }
  created_at: string;
  updated_at?: string;
}

export interface ProductOption {
  id: string;
  product_id: string;
  name: string; // اسم الخيار مثل "اللون" أو "الحجم"
  option_position: number; // ترتيب الخيار
  option_values: string[]; // القيم المتاحة مثل ["أحمر", "أزرق", "أخضر"]
  created_at: string;
}

export interface VariantFormData {
  sku: string;
  price: number;
  wholesale_price: number;
  original_price?: number;
  stock_quantity: number;
  in_stock: boolean;
  active: boolean;
  image: string;
  images?: string[];
  option_values: Record<string, string>;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
}

export interface ProductOptionFormData {
  name: string;
  option_values: string[];
  option_position: number;
}

// نوع للمنتج مع الفيرنتس
export interface ProductWithVariants {
  id: string;
  name_ar: string;
  name_en: string;
  name_he: string;
  description_ar?: string;
  description_en?: string;
  description_he?: string;
  price: number;
  original_price?: number;
  wholesale_price?: number;
  image: string;
  images?: string[];
  category_id: string;
  in_stock: boolean;
  stock_quantity?: number;
  rating?: number;
  reviews_count?: number;
  discount?: number;
  featured?: boolean;
  active?: boolean;
  tags?: string[];
  has_variants: boolean;
  created_at: string;
  updated_at?: string;
  
  // بيانات الفيرنتس
  options?: ProductOption[]; // خيارات المنتج (اللون، الحجم، إلخ)
  variants?: ProductVariant[]; // الفيرنتس المتاحة
}

// نوع لاختيار الفيرنت في صفحة المنتج
export interface VariantSelection {
  [optionName: string]: string; // مثل: { "اللون": "أحمر", "الحجم": "كبير" }
}

// نوع لعرض الفيرنت المحدد
export interface SelectedVariant {
  variant: ProductVariant | null;
  isAvailable: boolean;
  price: number;
  wholesale_price: number;
  stock_quantity: number;
  image: string;
}
