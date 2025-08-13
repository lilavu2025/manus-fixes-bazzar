import React from "react";
import { useLanguage } from "@/utils/languageContextUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  console.log("OrderDetailsDialog rendered:", { order: !!order, isOpen });



  // دالة فك الضغط لملاحظات الطلب
  function safeDecompressNotes(notes: string) {
    try {
      return decompressText(notes);
    } catch {
      return notes;
    }
  }

  if (!order) {
    console.log("OrderDetailsDialog: No order provided, returning null");
    return null;
  }

  console.log("OrderDetailsDialog: Rendering dialog with order:", order.id);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log("Dialog onOpenChange called with:", open);
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent 
        className="max-w-5xl max-h-[95vh] overflow-y-auto w-[95vw] z-[9999]"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          background: 'white'
        }}
      >
        {!order ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">{t("orderDetailsNotFound") || "تفاصيل الطلبية غير موجودة"}</p>
          </div>
        ) : (
          <>
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                {t("orderDetails") || "تفاصيل الطلبية"}
                <span className="text-primary font-bold">#{order.order_number}</span>
              </DialogTitle>
              <DialogDescription className="text-sm">
                {t("orderDetailsDescription") || "عرض جميع تفاصيل الطلبية والمنتجات"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-4">
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
                  <FormattedDate date={order.created_at} format="full" />
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
                            {language === "ar" ? item.products?.name_ar : item.products?.name_en}
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {language === "ar" ? item.products?.description_ar : item.products?.description_en}
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
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">{t("orderTotal")}:</span>
                <span className="text-2xl font-bold text-primary">
                  {order.total?.toFixed(2) || "-"} {t("currency")}
                </span>
              </div>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
