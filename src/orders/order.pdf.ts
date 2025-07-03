import config from "@/configs/activeConfig";
import type { Order } from "./order.types";
import { getOrderDisplayTotal } from "./order.displayTotal";
import html2pdf from "html2pdf.js";

export async function downloadInvoicePdf(
  order: Order,
  t: (key: string) => string,
  currentLang: "ar" | "en" | "he"
) {
  const storeName = config.names[currentLang];
  const logo = `${window.location.origin}${config.visual.logo}`;
  const profile = order.profiles ?? { full_name: "", phone: "" };
  const displayTotal = getOrderDisplayTotal(order);
  const direction = currentLang === "ar" || currentLang === "he" ? "rtl" : "ltr";
  const align = direction === "rtl" ? "right" : "left";
  const productsRows = order.items
    ?.map((item) => {
      let productName = "-";
      if ((item as any)[`product_name_${currentLang}`]) {
        productName = (item as any)[`product_name_${currentLang}`];
      } else if ((item as any).product_name_ar) {
        productName = (item as any).product_name_ar;
      } else if (item.product_name) {
        productName = item.product_name;
      }
      return `
      <tr>
        <td>${productName}</td>
        <td>${item.quantity}</td>
        <td>${item.price.toFixed(2)} ₪</td>
        <td>${(item.quantity * item.price).toFixed(2)} ₪</td>
      </tr>
    `;
    })
    .join("") ?? "";

  // فقط محتوى الفاتورة (div.invoice)
  const invoiceHtml = `
    <div class="invoice" style="max-width:850px;margin:auto;background:white;border-radius:12px;box-shadow:0 0 10px rgba(0,0,0,0.1);padding:30px;direction:${direction};">
      <div class="header" style="text-align:center;margin-bottom:20px;">
        <img src="${logo}" alt="Logo" style="height:60px;margin-bottom:10px;" />
        <div class="company-name" style="font-size:20px;font-weight:bold;">${storeName}</div>
        <div>${t("orderInvoice")}</div>
      </div>
      <div class="info" style="margin-top:20px;margin-bottom:20px;text-align:${align};line-height:1.6;">
        <div>${t("orderNumber")}: ${order.order_number}</div>
        <div>${t("date")}: ${new Date(order.created_at).toLocaleDateString("en-GB")}</div>
        <div>${t("customer")}: ${profile.full_name || "-"}</div>
        <div>${t("phone")}: ${profile.phone || "-"}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-top:20px;">
        <thead>
          <tr>
            <th style="border:1px solid #ccc;padding:10px;background-color:#f0f0f0;">${t("product")}</th>
            <th style="border:1px solid #ccc;padding:10px;background-color:#f0f0f0;">${t("quantity")}</th>
            <th style="border:1px solid #ccc;padding:10px;background-color:#f0f0f0;">${t("price")}</th>
            <th style="border:1px solid #ccc;padding:10px;background-color:#f0f0f0;">${t("total")}</th>
          </tr>
        </thead>
        <tbody>
          ${productsRows}
        </tbody>
      </table>
      <div class="info" style="margin-top:20px;">
        <div>${t("total")}: ${order.total.toFixed(2)} ₪</div>
        ${displayTotal.totalAfterDiscount !== order.total
          ? `<div>${t("totalAfterDiscount")}: ${displayTotal.totalAfterDiscount.toFixed(2)} ₪</div>`
          : ""}
      </div>
      <div class="footer" style="margin-top:40px;font-size:0.9em;color:#777;text-align:center;">
        ${t("printedAt") || "تمت الطباعة في"}: ${new Date().toLocaleString("en-GB")}
        <br />
        ${t("printedBy") || "تمت الطباعة بواسطة"}: ${order.admin_creator_name || "-"}
      </div>
    </div>
  `;
  // إنشاء div مخفي وتحويله إلى PDF
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = invoiceHtml;
  document.body.appendChild(tempDiv);
  await html2pdf()
    .from(tempDiv)
    .set({ filename: `order-${order.order_number || Date.now()}.pdf` })
    .save();
  document.body.removeChild(tempDiv);
}
