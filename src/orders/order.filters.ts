import { Order, OrderItem } from "./order.types";
import { mapOrderFromDb } from "./order.helpers";

export function filteredOrders(orders: unknown[], statusFilter: string): Order[] {
  const mappedOrders = Array.isArray(orders)
    ? orders.map((order) => mapOrderFromDb(order as Record<string, unknown>))
    : [];
  if (statusFilter === "all") {
    return mappedOrders;
  }
  return mappedOrders.filter((order) => order.status === statusFilter);
}

export function advancedFilteredOrders(
  filteredOrders: Order[],
  dateFrom: string,
  dateTo: string,
  paymentFilter: string,
  searchQuery: string
): Order[] {
  let result = filteredOrders;
  if (dateFrom) {
    result = result.filter((o) => new Date(o.created_at) >= new Date(dateFrom));
  }
  if (dateTo) {
    result = result.filter((o) => new Date(o.created_at) <= new Date(dateTo));
  }
  if (paymentFilter !== "all") {
    result = result.filter((o) => o.payment_method === paymentFilter);
  }
  if (searchQuery) {
    // البحث فقط في رقم الطلب، اسم العميل، أو رقم الهاتف
    result = result.filter((o) => {
      const orderNumber = o.order_number ? String(o.order_number) : "";
      const fullName = o.shipping_address?.fullName || o.customer_name || o.profiles?.full_name || "";
      const phone = o.shipping_address?.phone || o.profiles?.phone || "";
      return (
        orderNumber.includes(searchQuery) ||
        fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phone.includes(searchQuery)
      );
    });
  }
  return result;
}

export function advancedFilteredOrdersWithoutStatus(
  orders: unknown[],
  dateFrom: string,
  dateTo: string,
  paymentFilter: string,
  searchQuery: string
): Order[] {
  const mappedOrders = Array.isArray(orders)
    ? orders.map((order) => mapOrderFromDb(order as Record<string, unknown>))
    : [];
  let result = mappedOrders;
  if (dateFrom) {
    result = result.filter((o) => new Date(o.created_at) >= new Date(dateFrom));
  }
  if (dateTo) {
    result = result.filter((o) => new Date(o.created_at) <= new Date(dateTo));
  }
  if (paymentFilter !== "all") {
    result = result.filter((o) => o.payment_method === paymentFilter);
  }
  if (searchQuery) {
    // البحث فقط في رقم الطلب، اسم العميل، أو رقم الهاتف
    result = result.filter((o) => {
      const orderNumber = o.order_number ? String(o.order_number) : "";
      const fullName = o.shipping_address?.fullName || o.customer_name || o.profiles?.full_name || "";
      const phone = o.shipping_address?.phone || o.profiles?.phone || "";
      return (
        orderNumber.includes(searchQuery) ||
        fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phone.includes(searchQuery)
      );
    });
  }
  return result;
}
