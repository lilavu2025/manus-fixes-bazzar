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

const ProductCardContent = ({ 
  product, 
  quantity, 
  cartQuantity, 
  onQuantityChange, 
  onAddToCart, 
  onBuyNow,
  isLoading = false,
  onProductClick
}: ProductCardContentProps) => {
  const { t, isRTL } = useLanguage();
  const { profile } = useAuth();

  const displayPrice = product.price;

  return (
    <CardContent className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>
      <Link to={`/product/${product.id}`}>
        <h3 className={`font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors ${isRTL ? 'text-right' : 'text-left'}`}>
          {product.name}
        </h3>
      </Link>



      {/* Price */}
      <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <span className="text-xl font-bold text-primary">
          {displayPrice} {t('currency')}
        </span>
        {product.originalPrice && (
          <span className="text-sm text-gray-500 line-through">
            {product.originalPrice} {t('currency')}
          </span>
        )}
      </div>

      {/* Quantity Selector */}
      <div className={`mb-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <span className="text-sm text-gray-600">{t('quantity')}:</span>
        <QuantitySelector
          quantity={quantity}
          onQuantityChange={onQuantityChange}
          max={99}
          min={1}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={onAddToCart}
          disabled={!product.inStock}
          className="flex-1 gap-2 font-semibold"
          variant={cartQuantity > 0 ? "secondary" : "default"}
        >
          <ShoppingCart className="h-4 w-4" />
          {cartQuantity > 0 ? `${t('inCart')} (${cartQuantity})` : t('addToCart')}
        </Button>
        <Button
          onClick={onBuyNow}
          disabled={!product.inStock}
          variant="outline"
          className="px-4"
        >
          {t('buyNow')}
        </Button>
      </div>
    </CardContent>
  );
};

export default ProductCardContent;
