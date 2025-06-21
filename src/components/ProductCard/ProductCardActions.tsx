import React from 'react';
import { Eye, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  return (
    <div className="absolute top-2 left-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -translate-x-4 group-hover:translate-x-0 transition-transform">
      <Button
        size="icon"
        variant="secondary"
        className="h-8 w-8 bg-white/90 hover:bg-orange-100 hover:text-orange-600 shadow-md transition-colors"
        onClick={e => { e.preventDefault(); e.stopPropagation(); onQuickView(); }}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <FavoriteButton
        productId={product.id}
        variant="secondary"
        className="h-8 w-8 bg-white/90 hover:bg-orange-100 hover:text-orange-600 shadow-md transition-colors"
        onClick={async (e?: React.MouseEvent) => { if (e) { e.preventDefault(); e.stopPropagation(); } await onFavorite(); }}
      />
      <Button
        size="icon"
        variant="secondary"
        className="h-8 w-8 bg-white/90 hover:bg-orange-100 hover:text-orange-600 shadow-md transition-colors"
        onClick={async e => { e.preventDefault(); e.stopPropagation(); await onShare(); }}
      >
        <Share2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ProductCardActions;
