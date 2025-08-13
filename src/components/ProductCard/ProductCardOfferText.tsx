import React, { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { useLanguage } from '@/utils/languageContextUtils';
import { useAuth } from '@/contexts/useAuth';
import { Button } from '@/components/ui/button';
import { Gift } from 'lucide-react';
import { getLocalizedName } from '@/utils/getLocalizedName';
import { getDisplayPrice } from '@/utils/priceUtils';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedToast } from '@/hooks/useEnhancedToast';

console.log('🚀 ProductCardOfferText module loaded');

interface ProductCardOfferTextProps {
  productId: string;
}

const ProductCardOfferText = ({ productId }: ProductCardOfferTextProps) => {
  console.log('✅ ProductCardOfferText loaded successfully for product:', productId);
  
  const { t, language } = useLanguage();
  const { profile } = useAuth();
  const { state, addItem } = useCart();
  const cartItems = state.items;
  const enhancedToast = useEnhancedToast();
  
  const [incentiveOffer, setIncentiveOffer] = useState<any>(null);

  useEffect(() => {
    const findIncentive = async () => {
      try {
        // البحث عن العروض التي تستهدف هذا المنتج
        const { data: offers } = await supabase
          .from('offers')
          .select('*')
          .eq('active', true)
          .eq('offer_type', 'buy_get')
          .eq('get_product_id', productId);

        if (!offers || offers.length === 0) {
          setIncentiveOffer(null);
          return;
        }

        for (const offer of offers) {
          // البحث عن المنتج المؤهل في السلة
          const qualifyingItem = cartItems.find(item => item.product.id === offer.linked_product_id);
          
          // التحقق إذا كان المنتج المستهدف موجود بالسلة
          const targetItem = cartItems.find(item => item.product.id === offer.get_product_id);

          // إذا كان المنتج المؤهل موجود بالكمية المطلوبة والمنتج المستهدف غير موجود
          if (qualifyingItem && qualifyingItem.quantity >= offer.buy_quantity && !targetItem) {
            // جلب بيانات المنتج المستهدف
            const { data: targetProduct } = await supabase
              .from('products')
              .select('*')
              .eq('id', offer.get_product_id)
              .single();

            if (targetProduct) {
              setIncentiveOffer({
                offer,
                targetProduct,
                qualifyingProduct: qualifyingItem.product
              });
              return;
            }
          }
        }

        setIncentiveOffer(null);
      } catch (error) {
        console.error('خطأ في البحث عن التحفيزات:', error);
        setIncentiveOffer(null);
      }
    };

    findIncentive();
  }, [cartItems, productId]);

  const handleAddToCart = async () => {
    if (!incentiveOffer) return;

    try {
      const targetProduct = incentiveOffer.targetProduct;
      
      // تحويل المنتج للشكل المطلوب
      const productToAdd = {
        id: targetProduct.id,
        name: targetProduct.name_ar || targetProduct.name_en || '',
        nameEn: targetProduct.name_en || '',
        nameHe: targetProduct.name_he || '',
        description: targetProduct.description_ar || '',
        descriptionEn: targetProduct.description_en || '',
        descriptionHe: targetProduct.description_he || '',
        price: targetProduct.price,
        wholesalePrice: targetProduct.wholesale_price,
        image: targetProduct.image,
        category: targetProduct.category_id,
        inStock: targetProduct.in_stock,
        rating: 0,
        reviews: 0,
        stock_quantity: targetProduct.stock_quantity
      };

      await addItem(productToAdd, 1);
      enhancedToast.success(`تم إضافة ${getLocalizedName(productToAdd, language)} للسلة`);
    } catch (error) {
      console.error('خطأ في إضافة المنتج:', error);
      enhancedToast.error('خطأ في إضافة المنتج للسلة');
    }
  };

  if (!incentiveOffer) {
    return null;
  }

  const { offer, targetProduct } = incentiveOffer;
  
  // تحديد نص الخصم
  let discountText = "";
  if (offer.get_discount_type === "percentage") {
    discountText = `خصم ${offer.get_discount_value}%`;
  } else if (offer.get_discount_type === "fixed") {
    discountText = `خصم ${offer.get_discount_value} شيكل`;
  } else if (offer.get_discount_type === "free") {
    discountText = "مجاني";
  }

  // إعداد المنتج للعرض
  const productForDisplay = {
    id: targetProduct.id,
    name: targetProduct.name_ar || targetProduct.name_en || '',
    nameEn: targetProduct.name_en || '',
    nameHe: targetProduct.name_he || '',
    description: targetProduct.description_ar || '',
    descriptionEn: targetProduct.description_en || '',
    descriptionHe: targetProduct.description_he || '',
    price: targetProduct.price,
    wholesalePrice: targetProduct.wholesale_price,
    image: targetProduct.image,
    category: targetProduct.category_id,
    inStock: targetProduct.in_stock,
    rating: 0,
    reviews: 0,
    stock_quantity: targetProduct.stock_quantity
  };

  return (
    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 mt-2">
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
            أضف <span className="font-semibold">{getLocalizedName(productForDisplay, language)}</span> واحصل على {discountText}
          </p>
          
          <div className="flex items-center gap-2 mb-2">
            {offer.get_discount_type !== "free" && (
              <>
                <span className="text-xs text-gray-500 line-through">
                  {getDisplayPrice(productForDisplay, profile?.user_type).toFixed(2)} شيكل
                </span>
                <span className="text-xs text-orange-600 font-bold">
                  {offer.get_discount_type === "percentage" 
                    ? (getDisplayPrice(productForDisplay, profile?.user_type) * (1 - offer.get_discount_value / 100)).toFixed(2)
                    : (getDisplayPrice(productForDisplay, profile?.user_type) - offer.get_discount_value).toFixed(2)
                  } شيكل
                </span>
              </>
            )}
            {offer.get_discount_type === "free" && (
              <span className="text-xs text-green-600 font-bold">مجاني!</span>
            )}
          </div>
          
          {offer.get_discount_type !== "free" && (
            <Button
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1 h-7 w-full"
              onClick={handleAddToCart}
              disabled={!targetProduct.in_stock}
            >
              إضافة للسلة
            </Button>
          )}
          
          {offer.get_discount_type === "free" && (
            <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded border text-center">
              ✨ يُضاف تلقائياً
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCardOfferText;
