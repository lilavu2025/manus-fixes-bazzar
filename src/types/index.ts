/**
 * Core Application Types
 * الأنواع الأساسية للتطبيق - محدث ومحسن
 */

// ====================
// Base Types
// ====================

export type Language = 'ar' | 'en' | 'he';
export type UserRole = 'admin' | 'wholesale' | 'retail';
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer';

// ====================
// Localized Content Interface
// ====================

export interface LocalizedContent {
  ar: string;
  en: string;
  he: string;
}

// ====================
// Product Types
// ====================

export interface Product {
  // Basic Information
  id: string;
  name: string;
  nameEn: string;
  nameHe: string;
  description: string;
  descriptionEn: string;
  descriptionHe: string;
  
  // Pricing
  price: number;
  originalPrice?: number;
  wholesalePrice?: number;
  wholesale_price?: number; // للتوافق مع قاعدة البيانات القديمة
  
  // Media
  image: string;
  images?: string[];
  
  // Classification
  category: string;
  tags?: string[];
  
  // Inventory
  inStock: boolean;
  stock_quantity?: number;
  
  // Reviews & Ratings
  rating: number;
  reviews: number;
  
  // Marketing
  discount?: number;
  featured?: boolean;
  top_ordered?: boolean;
  sales_count?: number;
  
  // System
  active?: boolean;
  created_at?: string;
}

// ====================
// Category Types  
// ====================

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  nameHe?: string;
  image: string;
  count: number;
  active?: boolean;
}

// ====================
// Cart Item Types
// ====================

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

// ====================
// Order Types
// ====================

export interface Order {
  id: string;
  userId: string;
  order_number?: number; // رقم الطلبية
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  shippingAddress: Address;
  paymentMethod: 'cash' | 'card' | 'bank_transfer';
  notes?: string;
  admin_created?: boolean;
  admin_creator_name?: string;
  updated_at?: string;
  profiles?: { full_name: string; email?: string; phone?: string };
  customer_name?: string | null;
  cancelled_by?: string;
  cancelled_by_name?: string;
  // حقول العروض الجديدة
  applied_offers?: string | null;
  free_items?: string | null;
  discount_from_offers?: number | null;
}

// ====================
// Address Types
// ====================

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  city: string;
  area: string;
  street: string;
  building: string;
  floor?: string;
  apartment?: string;
}

// ====================
// User Types
// ====================

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  addresses: Address[];
  orders: Order[];
  userType?: 'admin' | 'wholesale' | 'retail';
}

// ====================
// Banner Types
// ====================

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link?: string;
  active: boolean;
}

// ====================
// Database Product Types
// ====================

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

// ====================
// Database Category Types
// ====================

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
