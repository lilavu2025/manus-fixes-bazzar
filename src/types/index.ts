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
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  nameHe?: string;
  image: string;
  count: number;
  active?: boolean;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  shippingAddress: Address;
  paymentMethod: 'cash' | 'card' | 'bank_transfer';
  notes?: string;
  admin_created?: boolean;
  admin_creator_name?: string;
}

export interface Address {
  fullName: string;
  phone: string;
  city: string;
  area: string;
  street: string;
  building: string;
  floor?: string;
  apartment?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  addresses: Address[];
  orders: Order[];
  userType?: 'admin' | 'wholesale' | 'retail';
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link?: string;
  active: boolean;
}

export interface DatabaseProduct {
  id: string;
  name_ar: string;
  name_en: string;
  name_he: string;
  description_ar: string;
  description_en: string;
  description_he: string;
  price: number;
  original_price?: number;
  wholesale_price?: number;
  image: string;
  images?: string[];
  category_id: string;
  in_stock: boolean;
  rating: number;
  reviews_count: number;
  discount?: number;
  featured?: boolean;
  tags?: string[];
  active: boolean;
}

export interface DatabaseCategory {
  id: string;
  name_ar: string;
  name_en: string;
  name_he: string;
  image: string;
  icon: string;
  active: boolean;
}

// تحويل كائن Category من النوع الموحد إلى النوع المطلوب في types/product.ts
export function mapCategoryToProductCategory(category: import('./index').Category & { nameHe?: string }): import('./product').Category {
  return {
    id: category.id,
    name: category.name,
    nameEn: category.nameEn,
    nameHe: category.nameHe,
    image: category.image,
    count: category.count,
    active: category.active, // دعم الفلترة
  };
}
