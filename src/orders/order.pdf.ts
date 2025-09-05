import config from "@/configs/activeConfig";
import type { Order } from "./order.types";
import { getOrderDisplayTotal } from "./order.displayTotal";
import html2pdf from "html2pdf.js";
import { getDisplayPrice } from "@/utils/priceUtils";
import { renderVariantChipsHtml } from "@/utils/variantDisplay";
import type { OrderItem } from "./order.types";

// use shared HTML renderer for variant chips
const renderVariantInfoHtml = renderVariantChipsHtml;

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

      // وصف المنتج
      let productDescription = "";
      const product = products?.find((p) => p.id === item.product_id);
      if (product) {
        productDescription =
          product[`description_${currentLang}`] ||
          product.description_ar ||
          product.description_en ||
          product.description_he ||
          "";
      }

      // السعر المناسب
      const originalPrice = product
        ? getDisplayPrice(
            {
              id: product.id || "",
              name: product.name_ar || "",
              nameEn: product.name_en || "",
              nameHe: product.name_he || "",
              description: product.description_ar || "",
              descriptionEn: product.description_en || "",
              descriptionHe: product.description_he || "",
              price: item.price,
              originalPrice: product.original_price,
              wholesalePrice: product.wholesale_price,
              image: product.image || "",
              images: product.images || [],
              category: "",
              inStock:
                typeof product.in_stock === "boolean" ? product.in_stock : true,
              rating: product.rating || 0,
              reviews: 0,
              discount: product.discount,
              featured: product.featured,
              tags: product.tags || [],
              stock_quantity: product.stock_quantity,
              active: product.active,
              created_at: product.created_at,
            },
            (profile as any)?.user_type
          )
        : item.price;

      // خصومات العروض
      let hasDiscount = false;
      let discountAmount = 0;
      try {
        const appliedOffers = order.applied_offers ? JSON.parse(order.applied_offers) : [];
        for (const offer of appliedOffers) {
          if (
            (offer.offer?.offer_type === "discount" ||
              offer.offer?.offer_type === "product_discount") &&
            offer.affectedProducts &&
            offer.affectedProducts.includes(item.product_id)
          ) {
            hasDiscount = true;
            const totalAffectedValue = offer.affectedProducts.reduce(
              (sum: number, productId: string) => {
                const affectedItem = order.items?.find(
                  (oi: any) => oi.product_id === productId
                );
                if (affectedItem) {
                  return sum + originalPrice * affectedItem.quantity;
                }
                return sum;
              },
              0
            );
            if (totalAffectedValue > 0) {
              const itemValue = originalPrice * item.quantity;
              const itemDiscountRatio = itemValue / totalAffectedValue;
              discountAmount += (offer.discountAmount || 0) * itemDiscountRatio;
            }
          }
          if (offer.offer?.offer_type === "buy_get") {
            const getProductId = offer.offer?.get_product_id;
            const getDiscountType = offer.offer?.get_discount_type;
            if (item.product_id === getProductId && getDiscountType !== "free") {
              hasDiscount = true;
              discountAmount += offer.discountAmount || 0;
            }
          }
        }
      } catch {}

      const finalPrice = originalPrice - discountAmount / item.quantity;
      const finalTotal = finalPrice * item.quantity;
      const originalTotal = originalPrice * item.quantity;

      // مُكوّن تشطيب Overlay (يُستخدم لاحقًا)
      const strike = (content: string, extraStyle = "") =>
        `<span class="strike-wrap" style="${extraStyle}">
           <span class="strike-text">${content}</span>
           <i class="strike-line" aria-hidden="true"></i>
         </span>`;

      const priceDisplay =
        hasDiscount && finalPrice < originalPrice
          ? `<div>
               ${strike(`${originalPrice.toFixed(2)} ₪`, "color:#999; font-size:12px;")}
               <br>
               <span style="color:#22c55e; font-weight:bold;">${finalPrice.toFixed(2)} ₪</span>
             </div>`
          : `${originalPrice.toFixed(2)} ₪`;

      const totalDisplay =
        hasDiscount && finalPrice < originalPrice
          ? `<div>
               ${strike(`${originalTotal.toFixed(2)} ₪`, "color:#999; font-size:12px;")}
               <br>
               <span style="color:#22c55e; font-weight:bold;">${finalTotal.toFixed(2)} ₪</span>
             </div>`
          : `${originalTotal.toFixed(2)} ₪`;

      const variantHtml = renderVariantInfoHtml(
        (item as any).variant_attributes,
        currentLang
      );

      return `
        <tr>
          <td>
            <div style="margin-bottom:4px;"><strong>${productName}</strong></div>
            ${variantHtml}
          </td>
          <td>${item.quantity}</td>
          <td>${priceDisplay}</td>
          <td>${totalDisplay}</td>
        </tr>
      `;
    })
    .join("") ?? "";

  // العناصر المجانية
  const freeItemsRows = (() => {
    try {
      const fromOffers: any[] = [];
      if (order.applied_offers) {
        try {
          const appliedOffers = JSON.parse(order.applied_offers);
          appliedOffers.forEach((offer: any) => {
            if (Array.isArray(offer.freeProducts)) fromOffers.push(...offer.freeProducts);
            if (Array.isArray(offer.freeItems)) fromOffers.push(...offer.freeItems);
          });
        } catch {}
      }

      const fromOrder: any[] = (() => {
        if (!order.free_items) return [];
        try {
          const val =
            typeof order.free_items === "string"
              ? JSON.parse(order.free_items)
              : order.free_items;
          return Array.isArray(val) ? val : [];
        } catch {
          return [];
        }
      })();

      const map = new Map<string, any>();
      const makeKey = (it: any) => {
        const pid = String(it.productId || it.product_id || it.id || "").trim();
        const vid = String(it.variantId || (it.variant_id ?? "") || "").trim();
        return `${pid}|${vid}`;
      };
      const merge = (target: any, src: any) => {
        const result: any = { ...target };
        for (const k of Object.keys(src || {})) {
          if (result[k] == null || result[k] === "") result[k] = src[k];
        }
        if (!result.variantAttributes && src.variantAttributes)
          result.variantAttributes = src.variantAttributes;
        if (!result.variant_attributes && src.variant_attributes)
          result.variant_attributes = src.variant_attributes;
        if (!result.variantId && src.variantId) result.variantId = src.variantId;
        return result;
      };
      const pushOrMerge = (arr: any[]) => {
        for (const it of arr) {
          const key = makeKey(it);
          if (!key.startsWith("|")) {
            if (map.has(key)) map.set(key, merge(map.get(key), it));
            else map.set(key, { ...it });
          }
        }
      };

      pushOrMerge(fromOffers);
      pushOrMerge(fromOrder);

      const mergedFreeItems = Array.from(map.values());
      if (mergedFreeItems.length === 0) return "";

      const strike = (content: string, extraStyle = "") =>
        `<span class="strike-wrap" style="${extraStyle}">
           <span class="strike-text">${content}</span>
           <i class="strike-line" aria-hidden="true"></i>
         </span>`;

      return mergedFreeItems
        .map((item: any) => {
          const product = products?.find(
            (p) =>
              p.id === item.productId ||
              p.id === item.product_id ||
              p.id === item.id ||
              String(p.id) === String(item.productId) ||
              String(p.id) === String(item.product_id) ||
              String(p.id) === String(item.id)
          );

          let productName = "";
          if (product) {
            productName =
              product[`name_${currentLang}`] ||
              product.name_ar ||
              product.name_en ||
              product.name_he ||
              "";
          }
          if (!productName) {
            productName =
              item.name_ar ||
              item.name_en ||
              item.name_he ||
              item.name ||
              item.productName ||
              "";
          }
          if (!productName || productName.trim() === "") return "";

          let originalPrice = 0;
          if (product) {
            originalPrice = getDisplayPrice(
              {
                id: product.id || "",
                name: product.name_ar || "",
                nameEn: product.name_en || "",
                nameHe: product.name_he || "",
                description: product.description_ar || "",
                descriptionEn: product.description_en || "",
                descriptionHe: product.description_he || "",
                price: product.price || 0,
                originalPrice: product.original_price,
                wholesalePrice: product.wholesale_price,
                image: product.image || "",
                images: product.images || [],
                category: "",
                inStock:
                  typeof product.in_stock === "boolean" ? product.in_stock : true,
                rating: product.rating || 0,
                reviews: 0,
                discount: product.discount,
                featured: product.featured,
                tags: product.tags || [],
                stock_quantity: product.stock_quantity,
                active: product.active,
                created_at: product.created_at,
              },
              (profile as any)?.user_type
            );
          } else {
            originalPrice =
              item.originalPrice || item.price || item.original_price || 0;
          }

          const quantity = item.quantity || 1;
          const freeVariantHtml = renderVariantInfoHtml(
            (item as any).variantAttributes || (item as any).variant_attributes,
            currentLang
          );

          return `
            <tr style="background-color:#f0f9ff;">
              <td>
                <div style="margin-bottom:4px;"><strong>🎁 ${productName}</strong></div>
                ${freeVariantHtml}
                <div style="font-size:12px; color:#16a34a;">🎁 ${
                  t("freeItem") || "منتج مجاني"
                }</div>
              </td>
              <td>${quantity}</td>
              <td>
                ${
                  originalPrice > 0
                    ? `
                  ${strike(`${originalPrice.toFixed(2)} ₪`, "color:#666;")}
                  <div style="color:#16a34a; font-weight:bold;">${
                    t("free") || "مجاني"
                  }</div>
                `
                    : `
                  <div style="color:#16a34a; font-weight:bold;">${
                    t("free") || "مجاني"
                  }</div>
                `
                }
              </td>
              <td>
                ${
                  originalPrice > 0
                    ? `${strike(
                        `${(originalPrice * quantity).toFixed(2)} ₪`,
                        "color:#666;"
                      )}`
                    : ``
                }
                <div style="color:#16a34a; font-weight:bold;">0.00 ₪</div>
                ${
                  originalPrice > 0
                    ? `
                  <div style="font-size:10px; color:#16a34a;">💰 ${
                    t("saved") || "وفرت"
                  }: ${(originalPrice * quantity).toFixed(2)} ₪</div>
                `
                    : ``
                }
              </td>
            </tr>
          `;
        })
        .join("")
        .replace(/^\s*$/gm, "");
    } catch {
      return "";
    }
  })();

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
          .header { text-align:center; margin-bottom:20px; }
          .header img { height:60px; margin-bottom:10px; }
          .company-name { font-size:20px; font-weight:bold; }
          .info {
            margin-top:20px; margin-bottom:20px;
            text-align:${align}; line-height:1.6;
          }
          table { width:100%; border-collapse:collapse; margin-top:20px; }
          th, td { border:1px solid #ccc; padding:10px; text-align:center; }
          td:first-child { text-align:${align}; padding:12px 10px; }
          th { background-color:#f0f0f0; }
          .footer { margin-top:40px; font-size:.9em; color:#777; text-align:center; }
          .notes {
            background-color:#f8f9fa; padding:10px; border-radius:6px; margin-top:5px;
            border-left:3px solid #007bff; font-style:italic; word-wrap:break-word;
            word-break:break-word; white-space:pre-wrap; max-width:100%; overflow-wrap:break-word;
            page-break-inside:avoid; font-size:14px; line-height:1.4;
          }

          /* ===== Strikethrough Overlay ===== */
          .strike-wrap {
            position: relative;
            display: inline-block;
            line-height: 1;               /* اضبطناها لـ 1 لقياس أدق */
            white-space: nowrap;
            vertical-align: middle;
          }
          .strike-text { position: relative; z-index: 1; }
          .strike-line {
            position: absolute;
            left: 0; right: 0;
            top: 0;                        /* سنضبطها ديناميكياً بالـ JS */
            height: 1.5px;                 /* سماكة الخط */
            background: currentColor;
            pointer-events: none;
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
            <div style="display: flex; flex-wrap: wrap; gap: 6px 24px;">
              <div style="width: calc(50% - 12px); box-sizing: border-box;">${t("orderNumber")}: ${order.order_number}</div>
              <div style="width: calc(50% - 12px); box-sizing: border-box;">${t("date")}: ${new Date(order.created_at).toLocaleDateString("en-GB")}</div>
              <div style="width: calc(50% - 12px); box-sizing: border-box;">${t("customer")}: ${profile.full_name || "-"}</div>
              <div style="width: calc(50% - 12px); box-sizing: border-box;">${t("phone")}: ${profile.phone || "-"}</div>
            </div>
            ${
              order.notes
                ? `<div><strong>${t("notes") || "ملاحظات"}:</strong><div class="notes">${order.notes}</div></div>`
                : ""
            }

            ${
              order.applied_offers
                ? (() => {
                    try {
                      const appliedOffers = JSON.parse(order.applied_offers);
                      if (appliedOffers.length === 0) return "";
                      return `
                        <div style="margin-top:15px; padding:15px; background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%); border-radius:8px; border-left:4px solid #16a34a;">
                          <strong style="color:#16a34a;">🎉 ${t("appliedOffers") || "العروض المطبقة"}:</strong>
                          <div style="margin-top:8px;">
                            ${appliedOffers
                              .map(
                                (offer: any, index: number) => `
                              <div style="background:rgba(255,255,255,.8); padding:8px; margin:4px 0; border-radius:4px; border:1px solid #e0e7ff;">
                                <div style="font-weight:bold; color:#374151;">
                                  ${(() => {
                                    const offerData = offer.offer || offer;
                                    const offerName =
                                      offerData.title_ar ||
                                      offerData.title_en ||
                                      offerData.title_he ||
                                      offerData.name ||
                                      offerData.title ||
                                      offerData.offerName ||
                                      offerData.name_ar ||
                                      offerData.name_en ||
                                      offerData.name_he ||
                                      offerData.description ||
                                      "";
                                    if (offerName && offerName.trim()) return offerName;
                                    return `${t("offer") || "عرض"} #${index + 1}`;
                                  })()}
                                </div>
                                ${
                                  offer.description
                                    ? `<div style="font-size:12px; color:#6b7280; margin-top:2px;">${offer.description}</div>`
                                    : ""
                                }
                                <div style="margin-top:4px;">
                                  ${
                                    offer.discountAmount > 0
                                      ? `<span style="background:#fee2e2; color:#dc2626; padding:2px 6px; border-radius:3px; font-size:11px; margin-${
                                          direction === "rtl" ? "left" : "right"
                                        }:4px;">💰 ${t("discount") || "خصم"}: ${offer.discountAmount.toFixed(
                                          2
                                        )} ₪</span>`
                                      : ""
                                  }
                                  ${
                                    (offer.freeProducts && offer.freeProducts.length > 0) ||
                                    (offer.freeItems && offer.freeItems.length > 0)
                                      ? `<span style="background:#dbeafe; color:#2563eb; padding:2px 6px; border-radius:3px; font-size:11px;">🎁 ${
                                          t("freeItems") || "منتجات مجانية"
                                        }: ${(offer.freeProducts || offer.freeItems || []).length}</span>`
                                      : ""
                                  }
                                </div>
                              </div>`
                              )
                              .join("")}
                          </div>
                        </div>
                      `;
                    } catch {
                      return "";
                    }
                  })()
                : ""
            }
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
              ${freeItemsRows}
            </tbody>
          </table>

          <div class="info" style="margin-top:20px;">
            ${(() => {
              const appliedOffersData = order.applied_offers
                ? typeof order.applied_offers === "string"
                  ? JSON.parse(order.applied_offers)
                  : order.applied_offers
                : [];
              const totalOffersDiscount = appliedOffersData.reduce(
                (sum: number, offer: any) => sum + (offer.discountAmount || 0),
                0
              );
              const finalTotal = order.total || 0;
              const originalTotal = finalTotal + totalOffersDiscount;

              const strike = (content: string, extraStyle = "") =>
                `<span class="strike-wrap" style="${extraStyle}">
                   <span class="strike-text">${content}</span>
                   <i class="strike-line" aria-hidden="true"></i>
                 </span>`;

              let result = "";
              if (totalOffersDiscount > 0) {
                result += `<div>${strike(
                  `${t("subtotal") || "المجموع الفرعي"}: ${originalTotal.toFixed(
                    2
                  )} ₪`,
                  "color:#666;"
                )}</div>`;
                result += `<div style="color:#16a34a;">${
                  t("offersDiscount") || "خصم العروض"
                }: -${totalOffersDiscount.toFixed(2)} ₪</div>`;
              }
              result += `<div>${t("shipping") || "الشحن"}: ${
                t("free") || "مجاني"
              }</div>`;
              result += `<div style="font-weight:bold; font-size:1.1em; margin-top:10px; border-top:1px solid #ccc; padding-top:10px;">${
                t("total")
              }: ${finalTotal.toFixed(2)} ₪</div>`;
              if (totalOffersDiscount > 0) {
                result += `<div style="color:#16a34a; font-size:.9em;">${
                  t("youSave") || "وفرت"
                }: ${totalOffersDiscount.toFixed(2)} ₪</div>`;
              }
              return result;
            })()}
          </div>

          <div class="footer">
            ${t("printedAt") || "تمت الطباعة في"}: ${new Date().toLocaleString("en-GB")}
            <br />
            ${t("printedBy") || "تمت الطباعة بواسطة"}: ${
              adminName && adminName !== "-" ? adminName : "-"
            }
          </div>
        </div>
      </body>
    </html>
  `;

  // إنشاء div مؤقت
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  document.body.appendChild(tempDiv);

  // ✅ معايرة خط التشطيب ديناميكيًا قبل التحويل
  const adjustStrikes = (root: HTMLElement) => {
    const wraps = root.querySelectorAll<HTMLElement>(".strike-wrap");
    wraps.forEach((wrap) => {
      const textEl = wrap.querySelector<HTMLElement>(".strike-text");
      const lineEl = wrap.querySelector<HTMLElement>(".strike-line");
      if (!textEl || !lineEl) return;
      const rect = textEl.getBoundingClientRect();
      const height = rect.height || textEl.offsetHeight || 0;

      // 0.8 لضبط بسيط للأسفل — الأرقام والـ ₪ غالبًا تحتاج انحياز طفيف
      const y = Math.max(0, Math.round(height * 0.8));
      lineEl.style.top = `${y}px`;
      // سماكة تتناسب مع الحجم (بين 1 و 2px)
      const h = Math.min(2, Math.max(1, Math.round(height / 12)));
      lineEl.style.height = `${h}px`;
    });
  };

  // نضمن تحميل الخطوط أولًا (لو مدعوم)
  try {
    // @ts-ignore
    if (document.fonts && document.fonts.ready) {
      // @ts-ignore
      await document.fonts.ready;
    }
  } catch {}

  // نعطي المتصفح فريم واحد ليرسم
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  adjustStrikes(tempDiv);

  // تحويل لـ PDF
  await html2pdf().from(tempDiv).set({ filename: `order-${order.order_number || Date.now()}.pdf` }).save();
  document.body.removeChild(tempDiv);
}
