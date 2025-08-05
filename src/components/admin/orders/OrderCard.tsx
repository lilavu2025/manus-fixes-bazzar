import React from "react";
import { Card, CardHeader, CardContent } from "../../ui/card";
import { Eye, Copy, UserPlus, XCircle, Tag } from "lucide-react";
import { Order, OrderItem, Address } from "@/orders/order.types";
import { getPaymentMethodText, getStatusColor, safeDecompressNotes } from "@/orders/order.utils";
import { mapOrderFromDb } from "@/orders/order.helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getDisplayPrice } from "@/utils/priceUtils";
import OrderTotalDisplay from "@/components/OrderTotalDisplay";
import OrderOffersDisplay from "@/components/orders/OrderOffersDisplay";

interface OrderCardProps {
  order: Order;
  orders: Order[];
  t: any;
  onShowDetails: (order: Order) => void;
  onPrintOrder?: (order: Order) => void;
  onDownloadPdf?: (order: Order) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  orders,
  t,
  onShowDetails,
  onPrintOrder,
  onDownloadPdf,
  onEdit,
  onDelete,
  onUpdateStatus,
}) => {
  // فك العناصر إذا كانت نصية
  let items: OrderItem[] = [];
  if (typeof order.items === "string") {
    try {
      items = JSON.parse(order.items);
    } catch {
      items = [];
    }
  } else if (Array.isArray(order.items)) {
    items = order.items as OrderItem[];
  }

  return (
    <div className="p-2 w-full min-h-[240px] sm:min-h-0">
      <Card className="relative h-full flex flex-col justify-between border shadow-md rounded-xl transition-all duration-200 bg-white">
        <CardHeader className="bg-gray-50 border-b flex flex-col gap-2 p-4 rounded-t-xl">
          <div className="flex flex-col gap-1">
            <div className="font-bold text-xs text-gray-700 print:text-black">
              {t("orderNumber")}: <span className="font-bold">{order.order_number}</span>
            </div>
            <span className="font-bold text-lg text-Black">
              {order.customer_name?.trim()
                ? order.customer_name
                : order.profiles?.full_name || t("notProvided")}
            </span>
            <div className="flex items-center gap-1">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full max-w-full">
                {order.admin_created && (
                  <div className="relative group w-fit max-w-full">
                    <Badge className="ml-0 bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1 animate-pulse cursor-pointer text-[11px] px-2 py-0.5 w-fit max-w-[90vw] sm:max-w-xs whitespace-normal break-words overflow-hidden block">
                      <UserPlus className="h-4 w-4 min-w-[16px] min-h-[16px]" />
                      <span className="block">{t("admin")}</span>
                    </Badge>
                    <div className="absolute z-20 hidden group-hover:block bg-white border shadow-lg rounded-lg px-3 py-2 text-xs text-gray-700 top-8 right-0 whitespace-nowrap">
                      {order.admin_creator_name
                        ? `${t("createdBy")}: ${order.admin_creator_name}`
                        : t("createdByAdmin")}
                    </div>
                  </div>
                )}
                {order.status === "cancelled" && order.cancelled_by && (
                  <Badge
                    className="ml-0 mt-1 bg-red-100 text-red-800 border-red-200 animate-pulse cursor-pointer text-[11px] px-2 py-0.5 w-fit max-w-[90vw] sm:max-w-xs whitespace-normal break-words overflow-hidden block"
                    style={{ lineHeight: "1.2", fontWeight: 600 }}
                  >
                    <span className="inline-flex items-center gap-1">
                      <XCircle className="h-4 w-4 min-w-[16px] min-h-[16px]" />
                      <span className="block">
                        {order.cancelled_by === "admin"
                          ? t("cancelledByAdmin")
                          : t("cancelledByUser")}
                        {order.cancelled_by_name ? ` (${order.cancelled_by_name})` : ""}
                      </span>
                    </span>
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center text-xs text-gray-500 mt-1">
              <span>{new Date(order.created_at).toLocaleDateString("en-GB")}</span>
              <span>|</span>
              {/* عرض الإجمالي مع خصم العروض */}
              {(() => {
                const appliedOffersData = order.applied_offers 
                  ? (typeof order.applied_offers === 'string' 
                      ? JSON.parse(order.applied_offers) 
                      : order.applied_offers)
                  : [];
                
                const totalOffersDiscount = appliedOffersData.reduce((sum: number, offer: any) => 
                  sum + (offer.discountAmount || 0), 0);
                
                const finalTotal = order.total || 0;
                const originalTotal = finalTotal + totalOffersDiscount;
                
                if (totalOffersDiscount > 0) {
                  return (
                    <span className="text-green-600 font-medium">
                      <span className="line-through text-gray-500">{originalTotal.toFixed(2)}</span>
                      {" "}
                      <span>{finalTotal.toFixed(2)} {t("currency") || "₪"}</span>
                      {" "}
                      <span className="text-xs">(وفرت {totalOffersDiscount.toFixed(2)})</span>
                    </span>
                  );
                } else {
                  return <span className="font-medium">{finalTotal.toFixed(2)} {t("currency") || "₪"}</span>;
                }
              })()}
              <span>|</span>
              <span>{getPaymentMethodText(order.payment_method, t)}</span>
              <span>|</span>
              <Badge className={`text-base px-3 py-1 rounded-full font-semibold ${getStatusColor(order.status)}`}>
                {t(order.status)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-2">
            {order.notes && (
              <div className="mb-1 text-xs text-gray-500">
                {t("orderNotes")}: {safeDecompressNotes(order.notes)}
              </div>
            )}
            
            {/* العروض المطبقة - عرض مبسط */}
            {(() => {
              // التحقق من وجود عروض أو عناصر مجانية أو خصم بشكل صحيح
              const hasAppliedOffers = order.applied_offers && order.applied_offers.trim() !== '' && order.applied_offers !== '[]';
              const hasFreeItems = order.free_items && order.free_items.trim() !== '' && order.free_items !== '[]';
              const hasOffersDiscount = order.discount_from_offers && order.discount_from_offers > 0;
              
              if (!hasAppliedOffers && !hasFreeItems && !hasOffersDiscount) {
                return null;
              }
              
              return (
                <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-500 rounded-r-lg">
                  
                  {/* العناصر المجانية */}
                  {(() => {
                  try {
                    let allFreeItems: any[] = [];
                    
                    // الحصول على المنتجات المجانية من العروض المطبقة أولاً
                    if (order.applied_offers) {
                      const appliedOffers = JSON.parse(order.applied_offers);
                      appliedOffers.forEach((offer: any) => {
                        if (offer.freeProducts && Array.isArray(offer.freeProducts)) {
                          allFreeItems = [...allFreeItems, ...offer.freeProducts];
                        }
                        if (offer.freeItems && Array.isArray(offer.freeItems)) {
                          allFreeItems = [...allFreeItems, ...offer.freeItems];
                        }
                      });
                    }
                    
                    // إذا لم توجد منتجات مجانية في العروض، ابحث في order.free_items
                    if (allFreeItems.length === 0 && order.free_items) {
                      const freeItems = typeof order.free_items === 'string' ? JSON.parse(order.free_items) : order.free_items;
                      if (Array.isArray(freeItems) && freeItems.length > 0) {
                        allFreeItems = [...freeItems];
                      }
                    }
                    
                    // إزالة المكررات والعناصر بدون أسماء صحيحة
                    const uniqueFreeItems = allFreeItems.reduce((acc: any[], current: any) => {
                      const currentProductId = String(current.productId || current.product_id || current.id || '').trim();
                      
                      // تجاهل العناصر بدون معرف منتج
                      if (!currentProductId) return acc;
                      
                      // الحصول على اسم المنتج
                      let productName = '';
                      productName = current.name_ar || current.name_en || current.name_he || current.name || current.productName || '';
                      
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
                    
                    if (uniqueFreeItems.length === 0) {
                      return null;
                    }
                    
                    return (
                      <div className="mb-2">
                        <div className="text-xs text-blue-700 font-medium">🎁 عناصر مجانية:</div>
                        <div className="text-sm text-blue-800 bg-blue-100 px-2 py-1 rounded mt-1">
                          {(() => {
                            const validItems = [];
                            for (let i = 0; i < uniqueFreeItems.length; i++) {
                              const item = uniqueFreeItems[i];
                              let productName = item.name_ar || item.name_en || item.name_he || item.name || item.productName || '';
                              
                              if (productName && productName.trim() !== '') {
                                const quantity = item.quantity || 1;
                                validItems.push(
                                  <div key={i}>
                                    {productName} x{quantity}
                                  </div>
                                );
                              }
                            }
                            return validItems;
                          })()}
                        </div>
                      </div>
                    );
                  } catch {
                    return null;
                  }
                })()}

                {/* إجمالي الخصم */}
                {order.discount_from_offers && order.discount_from_offers > 0 && (
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-orange-700">💰 إجمالي توفير من العروض:</span>
                      <span className="text-orange-600 text-lg">-{order.discount_from_offers}₪</span>
                    </div>
                  </div>
                )}
                </div>
              );
            })()}
          </div>
          {/* أزرار التفاصيل والمشاركة */}
          <div className="flex flex-wrap gap-2 justify-center items-center mt-4 mb-2 w-full">
            <Button
              size="sm"
              variant="default"
              className="font-bold flex items-center gap-1 px-3 py-2 min-w-[90px] flex-1 sm:flex-none"
              onClick={() => onShowDetails(order)}
            >
              <Eye className="h-4 w-4" /> {t("details")}
            </Button>
            {onPrintOrder && (
              <Button
                size="sm"
                variant="outline"
                className="font-bold flex items-center gap-1 px-3 py-2 border-blue-500 text-blue-700 hover:bg-blue-50 min-w-[90px] flex-1 sm:flex-none"
                style={{ borderWidth: 2, background: '#2563eb', color: 'white' }}
                onClick={() => onPrintOrder(order)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" className="h-4 w-4"><path d="M19 8h-1V3H6v5H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h1v3h12v-3h1c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2zm-3 13H8v-5h8v5zm3-7c0 .55-.45 1-1 1H5c-.55 0-1-.45-1-1v-7c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v7z"></path></svg>
                {t("orderPrint") || "طباعة الطلبية"}
              </Button>
            )}
            {/* زر تحميل PDF */}
            <Button
              size="sm"
              variant="outline"
              className="font-bold flex items-center gap-1 px-3 py-2 border-green-500 text-green-700 hover:bg-green-50 min-w-[90px] flex-1 sm:flex-none"
              style={{ borderWidth: 2, background: '#22c55e', color: 'white' }}
              onClick={() => onDownloadPdf && onDownloadPdf(order)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" className="h-4 w-4"><path d="M5 20h14v-2H5v2zm7-18C8.13 2 5 5.13 5 9c0 3.87 3.13 7 7 7s7-3.13 7-7c0-3.87-3.13-7-7-7zm1 10h-2V7h2v5z"/></svg>
              {t("downloadPdf") || "تحميل PDF"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="font-bold flex items-center gap-1 px-3 py-2  bg-yellow-500 text-white border-yellow-600 hover:bg-white hover:text-yellow-700 hover:border-yellow-500 flex-1 sm:flex-none"
              style={{ borderWidth: 2 }}
              onClick={() => onEdit(order)}
            >
              {t("edit")}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="font-bold flex items-center gap-1 px-3 py-2 border-red-500 text-white hover:bg-red-50 hover:text-red-500 min-w-[90px] flex-1 sm:flex-none"
              style={{ borderWidth: 2 }}
              onClick={() => onDelete(order)}
            >
              {t("delete")}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button
              size="sm"
              variant={order.status === "pending" ? "default" : "outline"}
              className={`flex-1 min-w-[110px] ${order.status === "pending" ? "bg-yellow-500 text-white font-bold border-yellow-600" : ""}`}
              onClick={() => onUpdateStatus(order.id, "pending")}
              disabled={order.status === "pending"}
            >
              {t("pending")}
            </Button>
            <Button
              size="sm"
              variant={order.status === "processing" ? "default" : "outline"}
              className={`flex-1 min-w-[110px] ${order.status === "processing" ? "bg-blue-600 text-white font-bold border-blue-700" : ""}`}
              onClick={() => onUpdateStatus(order.id, "processing")}
              disabled={order.status === "processing"}
            >
              {t("processing")}
            </Button>
            <Button
              size="sm"
              variant={order.status === "shipped" ? "default" : "outline"}
              className={`flex-1 min-w-[110px] ${order.status === "shipped" ? "bg-purple-600 text-white font-bold border-purple-700" : ""}`}
              onClick={() => onUpdateStatus(order.id, "shipped")}
              disabled={order.status === "shipped" || order.status === "delivered"}
            >
              {t("shipped")}
            </Button>
            <Button
              size="sm"
              variant={order.status === "delivered" ? "default" : "outline"}
              className={`flex-1 min-w-[110px] ${order.status === "delivered" ? "bg-green-600 text-white font-bold border-green-700" : ""}`}
              onClick={() => onUpdateStatus(order.id, "delivered")}
              disabled={order.status === "delivered"}
            >
              {t("delivered")}
            </Button>
            <Button
              size="sm"
              variant={order.status === "cancelled" ? "destructive" : "outline"}
              className={`flex-1 min-w-[110px] ${order.status === "cancelled" ? "bg-red-600 text-white font-bold border-red-700" : ""}`}
              onClick={() => onUpdateStatus(order.id, "cancelled")}
              disabled={order.status === "cancelled" || order.status === "delivered"}
            >
              {t("cancel")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderCard;
