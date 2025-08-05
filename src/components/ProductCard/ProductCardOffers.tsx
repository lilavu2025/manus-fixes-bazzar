import React, { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import useOffers from '@/hooks/useOffers';
import { useLanguage } from '@/utils/languageContextUtils';
import { useAuth } from '@/contexts/useAuth';
import { Button } from '@/components/ui/button';
import { Gift, Plus } from 'lucide-react';
import { getLocalizedName } from '@/utils/getLocalizedName';
import { getDisplayPrice } from '@/utils/priceUtils';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/types/product';

interface ProductCardOffersProps {
  productId: string;
}

interface IncentiveOffer {
  type: 'add_target_product' | 'increase_quantity';
  offer: any;
  targetProduct: Product;
  qualifyingQuantity?: number;
  requiredQuantity?: number;
  missingQuantity?: number;
}

const ProductCardOffers = ({ productId }: ProductCardOffersProps) => {
  const { t, language } = useLanguage();
  const { profile } = useAuth();
  const { cartItems, addToCart } = useCart();
  const { activeOffers } = useOffers();
  
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
              originalPrice: dbProduct.price || 0,
              image: dbProduct.image || '',
              inStock: dbProduct.in_stock || false,
              category: dbProduct.category_id || '',
              featured: dbProduct.featured || false,
              active: dbProduct.active || false,
              discount: dbProduct.discount || 0,
              rating: dbProduct.rating || 0,
              reviews: 0,
              stock_quantity: dbProduct.stock_quantity || 0
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
      const missingQuantity = requiredQuantity - currentQuantity;
      
      // البحث عن المنتج من قاعدة البيانات
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
        
      if (productData) {
        const product = {
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
        } as Product;
        
        await addToCart(product, missingQuantity);
      }
    } catch (error) {
      console.error('Error increasing qualifying quantity:', error);
    }
  };

  if (!availableOffers || availableOffers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {availableOffers.map((incentiveOffer, index) => {
        const { offer, targetProduct } = incentiveOffer;
        const displayPrice = getDisplayPrice(targetProduct, profile?.user_type);
        
        // الحصول على نص الخصم
        let discountText = '';
        if (offer.discount_type === 'percentage') {
          discountText = `بخصم ${offer.discount_value}%`;
        } else if (offer.discount_type === 'fixed') {
          discountText = `بخصم ${offer.discount_value} ${t("currency")}`;
        } else if (offer.discount_type === 'free') {
          discountText = 'مجاناً';
        }

        // عرض تحفيز إضافة المنتج المستهدف

        // عرض تحفيز زيادة الكمية
        else if (incentiveOffer.type === 'increase_quantity') {
          const missingQuantity = incentiveOffer.missingQuantity || 0;
          const currentQuantity = incentiveOffer.qualifyingQuantity || 0;
          const requiredQuantity = incentiveOffer.requiredQuantity || 0;
          
          return (
            <div key={`quantity-incentive-${index}`} className="p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
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
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: `${(currentQuantity / requiredQuantity) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-blue-700 leading-tight">
                      أضف {missingQuantity} للحصول على <span className="font-semibold">{getLocalizedName(targetProduct, language)} {discountText}</span>
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

        return null;
      })}
    </div>
  );
};

export default ProductCardOffers;
