import React from "react";
import { Star, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { useLanguage } from "@/utils/languageContextUtils";
import { useAuth } from "@/contexts/useAuth";
import type { Product as ProductFull } from "@/types/product";
import { Product } from "@/types";
import QuantitySelector from "@/components/QuantitySelector";
import { getLocalizedName, getLocalizedDescription } from "@/utils/getLocalizedName";
import { getDisplayPrice } from "@/utils/priceUtils";
import ProductCardBadges from "./ProductCardBadges";

interface ProductCardContentProps {
  product: ProductFull;
  quantity: number;
  cartQuantity: number;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  isLoading?: boolean;
  onProductClick?: () => void;
}

const ProductCardContent: React.FC<ProductCardContentProps> = ({
  product,
  quantity,
  cartQuantity,
  onQuantityChange,
  onAddToCart,
  isLoading = false,
  onProductClick,
}) => {
  const { t, isRTL, language } = useLanguage();
  const { profile } = useAuth();
  const [showFullDescription, setShowFullDescription] = React.useState(false);

  const displayPrice = getDisplayPrice(product, profile?.user_type);
  const description = getLocalizedDescription(product, language);

  return (
    <CardContent
      className={`product-card-content w-full p-2 sm:p-3 md:p-4 ${isRTL ? "text-right" : "text-left"} flex flex-col flex-grow h-full min-h-0`}
    >
      {/* المحتوى الأساسي */}
      <div className="flex flex-col gap-2 flex-grow min-h-0 justify-start">
        <Link
          to={`/product/${product.id}`}
          onClick={onProductClick}
          className="block w-full flex-shrink-0"
        >
          <h3
            className={`product-name-wrapper font-semibold text-sm sm:text-base md:text-lg lg:text-xl group-hover:text-primary transition-colors break-words leading-tight ${isRTL ? "text-right" : "text-left"}`}
            style={{ wordBreak: 'break-word', hyphens: 'auto' }}
          >
            {getLocalizedName(product, language)}
          </h3>
        </Link>
        
        {/* البادجز تحت اسم المنتج */}
        <div className="flex-shrink-0">
          <ProductCardBadges product={product} variant="belowName" />
        </div>

        {/* وصف المنتج */}
        {description && (
          <div className={`text-xs sm:text-sm text-gray-600 leading-relaxed flex-shrink-0 ${isRTL ? "text-right" : "text-left"}`}>
            <p 
              className={showFullDescription ? "break-words leading-relaxed" : "product-description"}
              style={{ wordBreak: 'break-word', hyphens: 'auto' }}
            >
              {description}
            </p>
            {description.length > 100 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowFullDescription(!showFullDescription);
                }}
                className={`show-more-btn text-primary hover:text-primary/80 text-xs font-medium mt-1 transition-colors inline-flex items-center gap-1 ${isRTL ? "text-right" : "text-left"}`}
              >
                {showFullDescription ? (
                  <>
                    {t("showLess") || "عرض أقل"}
                    <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    {t("showMore") || "عرض المزيد"}
                    <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
        
        {/* مساحة قابلة للتمدد لدفع السعر والأزرار للأسفل */}
        <div className="flex-grow"></div>
        
        {/* السعر  */}
        <div className={`flex flex-col gap-1 flex-shrink-0`}>
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

        {/* رسالة نفاد المخزون */}
        {!product.inStock && (
          <div className="w-full text-center text-red-600 bg-red-50 border border-red-200 rounded p-2 font-semibold text-xs sm:text-sm md:text-base lg:text-base leading-tight sm:leading-normal break-words">
            {t("productOutOfStockMessage") || "هذا المنتج غير متوفر حالياً وسيعود قريباً!"}
          </div>
        )}
      </div>

      {/* منطقة الأزرار في الأسفل */}
      {product.inStock && (
        <div className="flex flex-col gap-2 mt-auto flex-shrink-0">
          {/* محدد الكمية */}
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

          {/* أزرار الإجراءات */}
          <div className={`flex flex-col gap-1.5 ${isRTL ? "justify-end" : "justify-start"}`}>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToCart();
              }}
              disabled={!product.inStock || isLoading}
              className="w-full gap-1 sm:gap-2 font-semibold text-xs sm:text-sm py-1.5 sm:py-2"
              variant={cartQuantity > 0 ? "secondary" : "default"}
            >
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
              {cartQuantity > 0
                ? `${t("inCart")} (${cartQuantity})`
                : t("addToCart")}
            </Button>
          </div>
        </div>
      )}
    </CardContent>
  );
};

export default ProductCardContent;
