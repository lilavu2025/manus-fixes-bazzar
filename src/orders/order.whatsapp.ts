// whatsappSender.ts
import { safeDecompressNotes } from "./order.utils";
import type { Order } from "./order.types";

export function generateWhatsappMessage(order: Order, t: (key: string) => string): string {
  const format = (label: string, value: any) =>
    value ? `*${label}:* ${value}\n` : "";

  let msg = `*${t("orderDetails") || "تفاصيل الطلب"}*\n`;
  msg += `------------------------------\n`;

  msg += format(t("orderNumber") || "رقم الطلب", order.order_number);
  msg += format(t("customer") || "العميل", order.profiles?.full_name);
  msg += format(t("phone") || "رقم الهاتف", order.profiles?.phone);
  msg += format(t("date") || "التاريخ", new Date(order.created_at).toLocaleDateString("en-GB"));
  msg += format(t("status") || "الحالة", t(order.status));
  msg += format(t("paymentMethod") || "طريقة الدفع", t(order.payment_method));

  if (order.shipping_address) {
    const a = order.shipping_address;
    msg += `------------------------------\n`;
    msg += `*${t("shippingAddress") || "عنوان الشحن"}*\n`;
    msg += format(t("phone") || "الهاتف", a.phone);
    msg += format(t("city") || "المدينة", a.city);
    msg += format(t("area") || "المنطقة", a.area);
    msg += format(t("street") || "الشارع", a.street);
    msg += format(t("building") || "المبنى", a.building);
    msg += format(t("apartment") || "الشقة", a.apartment);
  }

  if (order.notes) {
    msg += `------------------------------\n`;
    msg += `*${t("notes") || "ملاحظات"}*\n`;
    msg += `${safeDecompressNotes(order.notes)}\n`;
  }

  msg += `------------------------------\n`;
  msg += `*${t("products") || "المنتجات"}*\n`;

  order.items?.forEach((item, i) => {
    msg += `\n${i + 1}. ${item.product_name}\n`;
    msg += `   - ${t("quantity") || "الكمية"}: ${item.quantity}\n`;
    msg += `   - ${t("price") || "السعر"}: ${item.price}`;
  });

  msg += `\n\n==============================\n`;
  msg += `*${t("total") || "المجموع"}:* *${order.total} ₪*\n`;
  msg += `==============================`;

  return msg;
}

function downloadAsTxt(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function sendOrderViaWhatsapp(order: Order, t: (key: string) => string) {
  const msg = generateWhatsappMessage(order, t);
  const isShort = msg.length <= 100;

  if (!isShort) {
    downloadAsTxt(`order-${order.order_number}.txt`, msg);
    alert("📎 تم تحميل ملف الطلب — يمكنك الآن إرساله كمرفق على واتساب ✅");
    return; // ❗❗ أوقف تنفيذ باقي الكود نهائيًا
  }

  // قصيرة → افتح واتساب
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
}


