import config from "@/configs/activeConfig";
import type { Order } from "./order.types";
import { getOrderDisplayTotal } from "./order.displayTotal";
import { getDisplayPrice } from "@/utils/priceUtils";
import { renderVariantChipsHtml } from "@/utils/variantDisplay";
import type { OrderItem } from "./order.types";

const renderVariantInfoHtml = renderVariantChipsHtml;

export async function orderPrint(
  order: Order,
  t: (key: string) => string,
  currentLang: "ar" | "en" | "he",
  adminName?: string, // اسم الأدمن الحالي
  products?: any[] // المنتجات للحصول على الوصف
) {
  const storeName = config.names[currentLang];
  const logo = `${window.location.origin}${config.visual.logo}`;
  console.log("📷 logo URL:", logo);

  const profile = order.profiles ?? { full_name: "", phone: "" };
  const displayTotal = getOrderDisplayTotal(order);

  const direction = currentLang === "ar" || currentLang === "he" ? "rtl" : "ltr";
  const align = direction === "rtl" ? "right" : "left";

  const productsRows = order.items
    ?.map(
      (item) => {
        // الحصول على اسم المنتج (الكود الأصلي الذي كان يعمل)
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
        
        // الحصول على السعر المناسب حسب نوع العميل
        const originalPrice = product ? getDisplayPrice(
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
            category: "", // fallback
            inStock: typeof product.in_stock === "boolean" ? product.in_stock : true,
            rating: product.rating || 0,
            reviews: 0, // fallback
            discount: product.discount,
            featured: product.featured,
            tags: product.tags || [],
            stock_quantity: product.stock_quantity,
            active: product.active,
            created_at: product.created_at,
          },
          (profile as any)?.user_type,
        ) : item.price;
        
        // التحقق من وجود خصم على هذا المنتج من العروض
        let hasDiscount = false;
        let discountAmount = 0;
        try {
          const appliedOffers = order.applied_offers 
            ? JSON.parse(order.applied_offers)
            : [];
          
          for (const offer of appliedOffers) {
            // للعروض العادية وعروض خصم المنتج
            if ((offer.offer?.offer_type === 'discount' || offer.offer?.offer_type === 'product_discount') 
                && offer.affectedProducts && offer.affectedProducts.includes(item.product_id)) {
              hasDiscount = true;
              // حساب الخصم لهذا المنتج
              const totalAffectedValue = offer.affectedProducts.reduce((sum: number, productId: string) => {
                const affectedItem = order.items?.find((oi: any) => oi.product_id === productId);
                if (affectedItem) {
                  return sum + (originalPrice * affectedItem.quantity);
                }
                return sum;
              }, 0);
              
              if (totalAffectedValue > 0) {
                const itemValue = originalPrice * item.quantity;
                const itemDiscountRatio = itemValue / totalAffectedValue;
                discountAmount += (offer.discountAmount || 0) * itemDiscountRatio;
              }
            }
            
            // لعروض اشتري واحصل - فقط على المنتج المستهدف للخصم
            if (offer.offer?.offer_type === 'buy_get') {
              const getProductId = offer.offer?.get_product_id;
              const getDiscountType = offer.offer?.get_discount_type;
              
              // نطبق الخصم فقط على المنتج المستهدف وليس المنتج المطلوب شراؤه
              if (item.product_id === getProductId && getDiscountType !== 'free') {
                hasDiscount = true;
                // نطبق الخصم الكامل للعرض على هذا المنتج
                discountAmount += offer.discountAmount || 0;
              }
            }
          }
        } catch (error) {
          // في حالة الخطأ، لا نطبق خصم
        }

        const finalPrice = originalPrice - (discountAmount / item.quantity);
        const finalTotal = finalPrice * item.quantity;
        const originalTotal = originalPrice * item.quantity;
        
        // عرض السعر مع أو بدون خصم
        const priceDisplay = hasDiscount && finalPrice < originalPrice
          ? `<div>
              <span style="text-decoration: line-through; color: #999; font-size: 12px;">${originalPrice.toFixed(2)} ₪</span><br>
              <span style="color: #22c55e; font-weight: bold;">${finalPrice.toFixed(2)} ₪</span>
            </div>`
          : `${originalPrice.toFixed(2)} ₪`;
          
        const totalDisplay = hasDiscount && finalPrice < originalPrice
          ? `<div>
              <span style="text-decoration: line-through; color: #999; font-size: 12px;">${originalTotal.toFixed(2)} ₪</span><br>
              <span style="color: #22c55e; font-weight: bold;">${finalTotal.toFixed(2)} ₪</span>
            </div>`
          : `${originalTotal.toFixed(2)} ₪`;
        
  const variantHtml = renderVariantInfoHtml((item as any).variant_attributes, currentLang);
        return `
      <tr>
        <td>
          <div style="margin-bottom: 4px;">
            <strong>${productName}</strong>
          </div>
          ${variantHtml}
          ${productDescription ? `<div style="font-size: 12px; color: #666; line-height: 1.3;">${productDescription}</div>` : ''}
        </td>
        <td>${item.quantity}</td>
        <td>${priceDisplay}</td>
        <td>${totalDisplay}</td>
      </tr>
    `;
      }
    )
    .join("") ?? "";

  // إضافة المنتجات المجانية
  const freeItemsRows = (() => {
    try {
      // 1) من applied_offers
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

      // 2) من order.free_items
      const fromOrder: any[] = (() => {
        if (!order.free_items) return [];
        try {
          const val = typeof order.free_items === 'string' ? JSON.parse(order.free_items) : order.free_items;
          return Array.isArray(val) ? val : [];
        } catch { return []; }
      })();

      // 3) دمج مع تفضيل variantAttributes
      const map = new Map<string, any>();
      const makeKey = (it: any) => {
        const pid = String(it.productId || it.product_id || it.id || '').trim();
        const vid = String(it.variantId || (it.variant_id ?? '') || '').trim();
        return `${pid}|${vid}`;
      };
      const merge = (target: any, src: any) => {
        const result: any = { ...target };
        for (const k of Object.keys(src || {})) {
          if (result[k] == null || result[k] === '') result[k] = src[k];
        }
        if (!result.variantAttributes && src.variantAttributes) result.variantAttributes = src.variantAttributes;
        if (!result.variant_attributes && src.variant_attributes) result.variant_attributes = src.variant_attributes;
        if (!result.variantId && src.variantId) result.variantId = src.variantId;
        return result;
      };
      const pushOrMerge = (arr: any[]) => {
        for (const it of arr) {
          const key = makeKey(it);
          if (!key.startsWith('|')) {
            if (map.has(key)) map.set(key, merge(map.get(key), it));
            else map.set(key, { ...it });
          }
        }
      };
      pushOrMerge(fromOffers);
      pushOrMerge(fromOrder);

      const mergedFreeItems = Array.from(map.values());
      if (mergedFreeItems.length === 0) return "";

      return mergedFreeItems.map((item: any) => {
        // البحث عن المنتج في قاعدة البيانات للحصول على الاسم والسعر
        const product = products?.find((p) => 
          p.id === item.productId || 
          p.id === item.product_id || 
          p.id === item.id ||
          String(p.id) === String(item.productId) ||
          String(p.id) === String(item.product_id) ||
          String(p.id) === String(item.id)
        );
        
        let productName = '';
        
        if (product) {
          productName = product[`name_${currentLang}`] || product.name_ar || product.name_en || product.name_he || '';
        }
        
        // إذا لم نجد اسم من قاعدة البيانات، نحاول من بيانات العنصر نفسه
        if (!productName) {
          productName = item.name_ar || item.name_en || item.name_he || item.name || item.productName || '';
        }
        
        // إذا ما زال فارغ، لا نعرض هذا العنصر
        if (!productName || productName.trim() === '') {
          return '';
        }
        
        // الحصول على السعر الأصلي من قاعدة البيانات أو من بيانات العنصر
        let originalPrice = 0;
        if (product) {
          // استخدام السعر المناسب حسب نوع المستخدم
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
              inStock: typeof product.in_stock === "boolean" ? product.in_stock : true,
              rating: product.rating || 0,
              reviews: 0,
              discount: product.discount,
              featured: product.featured,
              tags: product.tags || [],
              stock_quantity: product.stock_quantity,
              active: product.active,
              created_at: product.created_at,
            },
            (profile as any)?.user_type,
          );
        } else {
          // إذا لم نجد المنتج في قاعدة البيانات، نحاول من بيانات العنصر
          originalPrice = item.originalPrice || item.price || item.original_price || 0;
        }
        
        const quantity = item.quantity || 1;

        const freeVariantHtml = renderVariantInfoHtml((item as any).variantAttributes || (item as any).variant_attributes, currentLang);
    return `
          <tr style="background-color: #f0f9ff;">
            <td>
              <div style="margin-bottom: 4px;">
                <strong>🎁 ${productName}</strong>
              </div>
      ${freeVariantHtml}
              <div style="font-size: 12px; color: #16a34a;">🎁 ${t("freeItem") || "منتج مجاني"}</div>
            </td>
            <td>${quantity}</td>
            <td>
              ${originalPrice > 0 ? `
                <span style="text-decoration: line-through; color: #666;">${originalPrice.toFixed(2)} ₪</span>
                <div style="color: #16a34a; font-weight: bold;">${t("free") || "مجاني"}</div>
              ` : `
                <div style="color: #16a34a; font-weight: bold;">${t("free") || "مجاني"}</div>
              `}
            </td>
            <td>
              ${originalPrice > 0 ? `
                <span style="text-decoration: line-through; color: #666;">${(originalPrice * quantity).toFixed(2)} ₪</span>
              ` : ''}
              <div style="color: #16a34a; font-weight: bold;">0.00 ₪</div>
              ${originalPrice > 0 ? `
                <div style="font-size: 10px; color: #16a34a;">💰 ${t("saved") || "وفرت"}: ${(originalPrice * quantity).toFixed(2)} ₪</div>
              ` : ''}
            </td>
          </tr>
        `;
      }).join("").replace(/^\s*$/gm, ''); // إزالة الأسطر الفارغة
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
          }
        </style>
      </head>
      <body onload="window.print();">
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
            
            ${order.applied_offers ? (() => {
              try {
                const appliedOffers = JSON.parse(order.applied_offers);
                if (appliedOffers.length === 0) return "";
                
                return `
                  <div style="margin-top: 15px; padding: 15px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; border-left: 4px solid #16a34a;">
                    <strong style="color: #16a34a;">🎉 ${t("appliedOffers") || "العروض المطبقة"}:</strong>
                    <div style="margin-top: 8px;">
                      ${appliedOffers.map((offer: any, index: number) => `
                        <div style="background: rgba(255,255,255,0.8); padding: 8px; margin: 4px 0; border-radius: 4px; border: 1px solid #e0e7ff;">
                          <div style="font-weight: bold; color: #374151;">${(() => {
                            // العرض موجود في offer.offer وليس offer مباشرة
                            const offerData = offer.offer || offer;
                            const offerName = offerData.title_ar || offerData.title_en || offerData.title_he || 
                                             offerData.name || offerData.title || offerData.offerName || 
                                             offerData.name_ar || offerData.name_en || offerData.name_he || 
                                             offerData.description || '';
                            
                            if (offerName && offerName.trim()) {
                              return offerName;
                            }
                            
                            return `${t("offer") || "عرض"} #${index + 1}`;
                          })()}</div>
                          ${offer.description ? `<div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${offer.description}</div>` : ""}
                          <div style="margin-top: 4px;">
                            ${offer.discountAmount > 0 ? `<span style="background: #fee2e2; color: #dc2626; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin-right: 4px;">💰 ${t("discount") || "خصم"}: ${offer.discountAmount.toFixed(2)} ₪</span>` : ""}
                            ${((offer.freeProducts && offer.freeProducts.length > 0) || (offer.freeItems && offer.freeItems.length > 0)) ? `<span style="background: #dbeafe; color: #2563eb; padding: 2px 6px; border-radius: 3px; font-size: 11px;">🎁 ${t("freeItems") || "منتجات مجانية"}: ${(offer.freeProducts || offer.freeItems || []).length}</span>` : ""}
                          </div>
                        </div>
                      `).join("")}
                    </div>
                  </div>
                `;
              } catch {
                return "";
              }
            })() : ""}
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

          <div class="info" style="margin-top: 20px;">
            ${(() => {
              // حساب إجمالي الخصم من العروض
              const appliedOffersData = order.applied_offers 
                ? (typeof order.applied_offers === 'string' 
                    ? JSON.parse(order.applied_offers) 
                    : order.applied_offers)
                : [];
              
              const totalOffersDiscount = appliedOffersData.reduce((sum: number, offer: any) => 
                sum + (offer.discountAmount || 0), 0);
              
              // السعر المخزن في order.total هو بعد الخصم
              const finalTotal = order.total || 0;
              // السعر الأصلي = السعر النهائي + الخصم
              const originalTotal = finalTotal + totalOffersDiscount;
              
              let result = '';
              
              // السعر الفرعي
              if (totalOffersDiscount > 0) {
                result += `<div style="text-decoration: line-through; color: #666;">${t("subtotal") || "المجموع الفرعي"}: ${originalTotal.toFixed(2)} ₪</div>`;
                result += `<div style="color: #16a34a;">${t("offersDiscount") || "خصم العروض"}: -${totalOffersDiscount.toFixed(2)} ₪</div>`;
              }
              
              // الشحن
              result += `<div>${t("shipping") || "الشحن"}: ${t("free") || "مجاني"}</div>`;
              
              // السعر النهائي
              result += `<div style="font-weight: bold; font-size: 1.1em; margin-top: 10px; border-top: 1px solid #ccc; padding-top: 10px;">${t("total")}: ${finalTotal.toFixed(2)} ₪</div>`;
              
              // مبلغ التوفير
              if (totalOffersDiscount > 0) {
                result += `<div style="color: #16a34a; font-size: 0.9em;">${t("youSave") || "وفرت"}: ${totalOffersDiscount.toFixed(2)} ₪</div>`;
              }
              
              return result;
            })()}
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

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
