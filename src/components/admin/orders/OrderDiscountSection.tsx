import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BadgeDollarSign, Percent } from "lucide-react";

interface OrderDiscountSectionProps {
  discountEnabled: boolean;
  discountType: "amount" | "percent";
  discountValue: number;
  onDiscountEnabledChange: (val: boolean) => void;
  onDiscountTypeChange: (val: "amount" | "percent") => void;
  onDiscountValueChange: (val: number) => void;
  t: (key: string) => string;
}

const OrderDiscountSection: React.FC<OrderDiscountSectionProps> = ({
  discountEnabled,
  discountType,
  discountValue,
  onDiscountEnabledChange,
  onDiscountTypeChange,
  onDiscountValueChange,
  t,
}) => {
  return (
    <Card className="mb-6 shadow-sm border border-gray-200 bg-yellow-50">
      <CardHeader className="flex flex-row items-center gap-2 pb-2 justify-between">
        <div className="flex items-center gap-2">
          <BadgeDollarSign className="w-5 h-5 text-primary" />
          <CardTitle className="text-base font-semibold text-gray-800">
            {t("discount") || "الخصم على الفاتورة"}
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={discountEnabled}
            onCheckedChange={onDiscountEnabledChange}
            id="discount-switch"
          />
          <Label htmlFor="discount-switch" className="text-sm text-gray-600 cursor-pointer select-none">
            {discountEnabled ? (t("enabled") || "مفعل") : (t("disabled") || "غير مفعل")}
          </Label>
        </div>
      </CardHeader>
      {discountEnabled && (
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* نوع الخصم */}
            <div>
              <Label className="mb-1 block text-sm text-gray-600">
                {t("discountType") || "نوع الخصم"}
              </Label>
              <Select
                value={discountType}
                onValueChange={val => onDiscountTypeChange(val as "amount" | "percent")}
              >
                <SelectTrigger className="w-full bg-white border border-gray-300 shadow-sm">
                  <SelectValue placeholder={t("discountType") || "نوع الخصم"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount">{t("amount") || "مبلغ ثابت"}</SelectItem>
                  <SelectItem value="percent">{t("percent") || "نسبة مئوية"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* قيمة الخصم */}
            <div>
              <Label className="mb-1 block text-sm text-gray-600">
                {t("discountValue") || "قيمة الخصم"}
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                className="w-full bg-white border border-gray-300 shadow-sm"
                value={discountValue || ""}
                onChange={e => onDiscountValueChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
                placeholder={t("discountValue") || "أدخل القيمة"}
              />
            </div>
            {/* رمز العملة أو النسبة */}
            <div className="flex flex-col justify-end pt-2">
              <Label className="mb-1 text-sm text-gray-600">
                {t("unit") || "الوحدة"}
              </Label>
              <div className="text-sm text-gray-500 px-3 py-2 border border-gray-200 bg-gray-50 rounded-md w-fit">
                {discountType === "percent" ? <Percent className="inline w-4 h-4 mr-1" /> : t("currency") || "₪"}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default OrderDiscountSection;
