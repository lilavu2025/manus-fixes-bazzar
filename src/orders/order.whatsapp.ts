import jsPDF from "jspdf";
import { amiriFontBase64 } from "../../public/fonts/amiriFontBase64";
import { notoSansHebrewFontBase64 } from "../../public/fonts/notoSansHebrewFontBase64";
import config from "@/configs/activeConfig";
import { getOrderDisplayTotal } from "./order.displayTotal";
import type { Order } from "./order.types";

// 🧠 تحويل base64 إلى صورة
function loadImageFromBase64(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

function isHebrew(text: string) {
  return /[\u0590-\u05FF]/.test(text);
}
function isArabic(text: string) {
  return /[\u0600-\u06FF]/.test(text);
}
function isEnglishOnly(text: string) {
  return /^[A-Za-z0-9 .,:;!?@#$%^&*()_+=\-\[\]{}'"/\\]*$/.test(text);
}

type AlignType = "right" | "left" | "center" | "justify";

export async function generateInvoicePdf(
  order: Order,
  t: (key: string) => string,
  currentLang: "ar" | "en" | "he"
) {
  let doc: jsPDF;
  doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  doc.addFileToVFS("Amiri-Regular.ttf", amiriFontBase64);
  doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
  doc.addFileToVFS("NotoSansHebrew-Regular.ttf", notoSansHebrewFontBase64);
  doc.addFont("NotoSansHebrew-Regular.ttf", "NotoSansHebrew", "normal");
  doc.setFontSize(13);

  function reverseEnglishWords(text: string) {
    // يعكس فقط الكلمات الإنجليزية (وليس كل النص)
    return text.replace(/[A-Za-z][A-Za-z0-9'\-]*/g, (match) => match.split('').reverse().join(''));
  }

  function reverseHebrewAndEnglish(text: string) {
    // إذا كان النص عبري فقط: نعكس الحروف
    if (isHebrew(text) && !/[A-Za-z]/.test(text)) {
      return text.split('').reverse().join('');
    }
    // إذا كان النص عبري + إنجليزي (مختلط): نعكس ترتيب الكلمات فقط
    if (isHebrew(text) && /[A-Za-z]/.test(text)) {
      return text.split(' ').reverse().join(' ');
    }
    // إذا كان عربي: فقط نعكس الكلمات الإنجليزية داخله
    if (isArabic(text)) {
      return text.replace(/[A-Za-z][A-Za-z0-9'\-]*/g, (match) => match.split('').reverse().join(''));
    }
    // إذا كان إنجليزي فقط أو غير ذلك
    return text;
  }

  const setFontAndAlign = (text: string): { align: AlignType; x: number; processedText: string } => {
    if (isHebrew(text)) {
      doc.setFont("NotoSansHebrew");
      return { align: "right", x: 200, processedText: reverseHebrewAndEnglish(text) };
    } else if (isArabic(text)) {
      doc.setFont("Amiri");
      return { align: "right", x: 200, processedText: reverseHebrewAndEnglish(text) };
    } else if (isEnglishOnly(text)) {
      doc.setFont("helvetica");
      return { align: "left", x: 15, processedText: text };
    } else {
      doc.setFont("helvetica");
      return { align: "left", x: 15, processedText: text };
    }
  };

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

  // 🏪 اسم المتجر والعنوان
  doc.setFontSize(16);
  let fontAlign = setFontAndAlign(storeName);
  doc.text(fontAlign.processedText, 105, y, { align: "center" });
  y += 10;
  doc.setFontSize(14);
  const invoiceTitle = t("orderInvoice") || "فاتورة الطلب";
  fontAlign = setFontAndAlign(invoiceTitle);
  doc.text(fontAlign.processedText, 105, y, { align: "center" });
  y += 15;

  // 🧾 معلومات الزبون
  const rightColX = 200;
  doc.setFontSize(12);
  let infoText = `${t("orderNumber")}: ${order.order_number}`;
  fontAlign = setFontAndAlign(infoText);
  doc.text(fontAlign.processedText, fontAlign.align === "right" ? rightColX : paddingX, y, { align: fontAlign.align }); y += 6;
  infoText = `${t("date")}: ${new Date(order.created_at).toLocaleDateString("en-GB")}`;
  fontAlign = setFontAndAlign(infoText);
  doc.text(fontAlign.processedText, fontAlign.align === "right" ? rightColX : paddingX, y, { align: fontAlign.align }); y += 6;
  infoText = `${t("customer")}: ${profile?.full_name || "-"}`;
  fontAlign = setFontAndAlign(infoText);
  doc.text(fontAlign.processedText, fontAlign.align === "right" ? rightColX : paddingX, y, { align: fontAlign.align }); y += 6;
  infoText = `${t("phone")}: ${profile?.phone || "-"}`;
  fontAlign = setFontAndAlign(infoText);
  doc.text(fontAlign.processedText, fontAlign.align === "right" ? rightColX : paddingX, y, { align: fontAlign.align }); y += 10;

  // 🧮 جدول المنتجات
  doc.setFontSize(13);
  const productsTitle = t("products") || "المنتجات:";
  fontAlign = setFontAndAlign(productsTitle);
  doc.text(fontAlign.processedText, fontAlign.align === "right" ? rightColX : paddingX, y, { align: fontAlign.align });
  y += 7;

  // رأس الجدول
  const tableX = 195;
  const colWidths = [60, 25, 30, 30];
  const headers = [t("product"), t("quantity"), t("price"), t("total")];

  doc.setFontSize(12);
  let colX = tableX;
  headers.forEach((header, idx) => {
    fontAlign = setFontAndAlign(header);
    doc.text(fontAlign.processedText, colX, y, { align: "right" });
    colX -= colWidths[idx];
  });

  y += 6;
  doc.setDrawColor(150);
  doc.line(paddingX, y, 210 - paddingX, y);
  y += 2;

  // المنتجات
  order.items?.forEach((item) => {
    colX = tableX;
    const row = [
      item.product_name,
      String(item.quantity),
      item.price.toFixed(2),
      (item.quantity * item.price).toFixed(2),
    ];
    row.forEach((cell, idx) => {
      fontAlign = setFontAndAlign(cell);
      doc.text(fontAlign.processedText, colX, y, { align: "right" });
      colX -= colWidths[idx];
    });
    y += 6;
  });

  y += 10;
  const displayTotal = getOrderDisplayTotal(order);

  // 🧾 المجموع
  doc.setFontSize(13);
  let totalText = `${t("total")}: ${order.total.toFixed(2)} ₪`;
  fontAlign = setFontAndAlign(totalText);
  doc.text(fontAlign.processedText, fontAlign.align === "right" ? rightColX : paddingX, y, { align: fontAlign.align }); y += 6;

  if (displayTotal.totalAfterDiscount !== order.total) {
    totalText = `${t("totalAfterDiscount")}: ${displayTotal.totalAfterDiscount.toFixed(2)} ₪`;
    fontAlign = setFontAndAlign(totalText);
    doc.text(fontAlign.processedText, fontAlign.align === "right" ? rightColX : paddingX, y, { align: fontAlign.align });
    y += 6;
  }

  // 🖨️ حفظ الفاتورة
  // 🖨️ تحميل الفاتورة
  doc.save(`order-${order.order_number || "order"}.pdf`);
}
