import React from 'react';
import { Star, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { useLanguage } from '@/utils/languageContextUtils';
import { useAuth } from '@/contexts/useAuth';
import { Product } from '@/types';
import QuantitySelector from '@/components/QuantitySelector';
import { getLocalizedName } from '@/utils/getLocalizedName';

interface ProductCardContentProps {
  product: Product;
  quantity: number;
  cartQuantity: number;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  isLoading?: boolean;
  onProductClick?: () => void;
}

const ProductCardContent: React.FC<ProductCardContentProps> = ({
  product,
  quantity,
  cartQuantity,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  isLoading = false,
  onProductClick,
}) => {
  const { t, isRTL, language } = useLanguage();
  const { profile } = useAuth();

  const displayPrice = product.price;

  return (
    <CardContent
      className={
        `w-full p-4 sm:p-6 ${isRTL ? 'text-right' : 'text-left'}`
      }
    >
      <Link to={`/product/${product.id}`} onClick={onProductClick} className="block w-full">
        <h3
          className={`font-semibold text-base sm:text-lg md:text-xl lg:text-2xl mb-2 line-clamp-2 group-hover:text-primary transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
        >
          {getLocalizedName(product, language)}
        </h3>
      </Link>
      {/* السعر  */}
      <div className={`flex flex-col gap-2 mb-4 w-full`}>
        <div className={`flex flex-col gap-2 w-full`}>
          <div className={`flex items-center gap-4 w-full ${isRTL ? 'flex-row-reverse justify-end' : 'justify-start'}`}> 
            {product.originalPrice !== product.price && (
              <span className="text-lg text-gray-500 line-through">
                {product.originalPrice} {t('currency')}
              </span>
            )}
            <span className="text-3xl font-bold text-primary">
              {product.price} {t('currency')}
            </span>
          </div>
        </div>
        <div className={`flex items-center gap-12 w-full ${isRTL ? 'flex-row-reverse justify-end' : 'justify-start'}`}>
          <QuantitySelector
            quantity={quantity}
            onQuantityChange={onQuantityChange}
            max={99}
            min={1}
          />
          <span className="text-sm sm:text-base text-gray-600 whitespace-nowrap">
            {t('quantity')}:
          </span>
        </div>
      </div>
      {/* أزرار الإجراءات */}
      <div className={`flex flex-col sm:flex-row gap-3 ${isRTL ? 'justify-end' : 'justify-start'}`}>
        <Button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddToCart();
          }}
          disabled={!product.inStock || isLoading}
          className="flex-1 w-full sm:w-auto gap-2 font-semibold"
          variant={cartQuantity > 0 ? 'secondary' : 'default'}
        >
          <ShoppingCart className="h-4 w-4" />
          {cartQuantity > 0
            ? `${t('inCart')} (${cartQuantity})`
            : t('addToCart')}
        </Button>
        <Button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBuyNow();
          }}
          disabled={!product.inStock || isLoading}
          variant="outline"
          className="w-full sm:w-auto px-4"
        >
          {t('buyNow')}
        </Button>
      </div>
    </CardContent>
  );
};

export default ProductCardContent;
