import React from "react";
import { useLanguage } from "@/utils/languageContextUtils";
import {
  Package,
  MapPin,
  FileText,
  Gift,
  Tag,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import OrderStatusBadge from "@/components/ui/OrderStatusBadge";
import FormattedDate from "@/components/ui/FormattedDate";
import { mapOrderFromDb } from "@/utils/orderUtils";
import type { OrdersWithDetails } from "@/integrations/supabase/dataFetchers";
import { decompressText } from "@/utils/commonUtils";
import { getDisplayPrice } from "@/utils/priceUtils";
import { useAuth } from "@/contexts/useAuth";
import { useProductsRealtime } from '@/hooks/useProductsRealtime';

interface OrderDetailsDialogProps {
  order: OrdersWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const { t, language } = useLanguage();
  const { profile } = useAuth();
  const { products } = useProductsRealtime();

  // دالة فك الضغط لملاحظات الطلب
  function safeDecompressNotes(notes: string) {
    try {
      return decompressText(notes);
    } catch {
      return notes;
    }
  }

  if (!order) {
    return null;
  }

  return (
    <>
      {/* Custom Dialog Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={onClose}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-5xl max-h-[90vh] overflow-y-auto w-full"
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '80rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              width: '100%',
              position: 'relative',
              zIndex: 100000,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%'
              }}
            >
              ×
            </button>

            {/* Header */}
            <div className="border-b pb-4 mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2 pr-10">
                <FileText className="h-5 w-5 text-primary" />
                {t("orderDetails") || "تفاصيل الطلبية"}
                <span className="text-primary font-bold">#{order.order_number}</span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {t("orderDetailsDescription") || "عرض جميع تفاصيل الطلبية والمنتجات"}
              </p>
            </div>

            <div className="space-y-6">
              {/* معلومات الطلبية الأساسية */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-base text-gray-800 flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    {t("orderInfo") || "معلومات الطلبية"}
                  </h3>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100 space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">{t("orderNumber")}:</span> 
                      <span className="font-bold text-primary">#{order.order_number}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">{t("orderDate")}:</span> 
                      <FormattedDate date={order.created_at} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">{t("orderStatus")}:</span> 
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">{t("paymentMethod")}:</span> 
                      <span className="font-medium">{(() => {
                        const safeOrder = mapOrderFromDb(order);
                        switch (safeOrder.paymentMethod) {
                          case "cash": return t("cashOnDelivery") || "الدفع عند الاستلام";
                          case "card": return t("creditCard") || "بطاقة ائتمان";
                          case "bank_transfer": return t("bankTransfer") || "تحويل بنكي";
                          default: return safeOrder.paymentMethod;
                        }
                      })()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-base text-gray-800 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {t("shippingAddress") || "عنوان الشحن"}
                  </h3>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100 text-sm">
                    {(() => {
                      const safeOrder = mapOrderFromDb(order);
                      const addr = safeOrder.shippingAddress;
                      if (!addr) return <p className="text-gray-500 italic">-</p>;
                      
                      return (
                        <div className="space-y-2">
                          {addr.fullName && <div className="flex justify-between"><span className="font-medium text-gray-700">{t("fullName")}:</span> <span>{addr.fullName}</span></div>}
                          {addr.phone && <div className="flex justify-between"><span className="font-medium text-gray-700">{t("phone")}:</span> <span dir="ltr">{addr.phone}</span></div>}
                          {addr.city && <div className="flex justify-between"><span className="font-medium text-gray-700">{t("city")}:</span> <span>{addr.city}</span></div>}
                          {addr.area && <div className="flex justify-between"><span className="font-medium text-gray-700">{t("area")}:</span> <span>{addr.area}</span></div>}
                          {addr.street && <div className="flex justify-between"><span className="font-medium text-gray-700">{t("street")}:</span> <span>{addr.street}</span></div>}
                          {addr.building && <div className="flex justify-between"><span className="font-medium text-gray-700">{t("building")}:</span> <span>{addr.building}</span></div>}
                          {addr.floor && <div className="flex justify-between"><span className="font-medium text-gray-700">{t("floor")}:</span> <span>{addr.floor}</span></div>}
                          {addr.apartment && <div className="flex justify-between"><span className="font-medium text-gray-700">{t("apartment")}:</span> <span>{addr.apartment}</span></div>}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* المنتجات بشكل مفصل */}
              <div className="space-y-3">
                <h3 className="font-semibold text-base text-gray-800 flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  {t("orderProducts") || "منتجات الطلبية"}
                  {order.order_items && (
                    <span className="text-sm font-normal text-gray-500">
                      ({order.order_items.length} {t("items") || "عنصر"})
                    </span>
                  )}
                </h3>
                <div className="space-y-3">
                  {order.order_items && order.order_items.length > 0 ? (
                    <>
                      {/* المنتجات العادية */}
                      {order.order_items.map((item) => {
                        // التحقق من وجود خصم على هذا المنتج
                        let hasDiscount = false;
                        let discountAmount = 0;
                        try {
                          const appliedOffers = order.applied_offers 
                            ? (typeof order.applied_offers === 'string' 
                                ? JSON.parse(order.applied_offers) 
                                : order.applied_offers)
                            : [];
                          
                          for (const offer of appliedOffers) {
                            // للعروض العادية وعروض خصم المنتج
                            if ((offer.offer?.offer_type === 'discount' || offer.offer?.offer_type === 'product_discount') 
                                && offer.affectedProducts && offer.affectedProducts.includes(item.product_id)) {
                              hasDiscount = true;
                              // حساب الخصم لهذا المنتج
                              const originalPrice = getDisplayPrice({
                                id: item.products?.id || "",
                                name: item.products?.name_ar || "",
                                nameEn: item.products?.name_en || "",
                                nameHe: item.products?.name_he || "",
                                description: item.products?.description_ar || "",
                                descriptionEn: item.products?.description_en || "",
                                descriptionHe: item.products?.description_he || "",
                                price: item.price,
                                originalPrice: item.products?.original_price,
                                wholesalePrice: item.products?.wholesale_price,
                                image: item.products?.image || "",
                                images: item.products?.images || [],
                                category: "",
                                inStock: typeof item.products?.in_stock === "boolean" ? item.products.in_stock : true,
                                rating: item.products?.rating || 0,
                                reviews: 0,
                                discount: item.products?.discount,
                                featured: item.products?.featured,
                                tags: item.products?.tags || [],
                                stock_quantity: item.products?.stock_quantity,
                                active: item.products?.active,
                                created_at: item.products?.created_at,
                              }, profile?.user_type);
                              
                              // حساب نسبة هذا المنتج من إجمالي الخصم
                              const totalAffectedValue = offer.affectedProducts.reduce((sum: number, productId: string) => {
                                const affectedItem = order.order_items.find((oi: any) => oi.product_id === productId);
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
                              const linkedProductId = offer.offer?.linked_product_id;
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

                        const originalPrice = getDisplayPrice({
                          id: item.products?.id || "",
                          name: item.products?.name_ar || "",
                          nameEn: item.products?.name_en || "",
                          nameHe: item.products?.name_he || "",
                          description: item.products?.description_ar || "",
                          descriptionEn: item.products?.description_en || "",
                          descriptionHe: item.products?.description_he || "",
                          price: item.price,
                          originalPrice: item.products?.original_price,
                          wholesalePrice: item.products?.wholesale_price,
                          image: item.products?.image || "",
                          images: item.products?.images || [],
                          category: "",
                          inStock: typeof item.products?.in_stock === "boolean" ? item.products.in_stock : true,
                          rating: item.products?.rating || 0,
                          reviews: 0,
                          discount: item.products?.discount,
                          featured: item.products?.featured,
                          tags: item.products?.tags || [],
                          stock_quantity: item.products?.stock_quantity,
                          active: item.products?.active,
                          created_at: item.products?.created_at,
                        }, profile?.user_type);

                        const finalPrice = originalPrice - (discountAmount / item.quantity);

                        return (
                        <div key={item.id} className={`border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200 ${hasDiscount ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                          <div className="flex flex-col sm:flex-row gap-3">
                            {/* صورة المنتج */}
                            <div className="flex-shrink-0 mx-auto sm:mx-0 relative">
                              <div 
                                className="w-16 h-16 bg-center bg-contain bg-no-repeat rounded-lg border shadow-sm"
                                style={{ backgroundImage: `url(${item.products?.image})` }}
                              />
                              {hasDiscount && (
                                <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded-full font-bold">
                                  خصم
                                </div>
                              )}
                            </div>
                            
                            {/* تفاصيل المنتج */}
                            <div className="flex-1 space-y-2">
                              <div>
                                <h4 className="font-semibold text-sm text-gray-800 mb-1">
                                  {language === "ar" ? item.products?.name_ar : 
                                   language === "he" ? item.products?.name_he : 
                                   item.products?.name_en}
                                </h4>
                                <p className="text-xs text-gray-600 line-clamp-1">
                                  {language === "ar" ? item.products?.description_ar : 
                                   language === "he" ? item.products?.description_he : 
                                   item.products?.description_en}
                                </p>
                              </div>
                              
                              <div className="grid grid-cols-4 gap-2 text-xs bg-gray-50 p-1 rounded-lg">
                                <div className="text-center">
                                  <span className="block font-medium text-gray-700 mb-1 text-xs">{t("quantity")}</span>
                                  <div className="inline-flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-sm">
                                    <span className="text-sm font-bold">
                                      {item.quantity}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-center">
                                  <span className="block font-medium text-gray-700 mb-1 text-xs">{t("unitPrice")}</span>
                                  {hasDiscount ? (
                                    <div className="space-y-0.5">
                                      <div className="text-xs text-gray-500 line-through">
                                        {originalPrice.toFixed(2)} {t("currency")}
                                      </div>
                                      <div className="font-bold text-green-600 text-sm">
                                        {finalPrice.toFixed(2)} {t("currency")}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="font-semibold text-gray-800 text-sm">
                                      {originalPrice.toFixed(2)} {t("currency")}
                                    </div>
                                  )}
                                </div>
                                <div className="text-center">
                                  <span className="block font-medium text-gray-700 mb-1 text-xs">{t("total")}</span>
                                  {hasDiscount ? (
                                    <div className="space-y-0.5">
                                      <div className="text-xs text-gray-500 line-through">
                                        {(originalPrice * item.quantity).toFixed(2)} {t("currency")}
                                      </div>
                                      <div className="font-bold text-green-600 text-sm">
                                        {(finalPrice * item.quantity).toFixed(2)} {t("currency")}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="font-bold text-primary text-sm">
                                      {(originalPrice * item.quantity).toFixed(2)} {t("currency")}
                                    </div>
                                  )}
                                </div>
                                <div className="text-center">
                                  {hasDiscount ? (
                                    <div>
                                      <span className="block font-medium text-green-700 mb-1">نسبة الخصم</span>
                                      <span className="text-lg bg-green-500 text-white px-1 py-1 rounded font-bold">
                                        {Math.round(((originalPrice - finalPrice) / originalPrice) * 100)}%
                                      </span>
                                      <div className="text-xs text-green-600 mt-1">
                                        وفرت {((originalPrice - finalPrice) * item.quantity).toFixed(2)} {t("currency")}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      <div>
                                        <span className="block font-medium text-gray-500 mb-1 text-xs">حالة</span>
                                        <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 rounded-full border border-gray-200">
                                          <span className="text-xs">عادي</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                      
                      {/* المنتجات المجانية */}
                      {(() => {
                        let allFreeItems = [];
                        
                        // الحصول على المنتجات المجانية من العروض المطبقة
                        try {
                          const appliedOffers = order.applied_offers 
                            ? (typeof order.applied_offers === 'string' 
                                ? JSON.parse(order.applied_offers) 
                                : order.applied_offers)
                            : [];
                          
                          appliedOffers.forEach((offer: any) => {
                            if (offer.freeProducts && Array.isArray(offer.freeProducts)) {
                              allFreeItems = [...allFreeItems, ...offer.freeProducts];
                            }
                            if (offer.freeItems && Array.isArray(offer.freeItems)) {
                              allFreeItems = [...allFreeItems, ...offer.freeItems];
                            }
                          });
                        } catch {}
                        
                        // إزالة المكررات
                        const uniqueFreeItems = allFreeItems.reduce((acc: any[], current: any) => {
                          const currentProductId = String(current.productId || current.product_id || current.id || '').trim();
                          
                          if (!currentProductId) return acc;
                          
                          const existing = acc.find(item => {
                            const existingProductId = String(item.productId || item.product_id || item.id || '').trim();
                            return existingProductId === currentProductId;
                          });
                          
                          if (!existing) {
                            acc.push(current);
                          }
                          return acc;
                        }, []);
                        
                        return uniqueFreeItems.length > 0 && uniqueFreeItems.map((freeItem: any, index: number) => {
                          // البحث عن المنتج في قاعدة البيانات مباشرة
                          const product = products.find((p) => 
                            p.id === freeItem.productId || 
                            p.id === freeItem.product_id ||
                            String(p.id) === String(freeItem.productId) ||
                            String(p.id) === String(freeItem.product_id)
                          );
                          
                          let productName = '';
                          if (product) {
                            productName = language === "ar" ? product.name_ar :
                                        language === "he" ? product.name_he :
                                        product.name_en || product.name_ar;
                          }
                          
                          if (!productName) {
                            productName = freeItem.name_ar || freeItem.name_en || freeItem.name_he || 
                                         freeItem.name || freeItem.productName || t("unknownProduct") || "منتج غير معروف";
                          }
                          
                          if (!productName || productName.trim() === '') {
                            return null;
                          }
                          
                          const quantity = freeItem.quantity || 1;
                          
                          // الحصول على السعر الأصلي
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
                            originalPrice = freeItem.originalPrice || freeItem.price || freeItem.original_price || 0;
                          }
                          
                          return (
                            <div key={`free-${index}`} className="border border-green-200 rounded-lg p-2 bg-green-50 shadow-sm">
                              <div className="flex flex-col sm:flex-row gap-2">
                                {/* صورة المنتج */}
                                <div className="flex-shrink-0 mx-auto sm:mx-0 relative">
                                  <div 
                                    className="w-12 h-12 bg-center bg-contain bg-no-repeat rounded-lg border border-green-300 shadow-sm"
                                    style={{ backgroundImage: `url(${product?.image})` }}
                                  />
                                  <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded-full font-bold">
                                    مجاني
                                  </div>
                                </div>
                                
                                {/* تفاصيل المنتج */}
                                <div className="flex-1 space-y-1">
                                  <div>
                                    <h4 className="font-semibold text-sm text-green-800 mb-0.5">
                                      🎁 {productName}
                                    </h4>
                                    <p className="text-xs text-green-700">
                                      {t("freeItem") || "منتج مجاني"} - {t("fromOffer") || "من العرض"}
                                    </p>
                                  </div>
                                  
                                  <div className="grid grid-cols-3 gap-2 text-xs bg-white p-2 rounded border border-green-200">
                                    <div className="text-center">
                                      <span className="block font-medium text-green-700 mb-1">{t("quantity")}</span>
                                      <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                        {quantity}
                                      </span>
                                    </div>
                                    <div className="text-center">
                                      <span className="block font-medium text-green-700 mb-1">القيمة</span>
                                      {originalPrice > 0 ? (
                                        <span className="font-semibold text-green-600 text-xs line-through">
                                          {originalPrice.toFixed(2)} {t("currency")}
                                        </span>
                                      ) : (
                                        <span className="font-semibold text-green-600 text-xs">
                                          0 {t("currency")}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-center">
                                      <span className="block font-medium text-green-700 mb-1">التوفير</span>
                                      <span className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded font-bold">
                                        {originalPrice > 0 ? `${(originalPrice * quantity).toFixed(2)} ${t("currency")}` : "🎁"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }).filter(Boolean);
                      })()}
                    </>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">{t("noProductsFound") || "لا توجد منتجات"}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* العروض المطبقة - مبسط */}
              {(() => {
                try {
                  const appliedOffers = order.applied_offers 
                    ? (typeof order.applied_offers === 'string' 
                        ? JSON.parse(order.applied_offers) 
                        : order.applied_offers)
                    : null;
                  
                  if (appliedOffers && appliedOffers.length > 0) {
                    return (
                      <div className="border-t pt-2">
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                          <h4 className="font-semibold text-orange-800 mb-1 flex items-center gap-1 text-sm">
                            🎁 العروض ({appliedOffers.length})
                          </h4>
                          <div className="text-sm text-orange-700">
                            إجمالي الخصم من العروض: <span className="font-bold">{appliedOffers.reduce((sum: number, offer: any) => sum + (offer.discountAmount || 0), 0).toFixed(2)} {t("currency")}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                } catch (error) {
                  return null;
                }
              })()}

              {/* ملخص الطلبية */}
              <div className="border-t pt-3">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 space-y-2">
                  {/* عرض معلومات الخصم إذا كان موجوداً */}
                  {order.discount_value && order.discount_value > 0 ? (
                    <>
                      {/* السعر الأصلي مع خط عليه */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-600">{t("orderTotal")}:</span>
                        <span className="text-lg text-gray-500 line-through">
                          {order.total?.toFixed(2) || "-"} {t("currency")}
                        </span>
                      </div>
                      
                      <div className="border-t border-green-300 pt-2 space-y-2">
                        <h4 className="font-semibold text-green-700 mb-1 text-sm">{t("discount")}:</h4>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="flex flex-col items-center bg-white p-2 rounded border">
                            <span className="font-medium text-gray-700 mb-1">النوع</span>
                            <span className="text-green-600 font-medium">
                              {order.discount_type === "percent" ? "نسبة" : "ثابت"}
                            </span>
                          </div>
                          <div className="flex flex-col items-center bg-white p-2 rounded border">
                            <span className="font-medium text-gray-700 mb-1">القيمة</span>
                            <span className="text-green-600 font-medium">
                              {order.discount_type === "percent"
                                ? `${order.discount_value?.toFixed(0)}%` 
                                : `${order.discount_value?.toFixed(0)} ${t("currency")}`}
                            </span>
                          </div>
                          {/* المبلغ الموفر */}
                          {order.discount_type === "percent" && (
                            <div className="flex flex-col items-center bg-white p-2 rounded border">
                              <span className="font-medium text-gray-700 mb-1">التوفير</span>
                              <span className="text-green-600 font-bold text-xs">
                                {(() => {
                                  const total = order.total || 0;
                                  const totalAfterDiscount = order.total_after_discount || 
                                    (order.discount_value 
                                      ? total * (1 - order.discount_value / 100)
                                      : total);
                                  const savings = total - totalAfterDiscount;
                                  return `${savings.toFixed(2)} ${t("currency")}`;
                                })()}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* المجموع النهائي بعد الخصم */}
                        <div className="border-t border-green-300 pt-3">
                          <div className="flex justify-between items-center bg-green-100 p-3 rounded-lg">
                            <span className="text-lg font-bold text-green-800">{t("totalAfterDiscount")}:</span>
                            <span className="text-2xl font-bold text-green-600">
                              {order.total_after_discount?.toFixed(2) || 
                               (order.total && order.discount_value 
                                ? order.discount_type === "percent"
                                  ? (order.total * (1 - order.discount_value / 100)).toFixed(2)
                                  : (order.total - order.discount_value).toFixed(2)
                                : "-")} {t("currency")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* حساب خصم العروض وعرض السعر مثل السلة والـ Checkout */
                    (() => {
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
                      
                      return (
                        <div className="space-y-2">
                          {/* السعر الفرعي */}
                          <div className="flex justify-between text-sm">
                            <span>{t("subtotal")}</span>
                            <span className={totalOffersDiscount > 0 ? "line-through text-gray-500" : ""}>
                              {originalTotal.toFixed(2)} {t("currency")}
                            </span>
                          </div>
                          
                          {/* خصم العروض */}
                          {totalOffersDiscount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                              <span className="flex items-center gap-1">
                                <Tag className="h-4 w-4" />
                                {t("offersDiscount") || "خصم العروض"}
                              </span>
                              <span>-{totalOffersDiscount.toFixed(2)} {t("currency")}</span>
                            </div>
                          )}
                          
                          {/* الشحن */}
                          <div className="flex justify-between text-sm">
                            <span>{t("shipping")}</span>
                            <span className="text-green-600">{t("free")}</span>
                          </div>
                          
                          <Separator />
                          
                          {/* الإجمالي النهائي */}
                          <div className="flex justify-between items-center text-lg font-bold">
                            <span>{t("orderTotal")}:</span>
                            <div className="text-right">
                              <span className="text-2xl font-bold text-primary">
                                {finalTotal.toFixed(2)} {t("currency")}
                              </span>
                              {totalOffersDiscount > 0 && (
                                <div className="text-xs text-green-600 font-normal">
                                  {t("youSave") || "وفرت"}: {totalOffersDiscount.toFixed(2)} {t("currency")}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>

              {/* ملاحظات الطلبية */}
              {(() => {
                const safeOrder = mapOrderFromDb(order);
                return safeOrder.notes ? (
                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-base text-gray-800 flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-primary" />
                      {t("orderNotes") || "ملاحظات الطلبية"}
                    </h3>
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {safeDecompressNotes(safeOrder.notes)}
                      </p>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderDetailsDialog;
