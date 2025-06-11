import React from 'react';
import { Eye, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/utils/languageContextUtils';
import { useAuth } from '@/contexts/useAuth';
import { Product } from '@/types';
import FavoriteButton from './FavoriteButton';

export interface ProductCardActionsProps {
  product: Product;
  onQuickView: () => void;
  onFavorite: () => Promise<void>;
  onShare: () => Promise<void>;
}

const ProductCardActions: React.FC<ProductCardActionsProps> = ({ 
  product, 
  onQuickView, 
  onFavorite, 
  onShare 
}) => {
  const { isRTL } = useLanguage();

  return (
    <div className={`absolute top-2 ${isRTL ? 'right-2' : 'left-2'} flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
      <Button
        size="icon"
        variant="secondary"
        className="h-8 w-8 bg-white/90 hover:bg-white shadow-md"
        onClick={onQuickView}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <FavoriteButton
        productId={product.id}
        variant="secondary"
        className="h-8 w-8 bg-white/90 hover:bg-white shadow-md"
        onClick={onFavorite}
      />
      <Button
        size="icon"
        variant="secondary"
        className="h-8 w-8 bg-white/90 hover:bg-white shadow-md"
        onClick={onShare}
      >
        <Share2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ProductCardActions;
