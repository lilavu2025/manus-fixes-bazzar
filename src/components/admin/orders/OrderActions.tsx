import React from "react";
import { Button } from "@/components/ui/button";
import { Eye, Copy } from "lucide-react";
import { Order, OrderItem } from "@/orders/order.types";
import { Address } from "@/types";

interface OrderActionsProps {
  order: Order;
  orders: Order[];
  t: (key: string) => string;
  setSelectedOrder: (order: Order) => void;
  mapOrderFromDb: (order: any) => Order;
  setEditOrderId: (id: string) => void;
  setEditOrderForm: (form: any) => void;
  setOriginalOrderForEdit: (order: Order) => void;
  setShowEditOrder: (show: boolean) => void;
  safeDecompressNotes: (notes: string) => string;
  generateOrderPrint: (order: Order) => string;
  setOrderToDelete: (order: Order) => void;
  setShowDeleteDialog: (show: boolean) => void;
}

const OrderActions: React.FC<OrderActionsProps> = ({
  order,
  orders,
  t,
  setSelectedOrder,
  mapOrderFromDb,
  setEditOrderId,
  setEditOrderForm,
  setOriginalOrderForEdit,
  setShowEditOrder,
  safeDecompressNotes,
  generateOrderPrint: generateOrderPrint,
  setOrderToDelete,
  setShowDeleteDialog,
}) => {
  return (
    <div className="flex flex-wrap gap-2 justify-center items-center mt-4 mb-2 w-full">
      <Button
        size="sm"
        variant="default"
        className="font-bold flex items-center gap-1 px-3 py-2 min-w-[90px] flex-1 sm:flex-none"
        onClick={() => {
          const latestOrder = Array.isArray(orders)
            ? orders.find((o) => o.id === order.id) || order
            : order;
          let items: OrderItem[] = [];
          if (typeof latestOrder.items === "string") {
            try {
              items = JSON.parse(latestOrder.items);
            } catch {
              items = [];
            }
          } else if (Array.isArray(latestOrder.items)) {
            items = latestOrder.items as OrderItem[];
          }
          let shipping_address: Address = {} as Address;
          if (
            latestOrder.shipping_address &&
            typeof latestOrder.shipping_address === "object"
          ) {
            shipping_address = latestOrder.shipping_address as Address;
          } else if (typeof latestOrder.shipping_address === "string") {
            try {
              shipping_address = JSON.parse(latestOrder.shipping_address);
            } catch {
              shipping_address = {} as Address;
            }
          }
          setSelectedOrder(
            mapOrderFromDb({
              ...latestOrder,
              items,
              shipping_address,
            })
          );
        }}
      >
        <Eye className="h-4 w-4" /> {t("details") || "تفاصيل"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="font-bold flex items-center gap-1 px-3 py-2 border-green-500 text-green-700 hover:bg-green-50 min-w-[90px] flex-1 sm:flex-none"
        style={{ borderWidth: 2 }}
        onClick={() => {
          const msg = encodeURIComponent(generateOrderPrint(order));
          window.open(`https://wa.me/?text=${msg}`, "_blank");
        }}
      >
        <Copy className="h-4 w-4" /> {t("shareOnWhatsapp") || "مشاركة عبر واتساب"}
      </Button>
      {/* زر التعديل */}
      <Button
        size="sm"
        variant="secondary"
        className="font-bold flex items-center gap-1 px-3 py-2 border-blue-500 text-blue-700 hover:bg-blue-50 min-w-[90px] flex-1 sm:flex-none"
        style={{ borderWidth: 2 }}
        onClick={() => {
          const latestOrder = orders.find((o) => o.id === order.id) || order;
          let items: OrderItem[] = [];
          if (
            "order_items" in latestOrder &&
            Array.isArray((latestOrder as { order_items?: unknown }).order_items) &&
            ((latestOrder as { order_items: unknown[] }).order_items.length > 0)
          ) {
            type OrderItemDB = {
              id: string;
              product_id: string;
              quantity: number;
              price: number;
              products?: { name_ar?: string; name_en?: string; name_he?: string };
            };
            items = (latestOrder as { order_items: OrderItemDB[] }).order_items.map((item) => ({
              id: item.id,
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price,
              product_name:
                item.products?.name_ar ||
                item.products?.name_en ||
                item.products?.name_he ||
                item.id,
            }));
          } else if (typeof latestOrder.items === "string") {
            try {
              items = JSON.parse(latestOrder.items);
            } catch {
              items = [];
            }
          } else if (Array.isArray(latestOrder.items)) {
            items = latestOrder.items as OrderItem[];
          }
          let shipping_address: Address = latestOrder.shipping_address as Address;
          if (typeof shipping_address === "string") {
            try {
              shipping_address = JSON.parse(shipping_address);
            } catch {
              shipping_address = {} as Address;
            }
          }
          const customerName =
            latestOrder.customer_name ||
            shipping_address.fullName ||
            latestOrder.profiles?.full_name ||
            "";
          setEditOrderId(latestOrder.id);
          setEditOrderForm({
            user_id: latestOrder.user_id,
            payment_method: latestOrder.payment_method,
            status: latestOrder.status,
            notes: latestOrder.notes ? safeDecompressNotes(latestOrder.notes) : "",
            items,
            shipping_address: {
              ...shipping_address,
              fullName: customerName,
            },
          });
          setOriginalOrderForEdit(mapOrderFromDb(latestOrder as unknown as Record<string, unknown>));
          setShowEditOrder(true);
        }}
      >
        {t("edit") || "تعديل"}
      </Button>
      {/* زر الحذف */}
      <Button
        size="sm"
        variant="destructive"
        className="font-bold flex items-center gap-1 px-3 py-2 border-red-500 text-red-700 hover:bg-red-50 min-w-[90px] flex-1 sm:flex-none"
        style={{ borderWidth: 2 }}
        onClick={() => {
          setOrderToDelete(order);
          setShowDeleteDialog(true);
        }}
      >
        {t("delete") || "حذف"}
      </Button>
    </div>
  );
};

export default OrderActions;
