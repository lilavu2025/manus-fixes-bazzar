import React, { useContext } from "react";
import { Button } from "@/components/ui/button";
import { Copy, MapPin, Package, UserPlus } from "lucide-react";
import { getDisplayPrice } from "@/utils/priceUtils";
import { safeDecompressNotes } from "@/orders/order.utils";
import { getPaymentMethodText } from "@/orders/order.utils";
import type { Order, OrderItem } from "@/orders/order.types";
import type { Product } from "@/types";
import OrderTotalDisplay from "@/components/OrderTotalDisplay";
import { LanguageContext } from '@/contexts/LanguageContext.context';
import { renderVariantInfo } from "@/utils/variantUtils";
import { useProductsRealtime } from '@/hooks/useProductsRealtime';
import { isRTL, useLanguage } from "@/utils/languageContextUtils";

interface OrderDetailsPrintProps {
  order: Order;
  t: any;
  profile?: any;
  generateOrderPrint: (order: Order, t: any, currentLang: "ar" | "en" | "he") => Promise<void>;
  onDownloadPdf?: (order: Order) => void;
}

const OrderDetailsPrint: React.FC<OrderDetailsPrintProps> = ({ order, t, profile, generateOrderPrint: generateOrderPrint, onDownloadPdf }) => {
  const { language } = useContext(LanguageContext) ?? { language: 'ar' };
  const { products } = useProductsRealtime();

  return (
    <div
      className={`space-y-6 px-6 py-6 print:p-0 print:space-y-4 print:bg-white print:text-black print:rounded-none print:shadow-none print:w-full print:max-w-full print:mx-0 print:my-0 ${isRTL ? "text-right" : "text-left"}`}
      id="print-order-details"
    >
      {/* رأس الورقة للطباعة */}
      <div className="print:flex print:flex-col print:items-center print:mb-6 hidden">
        <img src="/favicon.ico" alt="logo" className="h-14 w-14 mb-2" />
        <div className="text-2xl font-bold text-primary print:text-black">{t("storeName") || "متجر موبايل بازار"}</div>
        <div className="text-sm text-gray-600 print:text-gray-700">www.mobilebazaar.ps</div>
        <div className="w-full border-b border-gray-300 my-2" />
      </div>
      {/* بيانات الطلب والعميل */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-4 print:gap-0 print:border print:rounded print:p-4 print:mb-4 print:border-gray-300">
        <div className="space-y-2 print:space-y-1">
          <h4 className="font-semibold text-primary flex items-center gap-1 print:justify-center print:text-lg">
            <UserPlus className="h-4 w-4 print:hidden" /> {t("customerInfo") || "بيانات العميل"}
          </h4>
          <div className="text-base font-bold text-gray-900 print:text-black">
            {order.customer_name?.trim() ? order.customer_name : order.profiles?.full_name || t("notProvided")}
          </div>
          {order.profiles?.email && (
            <div className="text-xs text-gray-700 print:text-black">{order.profiles.email}</div>
          )}
          <div className="text-xs text-gray-700 print:text-black">
            {order.profiles?.phone || order.shipping_address?.phone || t("notProvided")}
          </div>
        </div>
        <div className="space-y-2 print:space-y-1">
          <h4 className="font-semibold text-primary flex items-center gap-1 print:justify-center print:text-lg">
            <MapPin className="h-4 w-4 print:hidden" /> {t("shippingAddress") || "عنوان الشحن"}
          </h4>
          <div className="text-xs text-gray-900 print:text-black">
            {order.shipping_address?.fullName || "-"}
            <br />
            {order.shipping_address?.phone && <>{order.shipping_address.phone}<br /></>}
            {order.shipping_address?.city}, {order.shipping_address?.area}, {order.shipping_address?.street}
            <br />
            {order.shipping_address?.building && <>مبنى: {order.shipping_address.building}, </>}
            {order.shipping_address?.floor && <>طابق: {order.shipping_address.floor}, </>}
            {order.shipping_address?.apartment && <>شقة: {order.shipping_address.apartment}</>}
          </div>
        </div>
      </div>
      {/* معلومات الطلب */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-4 print:gap-0 print:border print:rounded print:p-4 print:mb-4 print:border-gray-300">
        <div className="space-y-1">
          <div className="text-xs text-gray-700 print:text-black">
            {t("orderNumber") || "رقم الطلب"}: <span className="font-bold">{order.order_number}</span>
          </div>
          <div className="text-xs text-gray-700 print:text-black">
            {t("orderDate") || "تاريخ الطلب"}: <span className="font-bold">{new Date(order.created_at).toLocaleDateString("en-GB")} - {new Date(order.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <div className="text-xs text-gray-700 print:text-black">
            {t("updateDate") || "تاريخ التعديل"}: <span className="font-bold">{order.updated_at ? new Date(order.updated_at).toLocaleDateString("en-GB") + " - " + new Date(order.updated_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "-"}</span>
          </div>
          <div className="text-xs text-gray-700 print:text-black">
            {t("status") || "الحالة"}: <span className="font-bold">{t(order.status)}</span>
          </div>
          <div className="text-xs text-gray-700 print:text-black">
            {t("paymentMethod") || "طريقة الدفع"}: <span className="font-bold">{getPaymentMethodText(order.payment_method, t)}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 items-end md:items-center print:hidden">
          <span className="text-xs font-bold text-yellow-700 tracking-wide uppercase mb-0.5 bg-yellow-200 px-2 py-0.5 rounded shadow-sm border border-yellow-300">
            {t("total") + " :" || ":المجموع الكلي"}
          </span>
          {(() => {
            const appliedOffers = order.applied_offers ? JSON.parse(order.applied_offers) : [];
            const offersDiscount = appliedOffers.reduce((sum: number, offer: any) => sum + (offer.discountAmount || 0), 0);
            
            // نحسب المجموع الكلي مع مراعاة الخصم اليدوي
            const subtotal = order.total; // المجموع قبل الخصم اليدوي
            const hasManualDiscount = order.discount_type && order.discount_value > 0;
            const manualDiscountAmount = hasManualDiscount 
              ? (order.discount_type === 'percent' 
                  ? (subtotal * order.discount_value / 100) 
                  : order.discount_value)
              : 0;
              
            const finalTotal = hasManualDiscount && order.total_after_discount !== null
              ? order.total_after_discount
              : subtotal;
              
            const originalTotal = subtotal + offersDiscount;
            const totalSavings = offersDiscount + manualDiscountAmount;
            
            return (
              <div className="text-right">
                {(offersDiscount > 0 || hasManualDiscount) ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-gray-500">
                      <span className="line-through text-base">{originalTotal.toFixed(2)} ₪</span>
                      <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                        -{totalSavings.toFixed(2)} ₪
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {finalTotal.toFixed(2)} ₪
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                      {t("youSaved") || "وفرت"} {totalSavings.toFixed(2)} ₪
                    </div>
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-primary">
                    {finalTotal.toFixed(2)} ₪
                  </div>
                )}
              </div>
            );
          })()}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="font-bold flex items-center gap-1 px-4 py-2 border-blue-500 text-blue-700 hover:bg-blue-50"
              style={{ borderWidth: 2, background: '#2563eb', color: 'white' }}
              onClick={() => generateOrderPrint(order, t, language)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" className="h-4 w-4"><path d="M19 8h-1V3H6v5H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h1v3h12v-3h1c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2zm-3 13H8v-5h8v5zm3-7c0 .55-.45 1-1 1H5c-.55 0-1-.45-1-1v-7c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v7z"></path></svg>
              {t("orderPrint") || "طباعة الطلبية"}
            </Button>
            {/* زر تحميل PDF */}
            <Button
              size="sm"
              variant="outline"
              className="font-bold flex items-center gap-1 px-4 py-2 border-green-500 text-green-700 hover:bg-green-50"
              style={{ borderWidth: 2, background: '#22c55e', color: 'white' }}
              onClick={() => onDownloadPdf && onDownloadPdf(order)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" className="h-4 w-4"><path d="M5 20h14v-2H5v2zm7-18C8.13 2 5 5.13 5 9c0 3.87 3.13 7 7 7s7-3.13 7-7c0-3.87-3.13-7-7-7zm1 10h-2V7h2v5z"/></svg>
              {t("downloadPdf") || "تحميل PDF"}
            </Button>
          </div>
        </div>
      </div>
      {/* ملاحظات الطلب */}
      {order.notes && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded print:bg-white print:border print:border-yellow-400 print:rounded print:p-2 print:mt-2 print:mb-0">
          <span className="font-semibold text-yellow-800 print:text-black">{t("notes") || "ملاحظات"}:</span>{" "}
          <span className="text-gray-700 print:text-black">{safeDecompressNotes(order.notes)}</span>
        </div>
      )}
      
      {/* العروض المطبقة */}
      {order.applied_offers && (() => {
        try {
          const appliedOffers = JSON.parse(order.applied_offers);
          return appliedOffers.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-500 p-4 rounded-r-lg print:bg-white print:border print:border-green-500 print:rounded print:p-3">
              <h4 className="font-bold text-green-800 print:text-black mb-3 flex items-center gap-2">
                🎉 {t("appliedOffers") || "العروض المطبقة"}
              </h4>
              <div className="space-y-3">
                {appliedOffers.map((offer: any, index: number) => (
                  <div key={index} className="bg-white/80 p-3 rounded border border-green-200 print:bg-white print:border print:border-gray-300">
                    <div className="font-semibold text-gray-800 print:text-black mb-1">
                      {(() => {
                        // العرض موجود في offer.offer وليس offer مباشرة
                        const offerData = offer.offer || offer;
                        const offerName = offerData.title_ar || offerData.title_en || offerData.title_he || 
                                         offerData.name || offerData.title || offerData.offerName || 
                                         offerData.name_ar || offerData.name_en || offerData.name_he || 
                                         offerData.description || '';
                        
                        console.log('Offer debug:', { 
                          offer, 
                          offerData,
                          offerName,
                          keys: Object.keys(offer),
                          offerKeys: Object.keys(offerData),
                          allOfferData: JSON.stringify(offer, null, 2)
                        });
                        
                        if (offerName && offerName.trim()) {
                          return `${offerName}`;
                        }
                        
                        return `${t("offer") || "عرض"} #${index + 1}`;
                      })()}
                    </div>
                    {offer.description && (
                      <div className="text-sm text-gray-600 print:text-black mb-2">
                        {offer.description}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 text-sm">
                      {offer.discountAmount > 0 && (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded print:bg-gray-100 print:text-black">
                          💰 خصم: {offer.discountAmount.toFixed(2)} ₪
                        </span>
                      )}
                      {(offer.freeProducts || offer.freeItems) && (offer.freeProducts?.length > 0 || offer.freeItems?.length > 0) && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded print:bg-gray-100 print:text-black">
                          🎁 عناصر مجانية: {(offer.freeProducts || offer.freeItems)?.length}
                        </span>
                      )}
                    </div>
                    {/* عرض تفاصيل المنتجات المجانية */}
                    {((offer.freeProducts && offer.freeProducts.length > 0) || (offer.freeItems && offer.freeItems.length > 0)) && (
                      <div className="mt-2 space-y-1">
                        <div className="text-sm font-medium text-green-700">
                          {t("freeItems") || "منتجات مجانية"}:
                        </div>
                        {(offer.freeProducts || offer.freeItems || []).map((freeItem: any, freeIndex: number) => {
                          const freeProduct = products.find((p) => 
                            p.id === freeItem.productId || 
                            p.id === freeItem.product_id ||
                            String(p.id) === String(freeItem.productId) ||
                            String(p.id) === String(freeItem.product_id)
                          );
                          
                          let freeProductName = '';
                          
                          if (freeProduct) {
                            freeProductName = freeProduct[`name_${language}`] || freeProduct.name_ar || freeProduct.name_en || freeProduct.name_he || '';
                          }
                          
                          if (!freeProductName) {
                            freeProductName = freeItem.name || freeItem.name_ar || freeItem.name_en || freeItem.name_he || 
                                             freeItem.productName || t("unknownProduct") || "منتج غير معروف";
                          }
                          
                          console.log('Free item in offer debug:', { freeItem, freeProduct, freeProductName });
                          
                          return (
                            <div key={freeIndex} className="flex items-center gap-2 text-sm">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              <span>{freeProductName}</span>
                              <span className="text-gray-500">({freeItem.quantity || 1}x)</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        } catch {
          return null;
        }
      })()}

      {/* المنتجات */}
      <div className="space-y-2 border-b pb-4 print:border print:rounded print:p-4 print:mb-4 print:border-gray-300">
        <h4 className="font-semibold text-primary flex items-center gap-1 print:justify-center print:text-lg">
          <Package className="h-4 w-4 print:hidden" /> {t("orderedProducts") || "المنتجات المطلوبة"}
        </h4>
        <div className="overflow-x-auto print:overflow-visible">
          <table className="min-w-full text-xs md:text-sm border rounded-lg print:border print:rounded-none print:text-base print:w-full">
            <thead>
              <tr className="bg-gray-100 print:bg-gray-200">
                <th className="p-2 font-bold">#</th>
                <th className="p-2 font-bold text-right">{t("product") || "المنتج"}</th>
                <th className="p-2 font-bold text-center">{t("quantity") || "الكمية"}</th>
                <th className="p-2 font-bold text-center">{t("price") || "السعر"}</th>
                <th className="p-2 font-bold text-center">{t("total") || "المجموع"}</th>
              </tr>
            </thead>
            <tbody>
              {order.items && order.items.length > 0 ? (
                order.items.map((item: OrderItem, idx: number) => {
                  const product = products.find((p) => p.id === item.product_id);
                  // اسم المنتج حسب اللغة، fallback للعربي إذا غير موجود
                  let productName = '';
                  let productDescription = '';
                  if (product) {
                    productName = product[`name_${language}`] || product.name_ar || product.name_en || product.name_he || '';
                    productDescription = product[`description_${language}`] || product.description_ar || product.description_en || product.description_he || '';
                  } else {
                    productName = item[`product_name_${language}`] || item.product_name || '';
                  }
                  if (!productName) productName = item.product_name || '-';
                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50 print:hover:bg-transparent">
                      <td className="p-2 text-center">{idx + 1}</td>
                      <td className="p-2 text-right">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{productName}</span>
                          {productDescription && (
                            <span className="text-xs text-gray-600 mt-1 print:text-sm print:leading-tight">
                              {productDescription}
                            </span>
                          )}
                          {/* عرض معلومات الفيرنت إذا كان موجوداً */}
                          {renderVariantInfo((item as any).variant_attributes, "text-blue-600 print:text-black")}
                        </div>
                      </td>
                      <td className="p-2 text-center">{item.quantity}</td>
                      <td className="p-2 text-center">
                        {(() => {
                          const savedPrice = Number(item.price) || 0;
                          
                          // الحصول على السعر الحقيقي للمنتج من قاعدة البيانات
                          const product = products.find((p) => p.id === item.product_id);
                          let actualProductPrice = 0;
                          if (product) {
                            // مراعاة نوع العميل (retail/wholesale) باستخدام getDisplayPrice
                            const userType = (order.profiles as any)?.user_type || 'retail';
                            actualProductPrice = getDisplayPrice(product as any, userType);
                          }
                          
                          // إذا كان السعر المحفوظ أقل من السعر الفعلي، يعني هناك خصم
                          if (actualProductPrice > 0 && savedPrice < actualProductPrice) {
                            return (
                              <div>
                                <span className="line-through text-gray-400 text-sm">{actualProductPrice.toFixed(2)} ₪</span>
                                <div className="text-green-600 font-bold">{savedPrice.toFixed(2)} ₪</div>
                              </div>
                            );
                          }
                          
                          // للطلبيات العادية (من الـ checkout) - استخدام الطريقة القديمة
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
                                  const affectedItem = order.items.find((oi: any) => oi.product_id === productId);
                                  if (affectedItem) {
                                    const itemPrice = actualProductPrice || savedPrice;
                                    return sum + (itemPrice * affectedItem.quantity);
                                  }
                                  return sum;
                                }, 0);
                                
                                if (totalAffectedValue > 0) {
                                  const itemPrice = actualProductPrice || savedPrice;
                                  const itemValue = itemPrice * item.quantity;
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

                          if (hasDiscount && discountAmount > 0) {
                            const basePrice = actualProductPrice || savedPrice;
                            const finalPrice = basePrice - (discountAmount / item.quantity);
                            return (
                              <div>
                                <span className="line-through text-gray-400 text-sm">{basePrice.toFixed(2)} ₪</span>
                                <div className="text-green-600 font-bold">{finalPrice.toFixed(2)} ₪</div>
                              </div>
                            );
                          }
                          
                          return `${savedPrice.toFixed(2)} ₪`;
                        })()}
                      </td>
                      <td className="p-2 text-center font-semibold">
                        {(() => {
                          const savedPrice = Number(item.price) || 0;
                          const quantity = item.quantity || 0;
                          
                          // الحصول على السعر الحقيقي للمنتج من قاعدة البيانات
                          const product = products.find((p) => p.id === item.product_id);
                          let actualProductPrice = 0;
                          if (product) {
                            // مراعاة نوع العميل (retail/wholesale) باستخدام getDisplayPrice
                            const userType = (order.profiles as any)?.user_type || 'retail';
                            actualProductPrice = getDisplayPrice(product as any, userType);
                          }
                          
                          // إذا كان السعر المحفوظ أقل من السعر الفعلي، يعني هناك خصم
                          if (actualProductPrice > 0 && savedPrice < actualProductPrice) {
                            const finalTotal = savedPrice * quantity;
                            const originalTotal = actualProductPrice * quantity;
                            const savings = originalTotal - finalTotal;
                            return (
                              <div>
                                <span className="line-through text-gray-400 text-sm">{originalTotal.toFixed(2)} ₪</span>
                                <div className="text-green-600 font-bold">{finalTotal.toFixed(2)} ₪</div>
                                <div className="text-xs text-green-500">
                                  ({t("saved") || "وفرت"}: {savings.toFixed(2)} ₪)
                                </div>
                              </div>
                            );
                          }
                          
                          // للطلبيات العادية (من الـ checkout) - استخدام الطريقة القديمة
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
                                  const affectedItem = order.items.find((oi: any) => oi.product_id === productId);
                                  if (affectedItem) {
                                    const itemPrice = actualProductPrice || savedPrice;
                                    return sum + (itemPrice * affectedItem.quantity);
                                  }
                                  return sum;
                                }, 0);
                                
                                if (totalAffectedValue > 0) {
                                  const itemPrice = actualProductPrice || savedPrice;
                                  const itemValue = itemPrice * quantity;
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

                          if (hasDiscount && discountAmount > 0) {
                            const basePrice = actualProductPrice || savedPrice;
                            const finalPrice = basePrice - (discountAmount / quantity);
                            const finalTotal = finalPrice * quantity;
                            const originalTotal = basePrice * quantity;
                            const savings = originalTotal - finalTotal;
                            return (
                              <div>
                                <span className="line-through text-gray-400 text-sm">{originalTotal.toFixed(2)} ₪</span>
                                <div className="text-green-600 font-bold">{finalTotal.toFixed(2)} ₪</div>
                                <div className="text-xs text-green-500">
                                  ({t("saved") || "وفرت"}: {savings.toFixed(2)} ₪)
                                </div>
                              </div>
                            );
                          }
                          
                          return `${(savedPrice * quantity).toFixed(2)} ₪`;
                        })()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-4">{t("noProducts") || "لا توجد منتجات"}</td>
                </tr>
              )}
              
              {/* المنتجات المجانية */}
              {(() => {
                let allFreeItems = [];
                
                // الحصول على المنتجات المجانية من العروض المطبقة أولاً
                if (order.applied_offers) {
                  try {
                    const appliedOffers = JSON.parse(order.applied_offers);
                    appliedOffers.forEach((offer: any) => {
                      if (offer.freeProducts && Array.isArray(offer.freeProducts)) {
                        allFreeItems = [...allFreeItems, ...offer.freeProducts];
                      }
                      if (offer.freeItems && Array.isArray(offer.freeItems)) {
                        allFreeItems = [...allFreeItems, ...offer.freeItems];
                      }
                    });
                  } catch {}
                }
                
                // إذا لم توجد منتجات مجانية في العروض، ابحث في order.free_items
                if (allFreeItems.length === 0 && order.free_items) {
                  try {
                    const freeItems = typeof order.free_items === 'string' ? JSON.parse(order.free_items) : order.free_items;
                    if (Array.isArray(freeItems) && freeItems.length > 0) {
                      allFreeItems = [...freeItems];
                    }
                  } catch {}
                }
                
                // إزالة المكررات والعناصر بدون أسماء صحيحة
                const uniqueFreeItems = allFreeItems.reduce((acc: any[], current: any) => {
                  const currentProductId = String(current.productId || current.product_id || current.id || '').trim();
                  
                  // تجاهل العناصر بدون معرف منتج
                  if (!currentProductId) return acc;
                  
                  // البحث عن المنتج في قاعدة البيانات للتأكد من وجود اسم
                  const product = products.find((p) => 
                    p.id === current.productId || 
                    p.id === current.product_id || 
                    p.id === current.id ||
                    String(p.id) === String(current.productId) ||
                    String(p.id) === String(current.product_id) ||
                    String(p.id) === String(current.id)
                  );
                  
                  // الحصول على اسم المنتج
                  let productName = '';
                  if (product) {
                    productName = product[`name_${language}`] || product.name_ar || product.name_en || product.name_he || '';
                  }
                  if (!productName) {
                    productName = current.name_ar || current.name_en || current.name_he || current.name || current.productName || '';
                  }
                  
                  // تجاهل العناصر بدون اسم صحيح (أي التي ستصبح "منتج مجاني")
                  if (!productName || productName.trim() === '') {
                    return acc;
                  }
                  
                  const existing = acc.find(item => {
                    const existingProductId = String(item.productId || item.product_id || item.id || '').trim();
                    return existingProductId === currentProductId;
                  });
                  
                  if (!existing) {
                    acc.push(current);
                  }
                  return acc;
                }, []);
                
                return uniqueFreeItems.length > 0 && uniqueFreeItems.map((item: any, idx: number) => {
                    // البحث عن المنتج في قاعدة البيانات للحصول على الاسم
                    const product = products.find((p) => 
                      p.id === item.productId || 
                      p.id === item.product_id || 
                      p.id === item.id ||
                      String(p.id) === String(item.productId) ||
                      String(p.id) === String(item.product_id) ||
                      String(p.id) === String(item.id)
                    );
                    
                    let productName = '';
                    
                    if (product) {
                      productName = product[`name_${language}`] || product.name_ar || product.name_en || product.name_he || '';
                    }
                    
                    // إذا لم نجد اسم من قاعدة البيانات، نحاول من بيانات العنصر نفسه
                    if (!productName) {
                      productName = item.name_ar || item.name_en || item.name_he || item.name || item.productName || '';
                    }
                    
                    // إذا ما زال فارغ، لا نعرض هذا العنصر
                    if (!productName || productName.trim() === '') {
                      return null;
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
                        profile?.user_type,
                      );
                    } else {
                      // إذا لم نجد المنتج في قاعدة البيانات، نحاول من بيانات العنصر
                      originalPrice = item.originalPrice || item.price || item.original_price || 0;
                    }
                    
                    const quantity = item.quantity || 1;
                  
                    
                    return (
                      <tr key={`free-${idx}`} className="bg-green-50 border-green-200 print:bg-gray-50">
                        <td className="p-2 text-center">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold print:bg-gray-200 print:text-black">
                            🎁
                          </span>
                        </td>
                        <td className="p-2 text-right">
                          <div className="flex flex-col">
                            <span className="font-bold text-green-800 print:text-black">{productName}</span>
                            <span className="text-xs text-green-600 print:text-gray-600 mt-1">
                              🎁 {t("freeItem") || "منتج مجاني"} - {t("fromOffer") || "من العرض"}
                            </span>
                          </div>
                        </td>
                        <td className="p-2 text-center font-bold text-green-700 print:text-black">{quantity}</td>
                        <td className="p-2 text-center">
                          {originalPrice > 0 ? (
                            <div>
                              <span className="line-through text-gray-400 text-sm">{originalPrice.toFixed(2)} ₪</span>
                              <div className="text-green-600 font-bold print:text-black">{t("free") || "مجاني"}</div>
                            </div>
                          ) : (
                            <div className="text-green-600 font-bold print:text-black">{t("free") || "مجاني"}</div>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          <div>
                            {originalPrice > 0 && (
                              <span className="line-through text-gray-400 text-sm">{(originalPrice * quantity).toFixed(2)} ₪</span>
                            )}
                            <div className="text-green-600 font-bold print:text-black">0.00 ₪</div>
                            {originalPrice > 0 && (
                              <div className="text-xs text-green-500 print:text-gray-600 mt-1">
                                💰 {t("saved") || "وفرت"}: {(originalPrice * quantity).toFixed(2)} ₪
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }).filter(Boolean); // إزالة العناصر الفارغة (null)
                })()}
            </tbody>
          </table>
        </div>
      </div>
      {/* تذييل رسمي للطباعة */}
      <div className="print:flex flex-col items-center mt-8 hidden">
        <div className="w-full border-t border-gray-300 my-2" />
        <div className="text-xs text-gray-500 print:text-gray-700">
          {t("generatedByAdminPanel") || "تم توليد هذه الإرسالية إلكترونيًا من خلال لوحة تحكم متجر موبايل بازار"} - {new Date().toLocaleDateString("en-GB")}
        </div>
        <div className="text-xs text-gray-500 print:text-gray-700">
          {t("forInquiries") || "للاستفسار"}: 0599999999 - info@mobilebazaar.ps
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPrint;
