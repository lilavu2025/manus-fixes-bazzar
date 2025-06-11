import * as React from 'react';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/utils/languageContextUtils';

interface ProductInfoProps {
  product: {
    name: string;
    nameEn?: string;
    rating?: number;
    reviews?: number;
    price: number;
    originalPrice?: number;
    inStock: boolean;
    description: string;
  };
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
        {product.nameEn && <p className="text-gray-600">{product.nameEn}</p>}
      </div>



      {/* Price */}
      <div className="flex items-center gap-4">
        <span className="text-3xl font-bold text-primary">
          {product.price} {t('currency')}
        </span>
        {product.originalPrice && (
          <span className="text-xl text-gray-500 line-through">
            {product.originalPrice} {t('currency')}
          </span>
        )}
      </div>

      {/* Stock Status */}
      <div>
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

      {/* Description */}
      <div>
        <h3 className="font-semibold mb-2">{t('productDescription')}</h3>
        <p className="text-gray-600 leading-relaxed">{product.description}</p>
      </div>
    </div>
  );
};

export default ProductInfo;
