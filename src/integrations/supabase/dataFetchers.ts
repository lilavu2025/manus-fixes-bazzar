// جميع دوال القراءة (select, get, list) من Supabase
// يمنع أي استدعاء مباشر لـ supabase خارج هذا الملف
import { supabase } from './client';
import type { Tables, TablesInsert, TablesUpdate } from './types';
import type { Language } from '@/types/language';
import type { Product as AppProduct } from '@/types/index';
// تعريف ContactInfo type
import type { Database } from './types';
export type ContactInfo = Database['public']['Tables']['contact_info']['Row'];

// Explicit types for Supabase rows
export interface ProductRow {
  id?: string;
  name_ar?: string;
  name_en?: string;
  name_he?: string;
  description_ar?: string;
  description_en?: string;
  description_he?: string;
  price?: number;
  original_price?: number;
  wholesale_price?: number;
  image?: string;
  images?: string[];
  category_id?: string;
  in_stock?: boolean;
  rating?: number;
  reviews_count?: number;
  discount?: number;
  featured?: boolean;
  tags?: string[];
  stock_quantity?: number;
  active?: boolean;
  created_at?: string;
  sales_count?: number; // إضافة sales_count هنا
  top_ordered?: boolean; // إضافة top_ordered لدعم البادج
}
export interface OrderItemRow {
  id: string;
  product_id: string;
  order_id: string;
  quantity: number;
  price: number;
  products?: ProductRow;
}
export interface OrderRow {
  id: string;
  order_number?: number;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  payment_method?: string;
  profiles?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
  };
  order_items?: OrderItemRow[];
  shipping_address?: any; // تعديل نوع shipping_address ليكون any لتفادي تعارض JSON/Json
  notes?: string; // <--- أضف هذا السطر
  discount_type?: string;
  discount_value?: number;
  total_after_discount?: number;
}

// جلب جميع البانرات
export async function getBanners(): Promise<Banner[]> {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (error: unknown) {
    console.error('Error fetching banners:', error);
    return [];
  }
}

// جلب بيانات التواصل
export async function getContactInfo(): Promise<ContactInfo | null> {
  try {
    const { data, error } = await supabase
      .from('contact_info')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching contact info:', error);
    return null;
  }
}

// Banner type for admin banners
export interface Banner {
  id: string;
  title_ar: string;
  title_en: string;
  title_he: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  subtitle_he?: string;
  image: string;
  link?: string;
  sort_order: number;
  active: boolean;
  created_at: string;
}

// جلب إحصائيات الطلبات للإدارة
export async function fetchAdminOrdersStats(t: (key: string) => string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('status, total, total_after_discount, created_at'); // أضف total_after_discount هنا
    if (error) throw error;
    const ordersByStatus: Record<string, number> = data.reduce((acc: Record<string, number>, order: { status: string }) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
    const revenueByStatus: Record<string, number> = data.reduce((acc: Record<string, number>, order: { status: string; total: number; total_after_discount?: number }) => {
      if (!acc[order.status]) acc[order.status] = 0;
      // استخدم total_after_discount إذا كان موجودًا
      acc[order.status] += (order.total_after_discount ?? order.total) || 0;
      return acc;
    }, {});
    const totalRevenue = data
      .filter(order => order.status !== 'cancelled')
      .reduce((sum, order) => sum + ((order.total_after_discount ?? order.total) || 0), 0);
    // الحالات الفعلية المطلوبة
    const statusList = [
      { status: 'pending', color: '#8b5cf6' },
      { status: 'processing', color: '#f59e0b' },
      { status: 'shipped', color: '#6366f1' },
      { status: 'delivered', color: '#10b981' },
      { status: 'cancelled', color: '#ef4444' },
    ];
    return {
      statusStats: statusList.map(({ status, color }) => ({
        status,
        label: t(status),
        value: ordersByStatus[status] || 0,
        revenue: revenueByStatus[status] || 0,
        color,
      })),
      totalRevenue,
      totalOrders: data.length,
    };
  } catch (error) {
    console.error('Error fetching admin orders stats:', error);
    return null;
  }
}

// جلب جميع المستخدمين (للاستخدام الإداري)
import type { UserProfile } from '@/types/profile';

export async function fetchAllUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!data) throw new Error('لم يتم العثور على بيانات المستخدمين');
  return data.map(profile => ({
    id: profile.id,
    full_name: profile.full_name || 'غير محدد',
    phone: profile.phone,
    user_type: profile.user_type || 'retail',
    created_at: profile.created_at,
    email: profile.email || 'غير محدد',
    email_confirmed_at: profile.email_confirmed_at,
    last_sign_in_at: profile.last_sign_in_at,
    last_order_date: profile.last_order_date,
    highest_order_value: profile.highest_order_value,
    disabled: profile.disabled ?? false,
    updated_at: profile.updated_at
  }));
}

// جلب الطلبات مع تفاصيل المستخدم والعناصر
export async function fetchOrdersWithDetails(): Promise<OrdersWithDetails[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`*, payment_method, shipping_address, cancelled_by, cancelled_by_name, profiles:profiles(id, full_name, email, phone, user_type), order_items(*, products(id, name_ar, name_en, name_he, image))`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!data) throw new Error('لم يتم العثور على بيانات الطلبات');
  return (data).map((order: any) => ({
    id: order.id,
    order_number: order.order_number, // إضافة رقم الطلبية
    status: order.status,
    total: order.total,
    // إضافة حقول الخصم
    discount_type: order.discount_type,
    discount_value: order.discount_value,
    total_after_discount: order.total_after_discount,
    created_at: order.created_at,
    updated_at: order.updated_at,
    payment_method: order.payment_method || '',
    profiles: order.profiles,
    shipping_address: typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address,
    order_items: Array.isArray(order.order_items)
      ? order.order_items.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          order_id: item.order_id,
          quantity: item.quantity,
          price: item.price ?? 0,
          products: item.products ? {
            id: item.products.id,
            name_ar: item.products.name_ar,
            name_en: item.products.name_en,
            name_he: item.products.name_he,
            image: item.products.image,
          } : undefined,
        }))
      : [],
    notes: order.notes ?? "",
    admin_created: !!order.admin_created,
    admin_creator_name: order.admin_creator_name,
    cancelled_by: order.cancelled_by ?? undefined,
    cancelled_by_name: order.cancelled_by_name ?? undefined,
  }));
}

// جلب طلبات مستخدم مع تفاصيل المنتجات
// Use OrdersWithDetails for user orders with details
export async function fetchUserOrdersWithDetails(userId: string): Promise<OrdersWithDetails[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, payment_method, shipping_address, admin_created, admin_creator_name, order_items(*, products(id, name_ar, name_en, name_he, description_ar, description_en, description_he, price, original_price, wholesale_price, image, images, category_id, in_stock, rating, reviews_count, discount, featured, tags, stock_quantity, active, created_at))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((order: OrderRow & { admin_created?: boolean; admin_creator_name?: string; order_number?: number }) => ({
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      total: order.total,
      created_at: order.created_at,
      updated_at: order.updated_at,
      profiles: order.profiles,
      shipping_address: typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address,
      order_items: Array.isArray(order.order_items)
        ? order.order_items.map((item: OrderItemRow) => ({
            id: item.id,
            product_id: item.product_id,
            order_id: item.order_id,
            quantity: item.quantity,
            price: item.price,
            products: item.products ? {
              id: item.products.id,
              name_ar: item.products.name_ar,
              name_en: item.products.name_en,
              name_he: item.products.name_he,
              description_ar: item.products.description_ar,
              description_en: item.products.description_en,
              description_he: item.products.description_he,
              price: item.products.price,
              original_price: item.products.original_price,
              wholesale_price: item.products.wholesale_price,
              image: item.products.image,
              images: item.products.images,
              category_id: item.products.category_id,
              in_stock: item.products.in_stock,
              rating: item.products.rating,
              reviews_count: item.products.reviews_count,
              discount: item.products.discount,
              featured: item.products.featured,
              tags: item.products.tags,
              stock_quantity: item.products.stock_quantity,
              active: item.products.active,
              created_at: item.products.created_at,
            } : undefined,
          }))
        : [],
      notes: order.notes ?? "",
      admin_created: !!order.admin_created,
      admin_creator_name: order.admin_creator_name ?? undefined,
      payment_method: order.payment_method || '', // إضافة payment_method هنا
    }));
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }
}

// تعريف الواجهات المساعدة
export interface OrdersWithDetails {
  id: string;
  order_number?: number;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
  };
  order_items?: {
    id: string;
    product_id: string;
    order_id: string;
    quantity: number;
    price: number;
    products?: {
      id: string;
      name_ar: string;
      name_en: string;
      name_he: string;
      description_ar?: string;
      description_en?: string;
      description_he?: string;
      price?: number;
      original_price?: number;
      wholesale_price?: number;
      image: string;
      images?: string[];
      category_id?: string;
      in_stock?: boolean;
      rating?: number;
      reviews_count?: number;
      discount?: number;
      featured?: boolean;
      tags?: string[];
      stock_quantity?: number;
      active?: boolean;
      created_at?: string;
    };
  }[];
  // الحقول الإضافية المطلوبة في الطلبات
  items?: unknown[]; // يمكن تحسين النوع لاحقًا
  shipping_address?: any; // تم تحسين النوع
  user_id?: string;
  payment_method?: string;
  notes?: string;
  cancelled_by?: string;
  customer_name?: string;
  admin_created?: boolean;
  admin_creator_name?: string;
}

// جلب الفئات مع عدد المنتجات لكل فئة (للاستخدام الإداري)
import type { Category } from '@/types/product';

export async function fetchCategoriesWithProductCount(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name_ar, name_en, name_he, image, icon, active, created_at, products(count)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!data) throw new Error('لم يتم العثور على بيانات الفئات');
  return data.map((cat: Record<string, unknown>) => ({
    id: String(cat.id),
    name: String(cat.name_ar),
    nameEn: String(cat.name_en),
    nameHe: String(cat.name_he),
    image: String(cat.image),
    icon: typeof cat.icon === 'string' ? cat.icon : '',
    count: Array.isArray(cat.products) && typeof (cat.products[0]?.count) === 'number' ? cat.products[0].count : 0,
    active: typeof cat.active === 'boolean' ? cat.active : true,
  }));
}

// جلب تفاصيل منتج معين
export async function fetchProductDetails(productId: string): Promise<ProductRow | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`*`)
      .eq('id', productId)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching product details:', error);
    return null;
  }
}

// جلب المنتجات المميزة
export async function fetchFeaturedProducts(): Promise<ProductRow[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`*`)
      .eq('featured', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

// جلب المنتجات حسب الفئة
export async function fetchProductsByCategory(categoryId: string): Promise<ProductRow[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`*`)
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
}

// جلب جميع المنتجات
export async function fetchAllProducts(): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`*`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!data) throw new Error('لم يتم العثور على بيانات المنتجات');
  return data;
}

// جلب بروفايل مستخدم واحد بناءً على userId
export async function fetchUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

// --- BEGIN: Commented out fetchers/types for non-existent tables/types ---
// All fetchers and types below reference tables/types that do not exist in the Supabase schema or are not defined in the project types.
// They are commented out to resolve TypeScript errors. If you add these tables/types in the future, uncomment and fix as needed.

/*
// Example:
// export async function fetchReviews() { ... }
// export type Review = { ... }
// ... (repeat for all the types/functions listed in the error report above) ...
*/
// --- END: Commented out fetchers/types for non-existent tables/types ---
