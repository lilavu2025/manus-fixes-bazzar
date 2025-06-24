import { Order, OrderItem } from "./order.types";
import type { Address } from "../types";

// Helper: Convert snake_case to camelCase for Address
export function mapAddressFromDb(
  dbAddress: Record<string, unknown> | undefined | null,
): Address {
  if (!dbAddress) {
    return {
      fullName: "",
      phone: "",
      city: "",
      area: "",
      street: "",
      building: "",
      floor: "",
      apartment: "",
    };
  }
  return {
    fullName: (dbAddress["full_name"] as string) || "",
    phone: (dbAddress["phone"] as string) || "",
    city: (dbAddress["city"] as string) || "",
    area: (dbAddress["area"] as string) || "",
    street: (dbAddress["street"] as string) || "",
    building: (dbAddress["building"] as string) || "",
    floor: (dbAddress["floor"] as string) || "",
    apartment: (dbAddress["apartment"] as string) || "",
  };
}

export function mapAddressToDb(address: Address) {
  return {
    full_name: address.fullName,
    phone: address.phone,
    city: address.city,
    area: address.area,
    street: address.street,
    building: address.building,
    floor: address.floor,
    apartment: address.apartment,
  };
}

// Helper: Map order from DB
export function mapOrderFromDb(order: Record<string, unknown>): Order {
  let items: OrderItem[] = [];
  if (Array.isArray(order["order_items"]) && order["order_items"].length > 0) {
    type OrderItemDB = {
      id: string;
      product_id: string;
      quantity: number;
      price: number;
      products?: { name_ar?: string; name_en?: string; name_he?: string };
    };
    items = (order["order_items"] as OrderItemDB[]).map((item) => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      product_name:
        item.products?.name_ar ||
        item.products?.name_en ||
        item.products?.name_he ||
        item.id,
    }));
  } else if (typeof order["items"] === "string") {
    items = JSON.parse(order["items"] as string);
  } else if (Array.isArray(order["items"])) {
    items = order["items"] as OrderItem[];
  }
  let total = order["total"] as number;
  if (typeof total !== "number" || isNaN(total)) {
    total = 0;
  }
  let profiles = order["profiles"];
  if (Array.isArray(profiles)) {
    profiles = profiles[0];
  }
  if (!profiles || typeof profiles !== "object") {
    profiles = { full_name: "", email: "", phone: "" };
  }
  return {
    id: order["id"] as string,
    order_number: order["order_number"] as number,
    user_id: order["user_id"] as string,
    customer_name: order["customer_name"] as string | null,
    items,
    total,
    status: order["status"] as Order["status"],
    created_at: order["created_at"] as string,
    shipping_address:
      typeof order["shipping_address"] === "string"
        ? mapAddressFromDb(JSON.parse(order["shipping_address"] as string))
        : mapAddressFromDb(
            order["shipping_address"] as Record<string, unknown>,
          ),
    payment_method: order["payment_method"] as string,
    notes: order["notes"] as string,
    updated_at: order["updated_at"] as string,
    profiles: profiles as { full_name: string; email?: string; phone?: string },
    admin_created:
      order["admin_created"] === true || order["admin_created"] === 1,
    admin_creator_name: order["admin_creator_name"] as string | undefined,
    cancelled_by: order["cancelled_by"] as string | undefined,
    cancelled_by_name: order["cancelled_by_name"] as string | undefined,
  };
}
