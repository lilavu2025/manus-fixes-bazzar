import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Percent, Tag, Gift } from "lucide-react";
import { useLanguage } from "@/utils/languageContextUtils";
import { useAuth } from "@/contexts/useAuth";
import { OfferService, type Offer } from "@/services/offerService";
import type { Product } from "@/types/product";

interface ProductOfferBadgeProps {
  product: Product | {
    id?: string;
    name?: string;
    name_ar?: string;
    name_en?: string;
    discount?: number | string;
    featured?: boolean;
    inStock?: boolean;
    wholesalePrice?: number;
    top_ordered?: boolean;
    rating?: number;
    stock_quantity?: number;
    created_at?: string;
    originalPrice?: number;
    price?: number;
  };
  variant?: "compact" | "full";
  className?: string;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "inline";
}

const ProductOfferBadge: React.FC<ProductOfferBadgeProps> = ({
  product,
  variant = "compact",
  className = "",
  position = "top-right"
}) => {
  const { t, language } = useLanguage();
  const { profile } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      if (!product.id) {
        setLoading(false);
        return;
      }
      
      try {
        const productOffers = await OfferService.getOffersForProduct(product.id);
        setOffers(productOffers);
      } catch (error) {
        console.error("Error fetching offers for product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [product.id]);

  if (loading || !offers.length || !product.id) return null;

  const getLocalizedText = (ar: string, en: string, he: string) => {
    switch (language) {
      case 'en':
        return en || ar || he || "";
      case 'he':
        return he || en || ar || "";
      case 'ar':
      default:
        return ar || en || he || "";
    }
  };

  const getBestOffer = () => {
    return offers[0]; // نأخذ أول عرض (يمكن تحسين هذا لاحقاً)
  };

  const getPositionClasses = () => {
    if (position === "inline") return "";
    
    const baseClasses = "absolute z-30";
    switch (position) {
      case "top-left":
        return `${baseClasses} top-1 left-1`;
      case "top-right":
        return `${baseClasses} top-1 right-1`;
      case "bottom-left":
        return `${baseClasses} bottom-1 left-1`;
      case "bottom-right":
        return `${baseClasses} bottom-1 right-1`;
      default:
        return `${baseClasses} top-1 right-1`;
    }
  };

  const renderOfferBadge = (offer: Offer) => {
    const positionClasses = getPositionClasses();
    
    if (variant === "compact") {
      return (
        <Badge 
          variant="destructive" 
          className={`${positionClasses} bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold text-xs shadow-lg border-0 px-2 py-1 ${className}`}
        >
          <Tag className="h-3 w-3 mr-1" />
          {t("offer")}
        </Badge>
      );
    }

    // عرض مفصل للعرض
    const offerType = (offer as any).offer_type || "discount";
    
    if (offerType === "buy_get") {
      const buyQuantity = (offer as any).buy_quantity || 1;
      const getDiscountType = (offer as any).get_discount_type || "free";
      
      return (
        <div className={`${positionClasses} bg-gradient-to-r from-green-500 to-blue-500 text-white p-2 rounded-lg text-xs shadow-lg max-w-[120px] ${className}`}>
          <div className="flex items-center gap-1 mb-1">
            <Gift className="h-3 w-3 flex-shrink-0" />
            <span className="font-bold text-[10px] leading-tight">{t("buyGetOffer") || "اشتري واحصل"}</span>
          </div>
          <div className="text-[10px] leading-tight">
            {t("buy")} {buyQuantity} {getDiscountType === "free" ? t("getFree") : t("getDiscount")}
          </div>
        </div>
      );
    } else if (offerType === "product_discount") {
      // عرض خصم على منتج معين
      const discountText = offer.discount_type === "percentage" 
        ? `${offer.discount_percentage}%`
        : `${offer.discount_amount} ${t("currency")}`;

      return (
        <div className={`${positionClasses} bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-2 rounded-lg text-xs shadow-lg max-w-[100px] ${className}`}>
          <div className="flex items-center gap-1 mb-1">
            <Percent className="h-3 w-3 flex-shrink-0" />
            <span className="font-bold text-[10px] leading-tight">{t("productDiscount") || "خصم خاص"}</span>
          </div>
          <div className="font-bold text-[10px] leading-tight">{discountText} {t("off")}</div>
        </div>
      );
    } else {
      // عرض خصم عادي
      const discountText = offer.discount_type === "percentage" 
        ? `${offer.discount_percentage}%`
        : `${offer.discount_amount} ${t("currency")}`;

      return (
        <div className={`${positionClasses} bg-gradient-to-r from-red-500 to-pink-500 text-white p-2 rounded-lg text-xs shadow-lg max-w-[100px] ${className}`}>
          <div className="flex items-center gap-1 mb-1">
            <Percent className="h-3 w-3 flex-shrink-0" />
            <span className="font-bold text-[10px] leading-tight">{t("discount")}</span>
          </div>
          <div className="font-bold text-[10px] leading-tight">{discountText} {t("off")}</div>
        </div>
      );
    }
  };

  return renderOfferBadge(getBestOffer());
};

export default ProductOfferBadge;
