import type { Address } from "../types";

// أنواع وواجهات الطلبات
export type { Address };

export interface Change {
  label: string;
  oldValue: string;
  newValue: string;
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
}

export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product_name: string;
}

export interface NewOrderForm {
  user_id: string;
  payment_method: string;
  status: string;
  notes: string;
  items: OrderItem[];
  shipping_address: Address;
}
