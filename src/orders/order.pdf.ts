import config from "@/configs/activeConfig";
import type { Order } from "./order.types";
import { getOrderDisplayTotal } from "./order.displayTotal";
import html2pdf from "html2pdf.js";

export async function downloadInvoicePdf(
  order: Order,
  t: (key: string) => string,
  currentLang: "ar" | "en" | "he",
  adminName?: string, // اسم الأدمن الحالي
  products?: any[] // المنتجات للحصول على الوصف
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
        
        // الحصول على وصف المنتج من قائمة المنتجات
        let productDescription = "";
        const product = products?.find((p) => p.id === item.product_id);
        if (product) {
          productDescription = product[`description_${currentLang}`] || product.description_ar || product.description_en || product.description_he || '';
        }
        
        return `
      <tr>
        <td>
          <div style="margin-bottom: 4px;">
            <strong>${productName}</strong>
          </div>
          ${productDescription ? `<div style="font-size: 12px; color: #666; line-height: 1.3;">${productDescription}</div>` : ''}
        </td>
        <td>${item.quantity}</td>
        <td>${item.price.toFixed(2)} ₪</td>
        <td>${(item.quantity * item.price).toFixed(2)} ₪</td>
      </tr>
    `;
    })
    .join("") ?? "";

  // HTML مطابق تماماً للطباعة
  const html = `
    <html lang="${currentLang}" dir="${direction}">
      <head>
        <meta charset="UTF-8">
        <title>${t("orderInvoice")}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background: #f9f9f9;
            color: #333;
            padding: 30px;
          }
          .invoice {
            max-width: 850px;
            margin: auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            padding: 30px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .header img {
            height: 60px;
            margin-bottom: 10px;
          }
          .company-name {
            font-size: 20px;
            font-weight: bold;
          }
          .info {
            margin-top: 20px;
            margin-bottom: 20px;
            text-align: ${align};
            line-height: 1.6;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ccc;
            padding: 10px;
            text-align: center;
          }
          td:first-child {
            text-align: ${align};
            padding: 12px 10px;
          }
          th {
            background-color: #f0f0f0;
          }
          .footer {
            margin-top: 40px;
            font-size: 0.9em;
            color: #777;
            text-align: center;
          }
          .notes {
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 6px;
            margin-top: 5px;
            border-left: 3px solid #007bff;
            font-style: italic;
            word-wrap: break-word;
            word-break: break-word;
            white-space: pre-wrap;
            max-width: 100%;
            overflow-wrap: break-word;
            page-break-inside: avoid;
            font-size: 14px;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <img src="${logo}" alt="Logo" />
            <div class="company-name">${storeName}</div>
            <div>${t("orderInvoice")}</div>
          </div>

          <div class="info">
            <div>${t("orderNumber")}: ${order.order_number}</div>
            <div>${t("date")}: ${new Date(order.created_at).toLocaleDateString("en-GB")}</div>
            <div>${t("customer")}: ${profile.full_name || "-"}</div>
            <div>${t("phone")}: ${profile.phone || "-"}</div>
            ${order.notes ? `<div><strong>${t("notes") || "ملاحظات"}:</strong><div class="notes">${order.notes}</div></div>` : ""}
          </div>

          <table>
            <thead>
              <tr>
                <th>${t("product")}</th>
                <th>${t("quantity")}</th>
                <th>${t("price")}</th>
                <th>${t("total")}</th>
              </tr>
            </thead>
            <tbody>
              ${productsRows}
            </tbody>
          </table>

          <div class="info" style="margin-top: 20px;">
            <div>${t("total")}: ${order.total.toFixed(2)} ₪</div>
            ${{
              displayTotal: displayTotal.totalAfterDiscount !== order.total
                ? `<div>${t("totalAfterDiscount")}: ${displayTotal.totalAfterDiscount.toFixed(2)} ₪</div>`
                : ""
            }.displayTotal}
          </div>

          <div class="footer">
            ${t("printedAt") || "تمت الطباعة في"}: ${new Date().toLocaleString("en-GB")}
            <br />
            ${t("printedBy") || "تمت الطباعة بواسطة"}: ${(adminName && adminName !== "-") ? adminName : ("-")}
          </div>
        </div>
      </body>
    </html>
  `;

  // إنشاء div مخفي وتحويله إلى PDF
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  document.body.appendChild(tempDiv);
  await html2pdf()
    .from(tempDiv)
    .set({ filename: `order-${order.order_number || Date.now()}.pdf` })
    .save();
  document.body.removeChild(tempDiv);
}
