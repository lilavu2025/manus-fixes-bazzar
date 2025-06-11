import React from 'react';
import { Star, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { useLanguage } from '@/utils/languageContextUtils';
import { useAuth } from '@/contexts/useAuth';
import { Product } from '@/types';
import QuantitySelector from '@/components/QuantitySelector';

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
  const { t, isRTL } = useLanguage();
  const { profile } = useAuth();

  const displayPrice = product.price;

  return (
    <CardContent
      className={
        `w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto p-4 sm:p-6 ${
          isRTL ? 'text-right' : 'text-left'
        }`
      }
    >
      <Link to={`/product/${product.id}`} onClick={onProductClick}>
        <h3
          className={
            `font-semibold text-base sm:text-lg md:text-xl lg:text-2xl mb-2 line-clamp-2 group-hover:text-primary transition-colors ${
              isRTL ? 'text-right' : 'text-left'
            }`
          }
        >
          {product.name}
        </h3>
      </Link>

      {/* السعر */}
      <div
        className={`flex items-baseline gap-2 mb-4 ${
          isRTL ? 'flex-row-reverse' : ''
        }`}
      >
        <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
          {displayPrice} {t('currency')}
        </span>
        {product.originalPrice && (
          <span className="text-sm sm:text-base text-gray-500 line-through">
            {product.originalPrice} {t('currency')}
          </span>
        )}
      </div>

      {/* محدد الكمية */}
      <div
        className={`flex flex-col sm:flex-row items-center sm:items-stretch gap-2 mb-4 ${
          isRTL ? 'sm:flex-row-reverse' : ''
        }`}
      >
        <span className="text-sm sm:text-base text-gray-600 whitespace-nowrap">
          {t('quantity')}:
        </span>
        <QuantitySelector
          quantity={quantity}
          onQuantityChange={onQuantityChange}
          max={99}
          min={1}
        />
      </div>

      {/* أزرار الإجراءات */}
      <div className="flex flex-col sm:flex-row gap-3">
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
