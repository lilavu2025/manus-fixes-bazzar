import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { isRTL } from "@/utils/languageContextUtils";

interface Change {
  label: string;
  oldValue: string;
  newValue: string;
}

interface ConfirmEditOrderDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  changes: Change[];
}

const ConfirmEditOrderDialog: React.FC<ConfirmEditOrderDialogProps> = ({ open, onConfirm, onCancel, changes }) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className={`text-xl font-bold text-red-600 ${isRTL ? "text-right" : "text-left"}`}>تأكيد تعديل الطلبية</DialogTitle>
        </DialogHeader>
        <div className="mb-4 text-gray-700">
          <p>هل أنت متأكد أنك تريد حفظ التعديلات التالية على الطلبية؟</p>
          <table className="w-full mt-4 border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">البند</th>
                <th className="p-2 border">القيمة السابقة</th>
                <th className="p-2 border">القيمة الجديدة</th>
              </tr>
            </thead>
            <tbody>
              {changes.length > 0 ? (
                changes.map((change, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border">{change.label}</td>
                    <td className="p-2 border">{change.oldValue}</td>
                    <td className="p-2 border">{change.newValue}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-2 border text-center">لم يتم رصد تغييرات واضحة.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>إلغاء</Button>
          <Button variant="default" onClick={onConfirm}>تأكيد وحفظ</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmEditOrderDialog;
