import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package } from "lucide-react";
import OrderDetailsPrint from "./OrderDetailsPrint";

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any; // يمكن تحسين النوع لاحقًا
  t: any;
  profile?: any;
  generateOrderPrint: (order: any, t: any, currentLang: "ar" | "en" | "he") => Promise<void>;
  onDownloadPdf?: (order: any) => void;
}

const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({ open, onOpenChange, order, t, profile, generateOrderPrint: generateOrderPrint, onDownloadPdf }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-0 sm:p-0">
        <DialogHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b px-6 py-4 rounded-t-2xl">
          <DialogTitle className="text-2xl font-bold mb-1 text-primary text-center">
            <Package className="h-5 w-5 text-primary print:hidden" />{" "}
            {t("orderDetails") || "تفاصيل الطلبية"} #{order?.order_number}
          </DialogTitle>
        </DialogHeader>
        {order && (
          <OrderDetailsPrint
            order={order}
            t={t}
            profile={profile}
            generateOrderPrint={generateOrderPrint}
            onDownloadPdf={onDownloadPdf}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
