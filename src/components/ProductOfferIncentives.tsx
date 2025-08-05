import React, { useState, useEffect } from 'react';
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

interface ProductOfferIncentivesProps {
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

const ProductOfferIncentives = ({ productId }: ProductOfferIncentivesProps) => {
  const { t, language } = useLanguage();
  const { profile } = useAuth();
  const { cartItems, addToCart } = useCart();
  const { activeOffers, applyOffersToCart } = useOffers();
  
  const [availableOffers, setAvailableOffers] = useState<IncentiveOffer[]>([]);

  // العثور على التحفيزات المرتبطة بالمنتج الحالي
  useEffect(() => {
    const findProductIncentives = async () => {
      try {
        const incentives: IncentiveOffer[] = [];

        for (const offer of activeOffers) {
          if (offer.offer_type === 'buy_get') {
            // البحث عن المنتج المستهدف والمؤهل من قاعدة البيانات
            const { data: getProduct } = await supabase
              .from('products')
              .select('*')
              .eq('id', offer.get_product_id)
              .single();

            const { data: linkedProduct } = await supabase
              .from('products')
              .select('*')
              .eq('id', offer.linked_product_id)
              .single();

            if (!getProduct || !linkedProduct) continue;

            // تحويل البيانات لتتوافق مع نوع Product
            const convertToProduct = (dbProduct: any): Product => ({
              id: dbProduct.id,
              name: dbProduct.name_ar || dbProduct.name_en || '',
              nameEn: dbProduct.name_en || '',
              nameHe: dbProduct.name_he || '',
              description: dbProduct.description_ar || dbProduct.description_en || '',
              descriptionEn: dbProduct.description_en || '',
              descriptionHe: dbProduct.description_he || '',
              price: dbProduct.price || 0,
              wholesalePrice: dbProduct.wholesale_price || 0,
              image: dbProduct.image || '',
              inStock: dbProduct.in_stock || false,
              category: dbProduct.category_id || '',
              featured: dbProduct.featured || false,
              active: dbProduct.active || false,
              discount: dbProduct.discount || 0,
              rating: dbProduct.rating || 0,
              reviews: dbProduct.reviews || 0
            });

            const targetProduct = convertToProduct(getProduct);

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
                    targetProduct
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
                  targetProduct,
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
                    targetProduct
                  });
                } else {
                  // العرض مطبق - إظهار العرض المحقق
                  incentives.push({
                    type: 'offer_applied',
                    offer,
                    targetProduct,
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
      console.log('🔍 بدء زيادة الكمية:', { productId, currentQuantity, requiredQuantity });
      
      // البحث عن المنتج من قائمة العروض المتاحة أو من قاعدة البيانات
      let productToAdd = null;
      
      // البحث في العروض المتاحة أولاً
      const incentiveOffer = availableOffers.find(offer => 
        offer.type === 'increase_quantity' && 
        offer.offer.linked_product_id === productId
      );
      
      if (incentiveOffer) {
        // استخدام بيانات المنتج من العرض
        const { data: productData } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();
        
        if (productData) {
          productToAdd = {
            id: productData.id,
            name: productData.name_ar || productData.name_en || '',
            nameEn: productData.name_en || '',
            nameHe: productData.name_he || '',
            description: productData.description_ar || productData.description_en || '',
            descriptionEn: productData.description_en || '',
            descriptionHe: productData.description_he || '',
            price: productData.price || 0,
            wholesalePrice: productData.wholesale_price || 0,
            image: productData.image || '',
            inStock: productData.in_stock || false,
            category: productData.category_id || '',
            featured: productData.featured || false,
            active: productData.active || false,
            discount: productData.discount || 0,
            rating: productData.rating || 0,
            reviews: 0
          };
        }
      }
      
      if (!productToAdd) {
        console.log('❌ لا يمكن العثور على بيانات المنتج');
        return;
      }
      
      const missingQuantity = requiredQuantity - currentQuantity;
      console.log('🔢 الكمية المفقودة:', missingQuantity);
      
      if (missingQuantity > 0) {
        console.log('🚀 إضافة الكمية:', missingQuantity);
        // إضافة كامل الكمية المفقودة مرة واحدة
        await addToCart(productToAdd, missingQuantity);
        console.log('✅ تم إضافة الكمية بنجاح!');
      } else {
        console.log('⚠️ لا توجد كمية للإضافة');
      }
    } catch (error) {
      console.error('❌ خطأ في زيادة الكمية:', error);
    }
  };

  if (!availableOffers.length) return null;

  return (
    <div className="space-y-3">
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
            <div key={`incentive-${index}`} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
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
                    {offer.get_discount_type === "free" ? (
                      <>حصلت على <span className="font-semibold">{getLocalizedName(targetProduct, language)}</span> {discountText}!</>
                    ) : (
                      <>أضف <span className="font-semibold">{getLocalizedName(targetProduct, language)}</span> واحصل على {discountText}</>
                    )}
                  </p>
                  
                  <div className="flex items-center gap-2">
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
                </div>
                
                {/* زر الإضافة فقط إذا لم يكن المنتج مجاني */}
                {offer.get_discount_type !== "free" && (
                  <Button
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1 h-7 flex-shrink-0"
                    onClick={() => addTargetProduct(targetProduct)}
                    disabled={!targetProduct.inStock}
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
        // عرض تحفيز زيادة الكمية
        else if (incentiveOffer.type === 'increase_quantity') {
          const missingQuantity = incentiveOffer.missingQuantity || 0;
          const currentQuantity = incentiveOffer.qualifyingQuantity || 0;
          const requiredQuantity = incentiveOffer.requiredQuantity || 0;
          
          return (
            <div key={`quantity-incentive-${index}`} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
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
                        style={{ width: `${(currentQuantity / requiredQuantity) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-blue-700">
                      {currentQuantity}/{requiredQuantity} - أضف {missingQuantity} للحصول على <span className="font-semibold">{getLocalizedName(targetProduct, language)} {discountText}</span>
                    </p>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 h-7 flex-shrink-0"
                  onClick={() => increaseQualifyingQuantity(productId, currentQuantity, requiredQuantity)}
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
            <div key={`applied-offer-${index}`} className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-xs font-semibold text-green-700">✅ تم تطبيق العرض!</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 bg-center bg-contain bg-no-repeat rounded-md border border-green-200 flex-shrink-0"
                  style={{ backgroundImage: `url(${targetProduct.image})` }}
                />
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-green-700">
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

export default ProductOfferIncentives;
