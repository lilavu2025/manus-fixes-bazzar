import React from "react";
import { Star, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { useLanguage } from "@/utils/languageContextUtils";
import { useAuth } from "@/contexts/useAuth";
import type { Product as ProductFull } from "@/types/product";
import { Product } from "@/types";
import QuantitySelector from "@/components/QuantitySelector";
import { getLocalizedName } from "@/utils/getLocalizedName";
import { getDisplayPrice } from "@/utils/priceUtils";
import ProductCardBadges from "./ProductCardBadges";

interface ProductCardContentProps {
  product: ProductFull;
  quantity: number;
  cartQuantity: number;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  isLoading?: boolean;
  onProductClick?: () => void;
}

const ProductCardContent: React.FC<ProductCardContentProps> = ({
  product,
  quantity,
  cartQuantity,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  isLoading = false,
  onProductClick,
}) => {
  const { t, isRTL, language } = useLanguage();
  const { profile } = useAuth();

  const displayPrice = getDisplayPrice(product, profile?.user_type);

  return (
    <CardContent
      className={`w-full p-3 sm:p-4 md:p-6 ${isRTL ? "text-right" : "text-left"}`}
    >
      <Link
        to={`/product/${product.id}`}
        onClick={onProductClick}
        className="block w-full"
      >
        <h3
          className={`font-semibold text-sm sm:text-base md:text-lg lg:text-xl mb-2 line-clamp-2 group-hover:text-primary transition-colors ${isRTL ? "text-right" : "text-left"}`}
        >
          {getLocalizedName(product, language)}
        </h3>
      </Link>
      
      {/* البادجز تحت اسم المنتج */}
      <div className="mb-3">
        <ProductCardBadges product={product} variant="belowName" />
      </div>
      {/* السعر  */}
      <div className={`flex flex-col gap-2 mb-4 w-full`}>
        <div className={`flex flex-col gap-2 w-full`}>
          <div
            className={`flex items-center gap-4 w-full ${isRTL ? "flex-row-reverse justify-end" : "justify-start"}`}
          >
            {product.originalPrice !== displayPrice && (
              <span className="text-sm sm:text-base text-gray-500 line-through">
                {product.originalPrice} {t("currency")}
              </span>
            )}
            <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-primary">
              {displayPrice} {t("currency")}
            </span>
          </div>
        </div>
        <div className="flex flex-col w-full gap-1">
          {!product.inStock && (
            <div className="w-full text-center text-red-600 bg-red-50 border border-red-200 rounded p-2 mb-2 font-semibold text-xs sm:text-sm md:text-base lg:text-base leading-tight sm:leading-normal break-words">
              {t("productOutOfStockMessage") || "هذا المنتج غير متوفر حالياً وسيعود قريباً!"}
            </div>
          )}
          <div className="flex items-center gap-4 w-full">
            <span className="text-sm sm:text-base text-gray-600 whitespace-nowrap">
              {t("quantity")}:
            </span>
            <QuantitySelector
              quantity={quantity}
              onQuantityChange={onQuantityChange}
              max={99}
              min={1}
              disabled={!product.inStock || isLoading}
            />
          </div>
        </div>
      </div>
      {/* أزرار الإجراءات */}
      <div
        className={`flex flex-col gap-2 sm:gap-3 ${isRTL ? "justify-end" : "justify-start"}`}
      >
        <Button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddToCart();
          }}
          disabled={!product.inStock || isLoading}
          className="w-full gap-1 sm:gap-2 font-semibold text-xs sm:text-sm py-2 sm:py-3"
          variant={cartQuantity > 0 ? "secondary" : "default"}
        >
          <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
          {cartQuantity > 0
            ? `${t("inCart")} (${cartQuantity})`
            : t("addToCart")}
        </Button>
        <Button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBuyNow();
          }}
          disabled={!product.inStock || isLoading}
          variant="outline"
          className="w-full px-2 sm:px-4 text-xs sm:text-sm py-2 sm:py-3"
        >
          {t("buyNow")}
        </Button>
      </div>
    </CardContent>
  );
};

export default ProductCardContent;
