import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/types';
import ProductCardBadges from './ProductCardBadges';
import ProductCardActions from './ProductCardActions';
import LazyImage from '@/components/LazyImage';

export interface ProductCardImageProps {
  product: Product;
  isFavorite: boolean;
  onQuickView: () => void;
  onFavorite: () => Promise<void>;
  onShare: () => Promise<void>;
  isLoading?: boolean;
}

const ProductCardImage: React.FC<ProductCardImageProps> = ({ 
  product, 
  isFavorite,
  onQuickView, 
  onFavorite, 
  onShare,
  isLoading = false,
}: ProductCardImageProps) => {
  return (
    <div className="relative overflow-hidden">
      <Link to={`/product/${product.id}`} className="block">
        <LazyImage
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
          priority={true}
        />
        {/* Overlay for clickable area */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
      
      <ProductCardBadges product={product} />
      <ProductCardActions 
        product={product}
        onQuickView={onQuickView}
        onFavorite={onFavorite}
        onShare={onShare}
      />
    </div>
  );
};

export default ProductCardImage;
