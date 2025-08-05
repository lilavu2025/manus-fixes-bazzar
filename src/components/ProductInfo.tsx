import * as React from 'react';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/utils/languageContextUtils';
import { getLocalizedName, getLocalizedDescription } from '@/utils/getLocalizedName';
import { useAuth } from '@/contexts/useAuth';
import { getDisplayPrice } from '@/utils/priceUtils';
import ProductCardBadges from '@/components/ProductCard/ProductCardBadges';
import ProductOfferIncentives from '@/components/ProductOfferIncentives';
import ProductOffersDisplay from '@/components/ProductOffersDisplay';
import type { Product as ProductFull } from '@/types/product';

interface ProductInfoProps {
  product: ProductFull;
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const { t, isRTL, language } = useLanguage();
  const { profile } = useAuth();
  const displayPrice = getDisplayPrice(product, profile?.user_type);

  return (
    <div className={`space-y-4 sm:space-y-6 product-info-section`}>
      <div>
        <h1 className="responsive-product-title font-bold mb-3 leading-tight">{getLocalizedName(product, language)}</h1>
        {/* البادجز */}
        <div className="flex justify-center lg:justify-start mb-4">
          <ProductCardBadges product={product} variant="belowName" />
        </div>
      </div>
      {/* السعر */}
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-4 w-full"> 
          {product.originalPrice !== displayPrice && (
            <span className="text-sm sm:text-base md:text-lg text-gray-500 line-through">
              {product.originalPrice} {t('currency')}
            </span>
          )}
          <span className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
            {displayPrice} {t('currency')}
          </span>
        </div>
      </div>
      {/* Description */}
      <div className="text-center lg:text-start">
        <h3 className="font-semibold mb-3 text-sm sm:text-base">{t('productDescription')}</h3>
        <p className="text-gray-600 leading-relaxed text-sm sm:text-base line-height-relaxed">{getLocalizedDescription(product, language)}</p>
      </div>
      
      {/* Active Offers */}
      <ProductOffersDisplay currentProduct={product} />
      
      {/* Offer Incentives */}
      <ProductOfferIncentives productId={product.id} />
    </div>
  );
};

export default ProductInfo;
