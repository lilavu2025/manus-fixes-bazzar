import React from "react";
import { useLanguage } from "@/utils/languageContextUtils";
import { useAuth } from "@/contexts/useAuth";
import { getDisplayPrice } from "@/utils/priceUtils";
import type { Product } from "@/types/product";

interface ProductPriceWithOffersProps {
  product: Product;
  appliedDiscount?: number;
  className?: string;
  showOriginalPrice?: boolean;
  quantity?: number;
  reverseLayout?: boolean;
  showSavings?: boolean; // للتحكم في عرض التوفير
}

const ProductPriceWithOffers: React.FC<ProductPriceWithOffersProps> = ({
  product,
  appliedDiscount = 0,
  className = "",
  showOriginalPrice = true,
  quantity = 1,
  reverseLayout = false,
  showSavings = false
}) => {
  const { t, isRTL, language } = useLanguage();
  const { profile } = useAuth();

  const unitPrice = getDisplayPrice(product, profile?.user_type);
  const totalOriginalPrice = unitPrice * quantity;
  const discountedPrice = Math.max(0, totalOriginalPrice - appliedDiscount);
  const hasDiscount = appliedDiscount > 0;
  // Note: We force an LTR flow for the final row and arrange items manually
  // so that in RTL locales the total price appears on the left and the
  // "qty × unit" appears on the right, and vice versa in LTR.
  
  // Helper function to format price with currency based on language direction
  const formatPrice = (price: number) => {
    const formattedPrice = price.toFixed(2);
    const currency = t("currency");
    
    // For Arabic and Hebrew, currency symbol on the left
    if (language === 'ar' || language === 'he') {
      return `${currency} ${formattedPrice}`;
    }
    // For English and other languages, currency symbol on the right
    return `${formattedPrice} ${currency}`;
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {hasDiscount && showOriginalPrice && (
        <div className="flex items-center gap-2 mt-1 w-full" dir="ltr">
          {isRTL ? (
            <>
              {/* RTL: original (strikethrough) on the left, qty×unit on the right */}
              <span className="text-sm text-gray-600 line-through font-medium">
                {formatPrice(totalOriginalPrice)}
              </span>
              <span className="text-sm text-gray-600 ml-auto">
                {quantity} × {formatPrice(unitPrice)}
              </span>
            </>
          ) : (
            <>
              {/* LTR: qty×unit on the left, original (strikethrough) on the right */}
              <span className="text-sm text-gray-600">
                {quantity} × {formatPrice(unitPrice)}
              </span>
              <span className="text-sm text-gray-600 line-through font-medium ml-auto">
                {formatPrice(totalOriginalPrice)}
              </span>
            </>
          )}
        </div>
      )}

  <div className={"flex items-center gap-2 mt-1 w-full"} dir="ltr">
        {isRTL ? (
          <>
            {/* RTL: Price on the left, qty×unit on the right */}
            <span className={`font-bold ${hasDiscount ? 'text-green-600 text-lg' : 'text-primary text-base'}`}>
              {formatPrice(discountedPrice)}
            </span>
            {!hasDiscount && (
              <span className="text-sm text-gray-600 ml-auto">
                {quantity} × {formatPrice(unitPrice)}
              </span>
            )}
            {hasDiscount && showSavings && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                {t("youSave")} {formatPrice(appliedDiscount)}
              </span>
            )}
          </>
        ) : (
          <>
            {/* LTR: qty×unit on the left, price on the right */}
            {!hasDiscount && (
              <span className="text-sm text-gray-600">
                {quantity} × {formatPrice(unitPrice)}
              </span>
            )}
            {hasDiscount && showSavings && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                {t("youSave")} {formatPrice(appliedDiscount)}
              </span>
            )}
            <span className={`font-bold ${hasDiscount ? 'text-green-600 text-lg' : 'text-primary text-base'} ml-auto`}>
              {formatPrice(discountedPrice)}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductPriceWithOffers;
