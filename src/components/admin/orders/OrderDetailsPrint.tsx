import React from "react";
import { Button } from "@/components/ui/button";
import { Copy, MapPin, Package, UserPlus } from "lucide-react";
import { getDisplayPrice } from "@/utils/priceUtils";
import { safeDecompressNotes } from "@/orders/order.utils";
import { getPaymentMethodText } from "@/orders/order.utils";
import type { Order, OrderItem } from "@/orders/order.types";
import type { Product } from "@/types";
import OrderTotalDisplay from "@/components/OrderTotalDisplay";

interface OrderDetailsPrintProps {
  order: Order;
  t: any;
  profile?: any;
  generateWhatsappMessage: (order: Order, t: any) => string;
}

const OrderDetailsPrint: React.FC<OrderDetailsPrintProps> = ({ order, t, profile, generateWhatsappMessage }) => {
  return (
    <div
      className="space-y-6 px-6 py-6 print:p-0 print:space-y-4 print:bg-white print:text-black print:rounded-none print:shadow-none print:w-full print:max-w-full print:mx-0 print:my-0"
      id="print-order-details"
    >
      {/* رأس الورقة للطباعة */}
      <div className="print:flex print:flex-col print:items-center print:mb-6 hidden">
        <img src="/favicon.ico" alt="logo" className="h-14 w-14 mb-2" />
        <div className="text-2xl font-bold text-primary print:text-black">متجر موبايل بازار</div>
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
          <OrderTotalDisplay order={order} t={t} />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="font-bold flex items-center gap-1 px-4 py-2 border-green-500 text-green-700 hover:bg-green-50"
              style={{ borderWidth: 2 }}
              onClick={() => {
                const msg = encodeURIComponent(generateWhatsappMessage(order, t));
                window.open(`https://wa.me/?text=${msg}`, "_blank");
              }}
            >
              <Copy className="h-4 w-4" /> {t("shareOnWhatsapp") || "مشاركة عبر واتساب"}
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
                <th className="p-2 font-bold">{t("product") || "المنتج"}</th>
                <th className="p-2 font-bold">{t("quantity") || "الكمية"}</th>
                <th className="p-2 font-bold">{t("price") || "السعر"}</th>
                <th className="p-2 font-bold">{t("total") || "المجموع"}</th>
              </tr>
            </thead>
            <tbody>
              {order.items && order.items.length > 0 ? (
                order.items.map((item: OrderItem, idx: number) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50 print:hover:bg-transparent">
                    <td className="p-2 text-center">{idx + 1}</td>
                    <td className="p-2">{item.product_name}</td>
                    <td className="p-2 text-center">{item.quantity}</td>
                    <td className="p-2 text-center">{getDisplayPrice(([] as Product[]).find((p) => p.id === item.product_id) as Product, profile?.user_type) || item.price} ₪</td>
                    <td className="p-2 text-center font-semibold">{(item.price * item.quantity).toFixed(2)} ₪</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-4">{t("noProducts") || "لا توجد منتجات"}</td>
                </tr>
              )}
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
