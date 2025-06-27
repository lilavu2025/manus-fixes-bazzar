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
    // البحث الذكي: إذا كان البحث رقمي فقط، ابحث في رقم الطلبية بدقة، وإلا ابحث في النصوص
    result = result.filter((o) => {
      const orderNumber = o.order_number ? String(o.order_number) : "";
      const fullName = o.shipping_address?.fullName || o.customer_name || o.profiles?.full_name || "";
      const phone = o.shipping_address?.phone || o.profiles?.phone || "";
      
      // تحقق إذا كان البحث رقمي فقط
      const isNumericSearch = /^\d+$/.test(searchQuery.trim());
      
      if (isNumericSearch) {
        // إذا كان البحث رقمي، ابحث فقط في رقم الطلبية بدقة أو رقم الهاتف
        const isExactOrderMatch = orderNumber === searchQuery;
        return isExactOrderMatch;
      } else {
        // إذا كان البحث نصي، ابحث في الأسماء فقط
        const isNameMatch = fullName.toLowerCase().includes(searchQuery.toLowerCase());
        return isNameMatch;
      }
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
    // البحث الذكي: إذا كان البحث رقمي فقط، ابحث في رقم الطلبية بدقة، وإلا ابحث في النصوص
    result = result.filter((o) => {
      const orderNumber = o.order_number ? String(o.order_number) : "";
      const fullName = o.shipping_address?.fullName || o.customer_name || o.profiles?.full_name || "";
      const phone = o.shipping_address?.phone || o.profiles?.phone || "";
      
      // تحقق إذا كان البحث رقمي فقط
      const isNumericSearch = /^\d+$/.test(searchQuery.trim());
      
      if (isNumericSearch) {
        // إذا كان البحث رقمي، ابحث فقط في رقم الطلبية بدقة أو رقم الهاتف
        const isExactOrderMatch = orderNumber === searchQuery;
        const isPhoneMatch = phone.includes(searchQuery);
        return isExactOrderMatch || isPhoneMatch;
      } else {
        // إذا كان البحث نصي، ابحث في الأسماء فقط
        const isNameMatch = fullName.toLowerCase().includes(searchQuery.toLowerCase());
        return isNameMatch;
      }
    });
  }
  return result;
}
