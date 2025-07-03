import jsPDF from "jspdf";
import { amiriFontBase64 } from "../../public/fonts/amiriFontBase64";
import config from "@/configs/activeConfig";
import { getOrderDisplayTotal } from "./order.displayTotal";
import type { Order } from "./order.types";

function loadImageFromBase64(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

export async function generateInvoicePdf(
  order: Order,
  t: (key: string) => string,
  currentLang: "ar" | "en" | "he"
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.addFileToVFS("Amiri-Regular.ttf", amiriFontBase64);
  doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
  doc.setFont("Amiri");
  doc.setFontSize(13);

  const storeName = config.names[currentLang];
  const logoPath = config.visual.logo;
  const profile = order.profiles ?? { full_name: "", phone: "" };
  const paddingX = 15;
  let y = 20;

  // 🖼️ الشعار
  try {
    const logo = await loadImageFromBase64(logoPath);
    doc.addImage(logo, "PNG", 85, 10, 40, 20);
  } catch {}

  // 🏢 عنوان المتجر
  doc.setFontSize(16);
  doc.text(storeName, 105, y, { align: "center" });
  y += 10;
  doc.setFontSize(14);
  doc.text(t("orderInvoice") || "فاتورة الطلب", 105, y, { align: "center" });

  y += 15;
  doc.setFontSize(12);

  // 🔹 معلومات الطلب
  const rightColX = 200;
  const leftColX = paddingX;

  doc.text(`${t("orderNumber")}: ${order.order_number}`, rightColX, y, { align: "right" }); y += 6;
  doc.text(`${t("date")}: ${new Date(order.created_at).toLocaleDateString("en-GB")}`, rightColX, y, { align: "right" }); y += 6;
  doc.text(`${t("customer")}: ${profile?.full_name || "-"}`, rightColX, y, { align: "right" }); y += 6;
  doc.text(`${t("phone")}: ${profile?.phone || "-"}`, rightColX, y, { align: "right" }); y += 10;

  // 📦 جدول المنتجات
  doc.setFontSize(13);
  doc.text(t("products") || "المنتجات:", rightColX, y, { align: "right" });
  y += 7;

  // رأس الجدول
  const tableX = 195;
  const colWidths = [60, 30, 30, 30]; // اسم المنتج، الكمية، السعر، المجموع
  const headers = [t("product"), t("quantity"), t("price"), t("total")];

  doc.setFontSize(12);
  let colX = tableX;

  headers.forEach((header, idx) => {
    doc.text(header, colX, y, { align: "right" });
    colX -= colWidths[idx];
  });

  y += 6;

  // المنتجات
  order.items?.forEach((item) => {
    colX = tableX;
    const row = [
      item.product_name,
      item.quantity.toString(),
      item.price.toFixed(2),
      (item.quantity * item.price).toFixed(2),
    ];

    row.forEach((cell, idx) => {
      doc.text(cell, colX, y, { align: "right" });
      colX -= colWidths[idx];
    });

    y += 6;
  });

  y += 10;
  const displayTotal = getOrderDisplayTotal(order);

  // 🧾 المجموع
  doc.setFontSize(13);
  doc.text(`${t("total")}: ${order.total.toFixed(2)} ₪`, rightColX, y, { align: "right" }); y += 6;

  if (displayTotal.totalAfterDiscount !== order.total) {
    doc.text(`${t("totalAfterDiscount")}: ${displayTotal.totalAfterDiscount.toFixed(2)} ₪`, rightColX, y, { align: "right" });
    y += 6;
  }

  // 🖨️ حفظ الفاتورة
  doc.save(`Order-${order.order_number || "Order"}.pdf`);
}
