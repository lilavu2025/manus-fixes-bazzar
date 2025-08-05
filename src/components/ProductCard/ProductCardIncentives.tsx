import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '@/hooks/useCart';
import useOffers from '@/hooks/useOffers';
import { useLanguage } from '@/utils/languageContextUtils';
import { useAuth } from '@/contexts/useAuth';
import { Button } from '@/components/ui/button';
import { Gift, CheckCircle } from 'lucide-react';
import { getLocalizedName } from '@/utils/getLocalizedName';
import { getDisplayPrice } from '@/utils/priceUtils';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/types/product';

interface ProductCardIncentivesProps {
  productId: string;
}

interface IncentiveOffer {
  type: 'add_target_product' | 'increase_quantity' | 'offer_applied';
  offer: any;
  targetProduct: Product;
  qualifyingQuantity?: number;
  requiredQuantity?: number;
  missingQuantity?: number;
}

const ProductCardIncentives = ({ productId }: ProductCardIncentivesProps) => {
  const { t, language } = useLanguage();
  const { profile } = useAuth();
  const { cartItems, addToCart } = useCart();
  const { activeOffers } = useOffers();
  
  const [availableOffers, setAvailableOffers] = useState<IncentiveOffer[]>([]);
  const [productsCache, setProductsCache] = useState<Map<string, Product>>(new Map());

  // تحسين الأداء: تخزين المنتجات مؤقتاً
  const getProductFromCache = async (productId: string): Promise<Product | null> => {
    if (productsCache.has(productId)) {
      return productsCache.get(productId)!;
    }

    try {
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productData) {
        const product: Product = {
          id: productData.id,
          name: productData.name_ar || productData.name_en || '',
          nameEn: productData.name_en || '',
          nameHe: productData.name_he || '',
          description: productData.description_ar || productData.description_en || '',
          descriptionEn: productData.description_en || '',
          descriptionHe: productData.description_he || '',
          price: productData.price || 0,
          wholesalePrice: productData.wholesale_price || 0,
          originalPrice: productData.price || 0,
          image: productData.image || '',
          inStock: productData.in_stock || false,
          category: productData.category_id || '',
          featured: productData.featured || false,
          active: productData.active || false,
          discount: productData.discount || 0,
          rating: productData.rating || 0,
          reviews: 0,
          stock_quantity: productData.stock_quantity || 0
        };

        setProductsCache(prev => new Map(prev).set(productId, product));
        return product;
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    }

    return null;
  };

  // العثور على التحفيزات المرتبطة بالمنتج الحالي
  useEffect(() => {
    const findProductIncentives = async () => {
      try {
        const incentives: IncentiveOffer[] = [];

        for (const offer of activeOffers) {
          if (offer.offer_type === 'buy_get') {
            // استخدام الكاش لتحسين الأداء
            const getProduct = await getProductFromCache(offer.get_product_id);
            const linkedProduct = await getProductFromCache(offer.linked_product_id);

            if (!getProduct || !linkedProduct) continue;

            // التحقق إذا كان المنتج الحالي هو المنتج المستهدف
            if (offer.get_product_id === productId) {
              // التحقق من وجود المنتج المؤهل في السلة
              const qualifyingItem = cartItems.find(item => item.product.id === offer.linked_product_id);
              if (qualifyingItem && qualifyingItem.quantity >= offer.buy_quantity) {
                // التحقق من عدم وجود المنتج المستهدف في السلة
                const targetInCart = cartItems.find(item => item.product.id === productId);
                if (!targetInCart) {
                  incentives.push({
                    type: 'add_target_product',
                    offer,
                    targetProduct: getProduct
                  });
                }
              }
            }

            // التحقق إذا كان المنتج الحالي هو المنتج المؤهل
            if (offer.linked_product_id === productId) {
              const cartItem = cartItems.find(item => item.product.id === productId);
              const currentQuantity = cartItem?.quantity || 0;
              const requiredQuantity = offer.buy_quantity;
              
              if (currentQuantity < requiredQuantity) {
                const missingQuantity = requiredQuantity - currentQuantity;
                
                incentives.push({
                  type: 'increase_quantity',
                  offer,
                  targetProduct: getProduct,
                  qualifyingQuantity: currentQuantity,
                  requiredQuantity,
                  missingQuantity
                });
              } else if (currentQuantity >= requiredQuantity) {
                // تحقق الشرط - التحقق من وجود المنتج المستهدف في السلة
                const targetInCart = cartItems.find(item => item.product.id === offer.get_product_id);
                if (!targetInCart) {
                  // إظهار عرض إضافة المنتج المستهدف
                  incentives.push({
                    type: 'add_target_product',
                    offer,
                    targetProduct: getProduct
                  });
                } else {
                  // العرض مطبق - إظهار العرض المحقق
                  incentives.push({
                    type: 'offer_applied',
                    offer,
                    targetProduct: getProduct,
                    qualifyingQuantity: currentQuantity,
                    requiredQuantity
                  });
                }
              }
            }
          }
        }

        setAvailableOffers(incentives);
      } catch (error) {
        console.error('Error finding product incentives:', error);
        setAvailableOffers([]);
      }
    };

    if (productId && cartItems && activeOffers.length > 0) {
      findProductIncentives();
    }
  }, [productId, cartItems, activeOffers]);

  // إضافة المنتج المستهدف للسلة
  const addTargetProduct = async (targetProduct: Product) => {
    try {
      await addToCart(targetProduct, 1);
    } catch (error) {
      console.error('Error adding target product:', error);
    }
  };

  // زيادة كمية المنتج المؤهل
  const increaseQualifyingQuantity = async (productId: string, currentQuantity: number, requiredQuantity: number) => {
    try {
      const productToAdd = await getProductFromCache(productId);
      
      if (!productToAdd) {
        console.error('لا يمكن العثور على بيانات المنتج');
        return;
      }
      
      const missingQuantity = requiredQuantity - currentQuantity;
      
      if (missingQuantity > 0) {
        await addToCart(productToAdd, missingQuantity);
      }
    } catch (error) {
      console.error('خطأ في زيادة الكمية:', error);
    }
  };

  if (!availableOffers.length) return null;

  return (
    <div className="space-y-2">
      {availableOffers.map((incentiveOffer, index) => {
        const offer = incentiveOffer.offer;
        const targetProduct = incentiveOffer.targetProduct;
        
        let discountText = "";
        if (offer.get_discount_type === "percentage") {
          discountText = `خصم ${offer.get_discount_value}%`;
        } else if (offer.get_discount_type === "fixed") {
          discountText = `خصم ${offer.get_discount_value} ${t("currency")}`;
        } else if (offer.get_discount_type === "free") {
          discountText = t("freeItem") || "مجاني";
        }

        // عرض تحفيز إضافة المنتج المستهدف
        if (incentiveOffer.type === 'add_target_product') {
          return (
            <div key={`incentive-${index}`} className="p-2 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-1 mb-1">
                <Gift className="h-3 w-3 text-orange-600" />
                <span className="text-xs font-semibold text-orange-700">🎁 عرض خاص متاح!</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 bg-center bg-contain bg-no-repeat rounded-md border border-orange-200 flex-shrink-0"
                  style={{ backgroundImage: `url(${targetProduct.image})` }}
                />
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-orange-700 mb-1 leading-tight">
                    {offer.get_discount_type === "free" ? (
                      <>حصلت على <span className="font-semibold">{getLocalizedName(targetProduct, language)}</span> {discountText}!</>
                    ) : (
                      <>أضف <span className="font-semibold">{getLocalizedName(targetProduct, language)}</span> واحصل على {discountText}</>
                    )}
                  </p>
                  
                  <div className="flex items-center gap-1 mb-1">
                    {offer.get_discount_type !== "free" && (
                      <>
                        <span className="text-xs text-gray-500 line-through">
                          {getDisplayPrice(targetProduct, profile?.user_type).toFixed(2)} {t("currency")}
                        </span>
                        <span className="text-xs text-orange-600 font-bold">
                          {offer.get_discount_type === "percentage" 
                            ? (getDisplayPrice(targetProduct, profile?.user_type) * (1 - offer.get_discount_value / 100)).toFixed(2)
                            : (getDisplayPrice(targetProduct, profile?.user_type) - offer.get_discount_value).toFixed(2)
                          } {t("currency")}
                        </span>
                      </>
                    )}
                    {offer.get_discount_type === "free" && (
                      <span className="text-xs text-green-600 font-bold">مجاني!</span>
                    )}
                  </div>
                  
                  {/* زر الإضافة فقط إذا لم يكن المنتج مجاني */}
                  {offer.get_discount_type !== "free" && (
                    <Button
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1 h-6 w-full"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addTargetProduct(targetProduct);
                      }}
                      disabled={!targetProduct.inStock}
                    >
                      {t("addToCart")}
                    </Button>
                  )}
                  
                  {/* رسالة للمنتج المجاني */}
                  {offer.get_discount_type === "free" && (
                    <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded border text-center">
                      ✨ يُضاف تلقائياً
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        } 
        // عرض تحفيز زيادة الكمية
        else if (incentiveOffer.type === 'increase_quantity') {
          const missingQuantity = incentiveOffer.missingQuantity || 0;
          const currentQuantity = incentiveOffer.qualifyingQuantity || 0;
          const requiredQuantity = incentiveOffer.requiredQuantity || 0;
          
          return (
            <div key={`quantity-incentive-${index}`} className="p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <span className="text-xs font-semibold text-blue-700">⚡ أنت قريب من العرض!</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 bg-center bg-contain bg-no-repeat rounded-md border border-blue-200 flex-shrink-0"
                  style={{ backgroundImage: `url(${targetProduct.image})` }}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="mb-1">
                    <div className="w-full bg-gray-200 rounded-full h-1 mb-1">
                      <div 
                        className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
                        style={{ width: `${(currentQuantity / requiredQuantity) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-blue-700 leading-tight">
                      {currentQuantity}/{requiredQuantity} - أضف {missingQuantity} للحصول على <span className="font-semibold">{getLocalizedName(targetProduct, language)} {discountText}</span>
                    </p>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 h-6 flex-shrink-0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    increaseQualifyingQuantity(productId, currentQuantity, requiredQuantity);
                  }}
                  disabled={!targetProduct.inStock}
                >
                  +{missingQuantity}
                </Button>
              </div>
            </div>
          );
        }
        // عرض العرض المطبق
        else if (incentiveOffer.type === 'offer_applied') {
          const currentQuantity = incentiveOffer.qualifyingQuantity || 0;
          const requiredQuantity = incentiveOffer.requiredQuantity || 0;
          
          return (
            <div key={`applied-offer-${index}`} className="p-2 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-1 mb-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="text-xs font-semibold text-green-700">✅ تم تطبيق العرض!</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 bg-center bg-contain bg-no-repeat rounded-md border border-green-200 flex-shrink-0"
                  style={{ backgroundImage: `url(${targetProduct.image})` }}
                />
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-green-700 leading-tight">
                    حصلت على <span className="font-semibold">{getLocalizedName(targetProduct, language)} {discountText}</span> 
                    <br />
                    <span className="text-xs text-green-600">بشراء {currentQuantity} من هذا المنتج</span>
                  </p>
                </div>
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

export default ProductCardIncentives;
