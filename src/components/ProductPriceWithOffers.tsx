import React from "react";
import { useLanguage } from "@/utils/languageContextUtils";
import { useAuth } from "@/contexts/useAuth";
import { getDisplayPrice } from "@/utils/priceUtils";
import { computeVariantSpecificPrice } from "@/utils/variantPrice";
import type { Product } from "@/types/product";

interface ProductPriceWithOffersProps {
  product: Product;
  appliedDiscount?: number;
  className?: string;
  showOriginalPrice?: boolean;
  quantity?: number;
  reverseLayout?: boolean;
  showSavings?: boolean; // للتحكم في عرض التوفير
  // اختياري: تمرير معلومات الفيرنت بشكل صريح عند الحاجة
  variantId?: string | null;
  variantAttributes?: Record<string, any> | null;
}

const ProductPriceWithOffers: React.FC<ProductPriceWithOffersProps> = ({
  product,
  appliedDiscount = 0,
  className = "",
  showOriginalPrice = true,
  quantity = 1,
  reverseLayout = false,
  showSavings = false,
  variantId,
  variantAttributes,
}) => {
  const { t, isRTL, language } = useLanguage();
  const { profile } = useAuth();

  // تأكد من توفر مصفوفات variants/options حتى لو أتت بأسماء product_variants/product_options
  const normalizedProduct = React.useMemo(() => {
    const p: any = product as any;
    return {
      ...p,
      variants: Array.isArray(p?.variants) ? p.variants : (Array.isArray(p?.product_variants) ? p.product_variants : []),
      options: Array.isArray(p?.options) ? p.options : (Array.isArray(p?.product_options) ? p.product_options : []),
    } as any;
  }, [product]);

  // حاول حساب السعر المعتمد على الفيرنت إن توفرت بيانات الفيرنت ضمن المنتج
  const unitPrice = (() => {
    // دعم تمثيلات مختلفة لبيانات الفيرنت: كخصائص أعلى المنتج أو عبر props
    const variantInfo = {
      variantId: variantId ?? (product as any)?.variant_id ?? undefined,
      variantAttributes: variantAttributes ?? (product as any)?.variant_attributes ?? undefined,
    } as any;

    // إذا كان هناك variants على المنتج أو توفرت معلومات الفيرنت، استخدم الحاسبة الموحدة
    if ((Array.isArray((normalizedProduct as any)?.variants) && (normalizedProduct as any).variants.length > 0) ||
        (variantInfo.variantId || variantInfo.variantAttributes)) {
      return computeVariantSpecificPrice(normalizedProduct as any, variantInfo, profile?.user_type);
    }
    // خلاف ذلك استخدم سعر العرض العام حسب نوع المستخدم
    return getDisplayPrice(normalizedProduct as any, profile?.user_type);
  })();
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
