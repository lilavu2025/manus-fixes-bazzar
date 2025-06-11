import React from 'react';
import { Star, ShoppingCart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/utils/languageContextUtils';
import { useAuth } from '@/contexts/useAuth';
import { Product } from '@/types';
import QuantitySelector from '@/components/QuantitySelector';
import FavoriteButton from '@/components/ProductCard/FavoriteButton';

export interface ProductCardQuickViewProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  quantity: number;
  cartQuantity: number;
  isFavorite: boolean;
  onQuantityChange: React.Dispatch<React.SetStateAction<number>>;
  onAddToCart: () => Promise<void>;
  onBuyNow: () => Promise<void>;
  onFavorite: () => Promise<void>;
  onShare: () => Promise<void>;
}

const ProductCardQuickView: React.FC<ProductCardQuickViewProps> = ({ 
  product, 
  isOpen, 
  onClose, 
  quantity, 
  cartQuantity, 
  isFavorite, 
  onQuantityChange, 
  onAddToCart, 
  onBuyNow, 
  onFavorite, 
  onShare 
}) => {
  const { t, isRTL } = useLanguage();
  const { profile } = useAuth();

  const displayPrice = product.price;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-96 object-cover rounded-lg"
            />
          </div>
          <div className="space-y-4">


            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-2xl font-bold text-primary">
                {displayPrice} {t('currency')}
              </span>
              {product.originalPrice && (
                <span className="text-lg text-gray-500 line-through">
                  {product.originalPrice} {t('currency')}
                </span>
              )}
            </div>

            <p className="text-gray-600">{product.description}</p>

            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-sm text-gray-600">{t('quantity')}:</span>
              <QuantitySelector
                quantity={quantity}
                onQuantityChange={onQuantityChange}
                max={99}
                min={1}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={onAddToCart}
                disabled={!product.inStock}
                className="flex-1 gap-2"
                variant={cartQuantity > 0 ? "secondary" : "default"}
              >
                <ShoppingCart className="h-4 w-4" />
                {cartQuantity > 0 ? `${t('inCart')} (${cartQuantity})` : t('addToCart')}
              </Button>
              <Button
                onClick={onBuyNow}
                disabled={!product.inStock}
                variant="outline"
              >
                {t('buyNow')}
              </Button>
            </div>

            <div className="flex gap-2">
              <FavoriteButton
                productId={product.id}
                variant="outline"
                size="default"
                className="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                className="gap-2 flex-1"
                onClick={onShare}
              >
                <Share2 className="h-4 w-4" />
                {t('share')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductCardQuickView;
