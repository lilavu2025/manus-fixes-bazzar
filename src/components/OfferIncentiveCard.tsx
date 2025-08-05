import React from 'react';
import { Button } from '@/components/ui/button';
import { Gift } from 'lucide-react';
import { useLanguage } from '@/utils/languageContextUtils';
import { getLocalizedName } from '@/utils/getLocalizedName';

interface OfferIncentiveCardProps {
  incentive: {
    type: 'add_target_product' | 'increase_quantity';
    offer: any;
    targetProduct: any;
    qualifyingProduct?: any;
    qualifyingQuantity?: number;
    requiredQuantity?: number;
    missingQuantity?: number;
  };
  onAddProduct?: (product: any) => void;
  onIncreaseQuantity?: (productId: string, currentQuantity: number, requiredQuantity: number) => void;
}

const OfferIncentiveCard = ({ incentive, onAddProduct, onIncreaseQuantity }: OfferIncentiveCardProps) => {
  const { t, language } = useLanguage();
  
  const { offer, targetProduct, type } = incentive;
  
  let discountText = "";
  if (offer.get_discount_type === "percentage") {
    discountText = `خصم ${offer.get_discount_value}%`;
  } else if (offer.get_discount_type === "fixed") {
    discountText = `خصم ${offer.get_discount_value} ${t("currency")}`;
  } else if (offer.get_discount_type === "free") {
    discountText = t("freeItem") || "عنصر مجاني";
  }

  const handleAddProduct = () => {
    if (onAddProduct && targetProduct) {
      onAddProduct(targetProduct);
    }
  };

  const handleIncreaseQuantity = () => {
    if (onIncreaseQuantity && incentive.qualifyingProduct && incentive.qualifyingQuantity && incentive.requiredQuantity) {
      onIncreaseQuantity(incentive.qualifyingProduct.id, incentive.qualifyingQuantity, incentive.requiredQuantity);
    }
  };

  // عرض تحفيز إضافة المنتج المستهدف (مطابق للسلة تماماً)
  if (type === 'add_target_product') {
    return (
      <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="h-4 w-4 text-orange-600" />
          <span className="text-xs font-semibold text-orange-700">🎁 عرض خاص متاح!</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 bg-center bg-contain bg-no-repeat rounded-md border border-orange-200 flex-shrink-0"
            style={{ backgroundImage: `url(${targetProduct.image})` }}
          />
          
          <div className="flex-1 min-w-0">
            <p className="text-xs text-orange-700 mb-1">
              أضف <span className="font-semibold">{getLocalizedName(targetProduct, language)}</span> واحصل على {discountText}
            </p>
            
            <div className="flex items-center gap-2">
              {offer.get_discount_type === "free" && (
                <span className="text-xs text-green-600 font-bold">مجاني!</span>
              )}
            </div>
          </div>
          
          {/* زر الإضافة فقط إذا لم يكن المنتج مجاني */}
          {offer.get_discount_type !== "free" && (
            <Button
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1 h-7 flex-shrink-0"
              onClick={handleAddProduct}
              disabled={!targetProduct.in_stock}
            >
              {t("addToCart")}
            </Button>
          )}
          
          {/* رسالة للمنتج المجاني */}
          {offer.get_discount_type === "free" && (
            <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded border flex-shrink-0">
              ✨ يُضاف تلقائياً
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // عرض تحفيز زيادة الكمية (مطابق للسلة تماماً)
  if (type === 'increase_quantity') {
    const { qualifyingQuantity = 0, requiredQuantity = 0, missingQuantity = 0 } = incentive;
    
    return (
      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <span className="text-xs font-semibold text-blue-700">⚡ أنت قريب من العرض!</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 bg-center bg-contain bg-no-repeat rounded-md border border-blue-200 flex-shrink-0"
            style={{ backgroundImage: `url(${targetProduct.image})` }}
          />
          
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(qualifyingQuantity / requiredQuantity) * 100}%` }}
                />
              </div>
              <p className="text-xs text-blue-700">
                {qualifyingQuantity}/{requiredQuantity} - أضف {missingQuantity} للحصول على <span className="font-semibold">{getLocalizedName(targetProduct, language)} {discountText}</span>
              </p>
            </div>
          </div>
          
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 h-7 flex-shrink-0"
            onClick={handleIncreaseQuantity}
            disabled={!incentive.qualifyingProduct?.inStock}
          >
            +{missingQuantity}
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default OfferIncentiveCard;
