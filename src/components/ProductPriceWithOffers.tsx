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
  const { t, language } = useLanguage();
  const { profile } = useAuth();

  const unitPrice = getDisplayPrice(product, profile?.user_type);
  const totalOriginalPrice = unitPrice * quantity;
  const discountedPrice = Math.max(0, totalOriginalPrice - appliedDiscount);
  const hasDiscount = appliedDiscount > 0;
  
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
        <div className="flex items-center justify-between mt-1">
          {!reverseLayout ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 line-through font-medium">
                  {formatPrice(totalOriginalPrice)}
                </span>
              </div>
              <span className="text-sm text-gray-600">
                {quantity} × {formatPrice(unitPrice)}
              </span>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-600">
                {quantity} × {formatPrice(unitPrice)}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 line-through font-medium">
                  {formatPrice(totalOriginalPrice)}
                </span>
              </div>
            </>
          )}
        </div>
      )}
      
      <div className="flex items-center justify-between mt-1">
        <span className={`font-bold ${hasDiscount ? 'text-green-600 text-lg' : 'text-primary text-base'}`}>
          {formatPrice(discountedPrice)}
        </span>
        
        {hasDiscount && showSavings && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
            {t("youSave")} {formatPrice(appliedDiscount)}
          </span>
        )}
      </div>
    </div>
  );
};

export default ProductPriceWithOffers;
