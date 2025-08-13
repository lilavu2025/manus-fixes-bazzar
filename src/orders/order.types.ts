import type { Address } from "../types";

// أنواع وواجهات الطلبات
export type { Address };

export interface Change {
  label: string;
  oldValue: string;
  newValue: string;
}

export interface Product {
  id: string;
  name_ar: string;
  name_en: string;
  name_he: string;
  description_ar: string;
  description_en: string;
  description_he: string;
  price: number;
}

export interface Order {
  id: string;
  order_number?: number;
  user_id: string;
  customer_name?: string | null;
  items: OrderItem[];
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  payment_method: string;
  shipping_address: Address;
  notes?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email?: string;
    phone?: string;
  };
  admin_created?: boolean;
  admin_creator_name?: string;
  cancelled_by?: string;
  cancelled_by_name?: string;
  // الحقول القادمة من الداتا بيس (snake_case)
  discount_type?: "amount" | "percent";
  discount_value?: number;
  total_after_discount?: number;
  // حقول العروض الجديدة
  applied_offers?: string | null;
  free_items?: string | null;
  discount_from_offers?: number | null;
}

export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product_name: string;
  products?: Product;
  // Offer-related properties
  is_free?: boolean;
  offer_applied?: boolean;
  offer_id?: string;
  offer_name?: string;
  original_price?: number;
  offer_trigger?: boolean;
  offer_trigger_id?: string;
}

export interface NewOrderForm {
  user_id: string;
  payment_method: string;
  status: string;
  notes: string;
  items: OrderItem[];
  shipping_address: Address;
  discountType?: "amount" | "percent";
  discountValue?: number;
  discountEnabled?: boolean;
}
