import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Gift, Tag, Percent, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/utils/languageContextUtils';
import { useAuth } from '@/contexts/useAuth';
import { getLocalizedName } from '@/utils/getLocalizedName';
import { getDisplayPrice } from '@/utils/priceUtils';
import type { Product } from '@/types';

interface ProductOffersDisplayProps {
  currentProduct: Product;
}

interface OfferDisplay {
  id: string;
  title: string;
  description: string;
  offerType: string;
  discountText: string;
  targetProduct?: any;
  linkedProduct?: any;
  buyQuantity?: number;
  active: boolean;
}

const ProductOffersDisplay = ({ currentProduct }: ProductOffersDisplayProps) => {
  const { t, language } = useLanguage();
  const { profile } = useAuth();
  const [offers, setOffers] = useState<OfferDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  // دالة لجلب العروض المتعلقة بالمنتج الحالي
  const fetchProductOffers = async () => {
    try {
      setLoading(true);
      console.log('🔍 جلب العروض للمنتج:', currentProduct.id);

      // جلب جميع العروض النشطة
      const { data: offersData, error } = await supabase
        .from('offers')
        .select(`
          id,
          title_ar,
          title_en,
          title_he,
          description_ar,
          description_en,
          description_he,
          offer_type,
          discount_type,
          discount_percentage,
          discount_amount,
          buy_quantity,
          linked_product_id,
          get_product_id,
          get_discount_type,
          get_discount_value,
          start_date,
          end_date,
          active
        `)
        .eq('active', true)
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString());

      if (error) throw error;

      const relevantOffers: OfferDisplay[] = [];

      for (const offer of offersData || []) {
        let isRelevant = false;
        let offerDisplay: OfferDisplay | null = null;

        // عروض عادية (discount) - تطبق على جميع المنتجات
        if (offer.offer_type === 'discount') {
          isRelevant = true;
          
          let discountText = '';
          if (offer.discount_type === 'percentage') {
            discountText = `خصم ${offer.discount_percentage}%`;
          } else if (offer.discount_type === 'fixed') {
            discountText = `خصم ${offer.discount_amount} ${t('currency')}`;
          }

          offerDisplay = {
            id: offer.id,
            title: offer.title_ar || offer.title_en || offer.title_he || t('discount'),
            description: offer.description_ar || offer.description_en || offer.description_he || '',
            offerType: 'discount',
            discountText,
            active: offer.active
          };
        }

        // عروض منتج محدد (product_discount)
        else if (offer.offer_type === 'product_discount' && offer.linked_product_id === currentProduct.id) {
          isRelevant = true;
          
          let discountText = '';
          if (offer.discount_type === 'percentage') {
            discountText = `خصم خاص ${offer.discount_percentage}%`;
          } else if (offer.discount_type === 'fixed') {
            discountText = `خصم خاص ${offer.discount_amount} ${t('currency')}`;
          }

          offerDisplay = {
            id: offer.id,
            title: offer.title_ar || offer.title_en || offer.title_he || t('specialDiscount'),
            description: offer.description_ar || offer.description_en || offer.description_he || '',
            offerType: 'product_discount',
            discountText,
            active: offer.active
          };
        }

        // عروض اشتري واحصل (buy_get)
        else if (offer.offer_type === 'buy_get') {
          const linkedProductId = offer.linked_product_id;
          const getProductId = offer.get_product_id;
          
          // إذا كان المنتج الحالي هو المنتج المؤهل أو المنتج المستهدف
          if (currentProduct.id === linkedProductId || currentProduct.id === getProductId) {
            isRelevant = true;

            // جلب تفاصيل المنتجات المرتبطة
            const productIds = [linkedProductId, getProductId].filter(Boolean);
            const { data: products } = await supabase
              .from('products')
              .select(`
                id,
                name_ar,
                name_en,
                name_he,
                image,
                price,
                wholesale_price
              `)
              .in('id', productIds);

            const linkedProduct = products?.find(p => p.id === linkedProductId);
            const targetProduct = products?.find(p => p.id === getProductId);

            let discountText = '';
            if (offer.get_discount_type === 'free') {
              discountText = t('freeItem') || 'مجاني';
            } else if (offer.get_discount_type === 'percentage') {
              discountText = `خصم ${offer.get_discount_value}%`;
            } else if (offer.get_discount_type === 'fixed') {
              discountText = `خصم ${offer.get_discount_value} ${t('currency')}`;
            }

            let description = '';
            if (currentProduct.id === linkedProductId) {
              const targetName = getLocalizedName(targetProduct, language);
              description = `اشتري ${offer.buy_quantity} من هذا المنتج واحصل على ${targetName} ${discountText}`;
            } else if (currentProduct.id === getProductId) {
              const linkedName = getLocalizedName(linkedProduct, language);
              description = `احصل على هذا المنتج ${discountText} عند شراء ${offer.buy_quantity} من ${linkedName}`;
            }

            offerDisplay = {
              id: offer.id,
              title: offer.title_ar || offer.title_en || offer.title_he || t('buyGetOffer'),
              description,
              offerType: 'buy_get',
              discountText,
              buyQuantity: offer.buy_quantity,
              linkedProduct,
              targetProduct,
              active: offer.active
            };
          }
        }

        if (isRelevant && offerDisplay) {
          relevantOffers.push(offerDisplay);
        }
      }

      console.log('العروض ذات الصلة:', relevantOffers);
      setOffers(relevantOffers);
    } catch (error) {
      console.error("❌ خطأ في جلب العروض:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductOffers();
  }, [currentProduct.id]);

  if (loading || offers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <Tag className="h-5 w-5 text-green-600" />
        {t("activeOffers") || "العروض النشطة"}
      </h3>
      
      <div className="space-y-3">
        {offers.map((offer) => (
          <Card key={offer.id} className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {offer.offerType === 'buy_get' ? (
                    <Gift className="h-6 w-6 text-orange-600 mt-1" />
                  ) : (
                    <Percent className="h-6 w-6 text-green-600 mt-1" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-800">{offer.title}</h4>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${
                        offer.offerType === 'buy_get' 
                          ? 'bg-orange-100 text-orange-700' 
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {offer.discountText}
                    </Badge>
                  </div>
                  
                  {offer.description && (
                    <p className="text-sm text-gray-600 mb-2">{offer.description}</p>
                  )}
                  
                  {/* عرض تفاصيل إضافية لعروض اشتري واحصل */}
                  {offer.offerType === 'buy_get' && (offer.linkedProduct || offer.targetProduct) && (
                    <div className="flex items-center gap-3 mt-3 p-2 bg-gray-50 rounded-lg">
                      {offer.linkedProduct && (
                        <div className="flex items-center gap-2">
                          {offer.linkedProduct.image && (
                            <div 
                              className="w-8 h-8 bg-center bg-contain bg-no-repeat rounded border"
                              style={{ backgroundImage: `url(${offer.linkedProduct.image})` }}
                            />
                          )}
                          <span className="text-xs text-gray-600">
                            {getLocalizedName(offer.linkedProduct, language)}
                          </span>
                        </div>
                      )}
                      
                      {offer.linkedProduct && offer.targetProduct && (
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      )}
                      
                      {offer.targetProduct && (
                        <div className="flex items-center gap-2">
                          {offer.targetProduct.image && (
                            <div 
                              className="w-8 h-8 bg-center bg-contain bg-no-repeat rounded border"
                              style={{ backgroundImage: `url(${offer.targetProduct.image})` }}
                            />
                          )}
                          <span className="text-xs text-gray-600">
                            {getLocalizedName(offer.targetProduct, language)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProductOffersDisplay;
