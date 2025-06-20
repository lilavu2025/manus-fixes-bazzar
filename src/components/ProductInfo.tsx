import * as React from 'react';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/utils/languageContextUtils';
import { getLocalizedName } from '@/utils/getLocalizedName';
import { useAuth } from '@/contexts/useAuth';
import { getDisplayPrice } from '@/utils/priceUtils';
import type { Product as ProductFull } from '@/types/product';

interface ProductInfoProps {
  product: ProductFull;
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const { t, isRTL, language } = useLanguage();
  const { profile } = useAuth();
  const displayPrice = getDisplayPrice(product, profile?.user_type);

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
      <div>
        <h1 className="text-3xl font-bold mb-2 text-center">{getLocalizedName(product, language)}</h1>
      </div>
      {/* السعر */}
      <div className={`flex flex-col gap-2 w-full`}>
        <div className={`flex items-center gap-4 w-full ${isRTL ? 'flex-row-reverse justify-end' : 'justify-start'}`}> 
          {product.originalPrice !== displayPrice && (
            <span className="text-lg text-gray-500 line-through">
              {product.originalPrice} {t('currency')}
            </span>
          )}
          <span className="text-3xl font-bold text-primary">
            {displayPrice} {t('currency')}
          </span>
        </div>
      </div>
      {/* Description */}
      <div className={isRTL ? 'text-right' : 'text-left'}>
        <h3 className="font-semibold mb-2">{t('productDescription')}</h3>
        <p className="text-gray-600 leading-relaxed">{product.description}</p>
      </div>
    </div>
  );
};

export default ProductInfo;
