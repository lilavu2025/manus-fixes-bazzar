import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface OrderDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: any;
  isRTL: boolean;
  handleDeleteOrder: () => void;
  setShowDeleteDialog: (open: boolean) => void;
}

const OrderDeleteDialog: React.FC<OrderDeleteDialogProps> = ({
  open,
  onOpenChange,
  t,
  isRTL,
  handleDeleteOrder,
  setShowDeleteDialog,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold mb-1 text-primary text-center">
          {t("confirmDeleteOrder") || "تأكيد حذف الطلب"}
        </DialogTitle>
      </DialogHeader>
      <div className="mb-4">
        {t("areYouSureDeleteOrder") ||
          "هل أنت متأكد أنك تريد حذف هذا الطلب؟ لا يمكن التراجع عن هذه العملية."}
      </div>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setShowDeleteDialog(false)}
        >
          {t("cancel") || "إلغاء"}
        </Button>
        <Button variant="destructive" onClick={handleDeleteOrder}>
          {t("confirmDelete") || "تأكيد الحذف"}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

export default OrderDeleteDialog;
