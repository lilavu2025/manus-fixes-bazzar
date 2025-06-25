import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/utils/languageContextUtils";

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
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-1 text-primary text-center">
            {t("confirmEditOrder") || "تأكيد تعديل الطلبية"}
          </DialogTitle>
        </DialogHeader>
        <div className="mb-4 text-gray-700">
          <p>{t("areYouSureYouWantToSaveTheFollowingChanges") || "هل أنت متأكد أنك تريد حفظ التعديلات التالية على الطلبية؟"}</p>
          <table className="w-full mt-4 border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">{t("item") || "البند"}</th>
                <th className="p-2 border">{t("oldValue") || "القيمة السابقة"}</th>
                <th className="p-2 border">{t("newValue") || "القيمة الجديدة"}</th>
              </tr>
            </thead>
            <tbody>
              {changes.length > 0 ? (
                changes.map((change, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border">{t(change.label)}</td>
                    <td className="p-2 border">{t(change.oldValue)}</td>
                    <td className="p-2 border">{t(change.newValue)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-2 border text-center">{t("noChangesDetected") || "لم يتم رصد تغييرات واضحة."}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>{t("cancel") || "إلغاء"}</Button>
          <Button variant="default" onClick={onConfirm}>{t("confirmAndSave") || "تأكيد وحفظ"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmEditOrderDialog;
