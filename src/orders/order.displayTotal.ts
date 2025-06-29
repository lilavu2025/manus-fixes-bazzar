// Utility to get display info for order total with discount
export interface OrderDisplayTotal {
  totalBeforeDiscount: number;
  discountType?: "amount" | "percent";
  discountValue?: number;
  totalAfterDiscount: number;
  hasDiscount: boolean;
}

export function getOrderDisplayTotal(order: {
  total?: number;
  discount_type?: string; // changed from enum to string for flexibility
  discount_value?: number;
  total_after_discount?: number;
}): OrderDisplayTotal {
  const total = typeof order.total === "number" ? order.total : 0;
  const discountType = typeof order.discount_type === "string" ? order.discount_type : undefined;
  const discountValue = typeof order.discount_value === "number" ? order.discount_value : 0;
  let totalAfter = total;
  let hasDiscount = false;
  if (
    (discountType === "percent" && discountValue > 0) ||
    (discountType === "amount" && discountValue > 0)
  ) {
    hasDiscount = true;
    if (discountType === "percent") {
      totalAfter = total - (total * discountValue) / 100;
    } else if (discountType === "amount") {
      totalAfter = total - discountValue;
    }
    if (totalAfter < 0) totalAfter = 0;
  }
  // إذا كان total_after_discount موجود في الداتا (من الداتا بيس) استخدمه
  if (typeof order.total_after_discount === "number") {
    totalAfter = order.total_after_discount;
    hasDiscount = totalAfter !== total;
  }
  return {
    totalBeforeDiscount: total,
    discountType: discountType === "percent" || discountType === "amount" ? discountType : undefined,
    discountValue,
    totalAfterDiscount: totalAfter,
    hasDiscount,
  };
}
