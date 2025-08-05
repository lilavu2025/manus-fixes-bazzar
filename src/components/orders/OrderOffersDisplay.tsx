import React from "react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/utils/languageContextUtils";
import { Gift, Tag, Percent } from "lucide-react";

interface AppliedOffer {
  id: string;
  name_ar: string;
  name_en: string;
  name_he: string;
  discount_percentage?: number;
  applied_discount?: number;
  offer_type?: string;
}

interface FreeItem {
  product_id: string;
  name_ar: string;
  name_en: string;
  name_he: string;
  quantity: number;
  value?: number;
}

interface OrderOffersDisplayProps {
  appliedOffers?: AppliedOffer[] | string;
  freeItems?: FreeItem[] | string;
  discountAmount?: number;
  className?: string;
}

const OrderOffersDisplay: React.FC<OrderOffersDisplayProps> = ({
  appliedOffers,
  freeItems,
  discountAmount = 0,
  className = ""
}) => {
  const { t } = useLanguage();

  // تصحيح الأخطاء - طباعة القيم الواردة
  console.log("🔍 OrderOffersDisplay Props:", {
    appliedOffers: JSON.stringify(appliedOffers),
    freeItems: JSON.stringify(freeItems),
    discountAmount,
    appliedOffersType: typeof appliedOffers,
    freeItemsType: typeof freeItems
  });

  // Parse JSON strings if needed
  const parsedOffers = React.useMemo(() => {
    if (!appliedOffers) return [];
    if (typeof appliedOffers === 'string') {
      try {
        return JSON.parse(appliedOffers);
      } catch {
        return [];
      }
    }
    return appliedOffers;
  }, [appliedOffers]);

  const parsedFreeItems = React.useMemo(() => {
    if (!freeItems) return [];
    if (typeof freeItems === 'string') {
      try {
        return JSON.parse(freeItems);
      } catch {
        return [];
      }
    }
    return freeItems;
  }, [freeItems]);

  const getLocalizedTitle = (offer: AppliedOffer) => {
    const language = t("language") || "ar";
    switch (language) {
      case 'en':
        return offer.name_en || offer.name_ar || offer.name_he || "";
      case 'he':
        return offer.name_he || offer.name_en || offer.name_ar || "";
      case 'ar':
      default:
        return offer.name_ar || offer.name_en || offer.name_he || "";
    }
  };

  if (parsedOffers.length === 0 && parsedFreeItems.length === 0 && discountAmount <= 0) {
    // للاختبار - إظهار رسالة عدم وجود عروض
    return (
      <div className={`text-sm text-gray-500 italic ${className}`}>
        {t("noOffersApplied") || "لا توجد عروض مطبقة على هذا الطلب"}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* عرض العروض المطبقة */}
      {parsedOffers.length > 0 && (
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-4 w-4 text-green-600" />
            <h4 className="font-medium text-green-800">
              {t("appliedOffers")} ({parsedOffers.length})
            </h4>
          </div>
          
          <div className="space-y-2">
            {parsedOffers.map((appliedOffer, index) => (
              <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-green-100 text-green-800 border-green-300"
                  >
                    {appliedOffer.offer_type === 'buy_get' ? t('buyGetOffer') : t('discount')}
                  </Badge>
                  <span className="text-sm font-medium text-green-900">
                    {getLocalizedTitle(appliedOffer)}
                  </span>
                </div>
                
                {appliedOffer.applied_discount && appliedOffer.applied_discount > 0 && (
                  <div className="text-sm font-medium text-green-700">
                    -{appliedOffer.applied_discount.toFixed(2)} {t("currency")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* عرض العناصر المجانية */}
      {parsedFreeItems.length > 0 && (
        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="h-4 w-4 text-purple-600" />
            <h4 className="font-medium text-purple-800">
              {t("freeItems")} ({parsedFreeItems.length})
            </h4>
          </div>
          
          <div className="space-y-2">
            {parsedFreeItems.map((freeItem, index) => (
              <div key={index} className="flex items-center gap-3 bg-white p-2 rounded border">
                <div className="w-8 h-8 bg-gray-200 rounded border border-purple-200 flex-shrink-0 flex items-center justify-center">
                  <Gift className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-purple-900">
                    {freeItem.name_ar || freeItem.name_en || freeItem.name_he} x{freeItem.quantity}
                  </div>
                  <div className="text-xs text-purple-600">
                    {t("fromOffer")} - {t("freeItem")}
                  </div>
                </div>
                <div className="text-sm font-medium text-purple-700">
                  {t("free")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* عرض إجمالي الخصم */}
      {discountAmount > 0 && (
        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-orange-800">
                {t("totalDiscount")}
              </span>
            </div>
            <div className="text-lg font-bold text-orange-700">
              -{discountAmount.toFixed(2)} {t("currency")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderOffersDisplay;
