import React from "react";
import { Percent } from "lucide-react";
import { getOrderDisplayTotal, OrderDisplayTotal } from "@/orders/order.displayTotal";

interface OrderTotalDisplayProps {
  order: {
    total?: number;
    discount_type?: "amount" | "percent";
    discount_value?: number;
    total_after_discount?: number;
    applied_offers?: string | any[];
  };
  t: (key: string) => string;
  currency?: string;
  className?: string;
}

const OrderTotalDisplay: React.FC<OrderTotalDisplayProps> = ({ order, t, currency = "₪", className }) => {
  // حساب الخصومات من العروض
  const appliedOffersData = order.applied_offers 
    ? (typeof order.applied_offers === 'string' 
        ? JSON.parse(order.applied_offers) 
        : order.applied_offers)
    : [];
  
  const totalOffersDiscount = appliedOffersData.reduce((sum: number, offer: any) => 
    sum + (offer.discountAmount || 0), 0);
  
  // حساب المجموع الكلي مع مراعاة الخصم اليدوي
  const subtotal = order.total || 0; // المجموع قبل الخصم اليدوي
  const hasManualDiscount = order.discount_type && order.discount_value && order.discount_value > 0;
  const manualDiscountAmount = hasManualDiscount 
    ? (order.discount_type === 'percent' 
        ? (subtotal * (order.discount_value || 0) / 100) 
        : (order.discount_value || 0))
    : 0;
    
  const finalTotal = hasManualDiscount && order.total_after_discount !== null
    ? order.total_after_discount || subtotal
    : subtotal;
    
  const originalTotal = subtotal + totalOffersDiscount;
  const totalSavings = totalOffersDiscount + manualDiscountAmount;
  
  const hasAnyDiscount = totalOffersDiscount > 0 || hasManualDiscount;
  
  return (
    <div className={className || "flex items-center gap-2"}>
      {hasAnyDiscount ? (
        <>
          <span className="line-through text-gray-400 text-base font-normal">
            {originalTotal.toFixed(2)} {currency}
          </span>
          <span className="text-red-600 text-sm font-bold">
            -{totalSavings.toFixed(2)} {currency}
          </span>
          <span className="text-green-700 text-lg font-bold">
            {finalTotal.toFixed(2)} {currency}
          </span>
        </>
      ) : (
        <span className="text-lg font-bold text-primary">
          {finalTotal.toFixed(2)} {currency}
        </span>
      )}
    </div>
  );
};

export default OrderTotalDisplay;
