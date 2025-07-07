import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/types';
import ProductCardBadges from './ProductCardBadges';

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
}) => {
  return (
    // إضافة class "group" لتمكين تأثير hover
    <div className="relative group bg-white rounded-t-xl border-b border-gray-200 aspect-[4/3] w-full flex-shrink-0 overflow-hidden">
      {/* الخلفية باستخدام background-image لعرض الصورة كاملة داخل الإطار */}
      <Link
        to={`/product/${product.id}`}
        className="block w-full h-full relative"
      >
        <div
          className="w-full h-full bg-center bg-contain bg-no-repeat"
          style={{ backgroundImage: `url(${product.image})` }}
        />
        {/* Overlay للتأثير على Hover */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>

      {/* بادج الخصم فقط فوق الصورة */}
      <ProductCardBadges product={product} variant="onImage" />
    </div>
  );
};

export default ProductCardImage;
