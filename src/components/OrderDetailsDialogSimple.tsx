import React from "react";
import { useLanguage } from "@/utils/languageContextUtils";
import {
  Package,
  MapPin,
  FileText,
} from "lucide-react";
import OrderStatusBadge from "@/components/ui/OrderStatusBadge";
import FormattedDate from "@/components/ui/FormattedDate";
import { mapOrderFromDb } from "@/utils/orderUtils";
import type { OrdersWithDetails } from "@/integrations/supabase/dataFetchers";
import { decompressText } from "@/utils/commonUtils";

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
                    order.order_items.map((item) => (
                      <div key={item.id} className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* صورة المنتج */}
                          <div className="flex-shrink-0 mx-auto sm:mx-0">
                            <div 
                              className="w-24 h-24 bg-center bg-contain bg-no-repeat rounded-lg border shadow-sm"
                              style={{ backgroundImage: `url(${item.products?.image})` }}
                            />
                          </div>
                          
                          {/* تفاصيل المنتج */}
                          <div className="flex-1 space-y-3">
                            <div>
                              <h4 className="font-semibold text-lg text-gray-800 mb-1">
                                {language === "ar" ? item.products?.name_ar : 
                                 language === "he" ? item.products?.name_he : 
                                 item.products?.name_en}
                              </h4>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {language === "ar" ? item.products?.description_ar : 
                                 language === "he" ? item.products?.description_he : 
                                 item.products?.description_en}
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm bg-gray-50 p-3 rounded-lg">
                              <div className="text-center sm:text-right">
                                <span className="block font-medium text-gray-700 mb-1">{t("quantity")}</span>
                                <span className="bg-primary text-white px-2 py-1 rounded-full text-xs font-bold">
                                  {item.quantity}
                                </span>
                              </div>
                              <div className="text-center sm:text-right">
                                <span className="block font-medium text-gray-700 mb-1">{t("unitPrice")}</span>
                                <span className="font-semibold text-gray-800">
                                  {item.price.toFixed(2)} {t("currency")}
                                </span>
                              </div>
                              <div className="text-center sm:text-right">
                                <span className="block font-medium text-gray-700 mb-1">{t("total")}</span>
                                <span className="font-bold text-primary text-lg">
                                  {(item.price * item.quantity).toFixed(2)} {t("currency")}
                                </span>
                              </div>
                              <div className="text-center sm:text-right">
                                <span className="block font-medium text-gray-700 mb-1">{t("productId")}</span>
                                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded font-mono">
                                  {item.product_id.slice(-8)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">{t("noProductsFound") || "لا توجد منتجات"}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ملخص الطلبية */}
              <div className="border-t pt-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 space-y-3">
                  {/* عرض معلومات الخصم إذا كان موجوداً */}
                  {order.discount_value && order.discount_value > 0 ? (
                    <>
                      {/* السعر الأصلي مع خط عليه */}
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-600">{t("orderTotal")}:</span>
                        <span className="text-xl text-gray-500 line-through">
                          {order.total?.toFixed(2) || "-"} {t("currency")}
                        </span>
                      </div>
                      
                      <div className="border-t border-green-300 pt-3 space-y-2">
                        <h4 className="font-semibold text-green-700 mb-2">{t("discount")}:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                          <div className="flex justify-between items-center bg-white p-2 rounded border">
                            <span className="font-medium text-gray-700">{t("discountType")}:</span>
                            <span className="text-green-600 font-medium">
                              {/* استخدام discount_type المباشر من قاعدة البيانات */}
                              {order.discount_type === "percent" ? t("percent") : t("fixedAmount")}
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-white p-2 rounded border">
                            <span className="font-medium text-gray-700">{t("discountValue")}:</span>
                            <span className="text-green-600 font-medium">
                              {/* عرض النسبة المئوية أو المبلغ الثابت بناءً على النوع */}
                              {order.discount_type === "percent"
                                ? `${order.discount_value?.toFixed(0)}%` 
                                : `${order.discount_value?.toFixed(2)} ${t("currency")}`}
                            </span>
                          </div>
                          {/* المبلغ الموفر - يظهر فقط للنسبة المئوية */}
                          {order.discount_type === "percent" && (
                            <div className="flex justify-between items-center bg-white p-2 rounded border">
                              <span className="font-medium text-gray-700">{t("savings") || "المبلغ الموفر"}:</span>
                              <span className="text-green-600 font-bold">
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
                    /* السعر العادي بدون خصم */
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-800">{t("orderTotal")}:</span>
                      <span className="text-2xl font-bold text-primary">
                        {order.total?.toFixed(2) || "-"} {t("currency")}
                      </span>
                    </div>
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
