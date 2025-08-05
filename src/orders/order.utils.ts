import { decompressText } from "@/utils/commonUtils";
import { OrderItem } from "./order.types";

// دالة مساعدة لفك الضغط الآمن لملاحظات الطلب
export function safeDecompressNotes(notes: string) {
  try {
    return decompressText(notes);
  } catch {
    return notes;
  }
}

// --- دوال مساعدة يمكن نقلها لملفات منفصلة ---
// نقل دوال utility فقط، الدوال التي تعتمد على state/hooks تبقى هنا

// دالة حساب المجموع الكلي للطلب (pure utility)
// يمكن نقلها إلى src/orders/order.helpers.ts أو order.utils.ts
export function calculateOrderTotal(items: OrderItem[]): number {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

// دالة حساب المجموع الكلي مع مراعاة المنتجات المجانية
export function calculateOrderTotalWithFreeItems(items: any[]): number {
  return items.reduce((total, item) => {
    // تجاهل المنتجات المجانية في الحساب
    if (item.is_free) {
      return total;
    }
    return total + item.price * item.quantity;
  }, 0);
}

// دوال النصوص والألوان الخاصة بالحالة والدفع
export function getStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "shipped":
      return "bg-purple-100 text-purple-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getStatusText(status: string, t: (key: string) => string): string {
  switch (status) {
    case "pending":
      return t("pending") || "Pending";
    case "processing":
      return t("processing") || "Processing";
    case "shipped":
      return t("shipped") || "Shipped";
    case "delivered":
      return t("delivered") || "Delivered";
    case "cancelled":
      return t("cancelled") || "Cancelled";
    default:
      return status;
  }
}

export function getPaymentMethodText(method: string | undefined | null, t: (key: string) => string): string {
  if (!method) return t("notProvided") || "غير محدد";
  switch (method) {
    case "cash":
      return t("cash") || "Cash";
    case "card":
      return t("card") || "Card";
    case "bank_transfer":
      return t("bankTransfer") || "Bank Transfer";
    default:
      return method;
  }
}
