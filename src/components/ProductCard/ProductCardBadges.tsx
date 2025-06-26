import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/utils/languageContextUtils';
import { useAuth } from '@/contexts/useAuth';

interface ProductCardBadgesProps {
  product: {
    discount?: number;
    featured?: boolean;
    inStock: boolean;
    wholesalePrice?: number;
    top_ordered?: boolean;
  };
}

const ProductCardBadges = ({ product }: ProductCardBadgesProps) => {
  const { t, isRTL } = useLanguage();
  const { profile } = useAuth();

  const isWholesale = profile?.user_type === 'wholesale';
  const showWholesaleLabel = isWholesale && product.wholesalePrice;

  return (
    <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} flex flex-col gap-1 items-center text-center`}>
      {showWholesaleLabel && (
        <Badge className="bg-blue-500 hover:bg-blue-600">
          {t('wholesale')}
        </Badge>
      )}
      {product.top_ordered && (
        <Badge variant="destructive" className="animate-bounce-in">
          {t('topOrdered')}
        </Badge>
      )}
      {product.discount > 0 && (
        <Badge variant="destructive" className="animate-bounce-in">
          {t('discount')} {product.discount}%
        </Badge>
      )}
      {product.featured && (
        <Badge className="bg-green-500 hover:bg-green-600">
          {t('featured')}
        </Badge>
      )}
      {product.inStock ? (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          {t('inStock')}
        </Badge>
      ) : (
        <Badge variant="destructive">
          {t('outOfStock')}
        </Badge>
      )}
    </div>
  );
};

export default ProductCardBadges;
