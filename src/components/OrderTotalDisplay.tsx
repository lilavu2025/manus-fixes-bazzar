import React from "react";
import { Percent } from "lucide-react";
import { getOrderDisplayTotal, OrderDisplayTotal } from "@/orders/order.displayTotal";

interface OrderTotalDisplayProps {
  order: {
    total?: number;
    discount_type?: "amount" | "percent";
    discount_value?: number;
    total_after_discount?: number;
  };
  t: (key: string) => string;
  currency?: string;
  className?: string;
}

const OrderTotalDisplay: React.FC<OrderTotalDisplayProps> = ({ order, t, currency = "₪", className }) => {
  const display: OrderDisplayTotal = getOrderDisplayTotal(order);
  return (
    <div className={className || "flex items-center gap-2"}>
      {display.hasDiscount ? (
        <>
          <span className="line-through text-gray-400 text-base font-normal">
            {display.totalBeforeDiscount} {currency}
          </span>
          <span className="text-red-600 text-sm font-bold">
            {display.discountType === "percent"
              ? `-${display.discountValue}%`
              : `-${display.discountValue} ${currency}`}
          </span>
          <span className="text-green-700 text-lg font-bold">
            {display.totalAfterDiscount} {currency}
          </span>
        </>
      ) : (
        <span className="text-lg font-bold text-primary">
          {display.totalBeforeDiscount} {currency}
        </span>
      )}
    </div>
  );
};

export default OrderTotalDisplay;
