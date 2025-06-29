import React from "react";
import { Percent } from "lucide-react";

interface OrderDiscountSummaryProps {
  discountEnabled: boolean;
  discountType: "amount" | "percent";
  discountValue: number;
  items: { price: number; quantity: number }[];
  t: (key: string) => string;
}

const calculateOrderTotal = (items: { price: number; quantity: number }[]) => {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

const OrderDiscountSummary: React.FC<OrderDiscountSummaryProps> = ({
  discountEnabled,
  discountType,
  discountValue,
  items,
  t,
}) => {
  if (!items.length) return null;
  const total = calculateOrderTotal(items);
  let after = total;
  if (!(discountEnabled && discountValue > 0)) return null;
  if (discountType === "percent") {
    after = total - (total * (discountValue || 0) / 100);
  } else {
    after = total - (discountValue || 0);
  }
  if (after < 0) after = 0;
  return (
    <>
      <p className="text-base text-gray-600">
        {t("discount") || "الخصم"}: {discountType === "percent" ? `${discountValue}%` : `${discountValue} ₪`}
      </p>
      <p className="text-lg font-bold text-green-700">
        {t("totalAfterDiscount") || "المجموع بعد الخصم"}: {after > 0 ? after.toFixed(2) : 0} ₪
      </p>
    </>
  );
};

export default OrderDiscountSummary;
