import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/utils/languageContextUtils';
import { useAuth } from '@/contexts/useAuth';

interface ProductCardBadgesProps {
  product: {
    id?: string;
    name?: string;
    name_ar?: string;
    name_en?: string;
    discount?: number | string; // يقبل رقم أو نص
    featured?: boolean;
    inStock?: boolean;
    wholesalePrice?: number;
    top_ordered?: boolean;
    rating?: number;
    stock_quantity?: number;
    created_at?: string;
    originalPrice?: number;
    price?: number;
  };
  variant?: 'onImage' | 'belowName'; // للتحكم في المكان والنوع
  className?: string;
}

const ProductCardBadges = ({ 
  product, 
  variant = 'onImage',
  className = ''
}: ProductCardBadgesProps) => {
  const { t, isRTL } = useLanguage();
  const { profile } = useAuth();

  const isWholesale = profile?.user_type === 'wholesale';

  // Helper functions with stronger validation
  const isNewProduct = () => {
    if (!product.created_at || product.created_at === '') return false;
    try {
      const createdDate = new Date(product.created_at);
      const now = new Date();
      const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7 && daysDiff >= 0;
    } catch {
      return false;
    }
  };

  const hasPriceDrop = () => {
    return product.originalPrice && 
           product.price && 
           typeof product.originalPrice === 'number' &&
           typeof product.price === 'number' &&
           product.originalPrice > 0 && 
           product.price > 0 && 
           product.originalPrice > product.price && 
           (!product.discount || product.discount === 0 || product.discount === null || product.discount === undefined);
  };

  // Validation functions to ensure no zeros or invalid values
  const isValidDiscount = (discount: any) => {
    // التحويل لرقم إذا كان نص
    const discountNum = typeof discount === 'string' ? parseFloat(discount) : discount;
    
    // Block zeros, null, undefined, NaN explicitly
    if (
      discountNum === 0 || 
      discountNum === null || 
      discountNum === undefined || 
      isNaN(discountNum) ||
      discountNum <= 0
    ) {
      return false;
    }
    
    return typeof discountNum === 'number' && discountNum > 0;
  };

  const isValidRating = (rating: any) => {
    // Block zeros explicitly
    if (rating === 0 || rating === null || rating === undefined) {
      return false;
    }
    
    return rating && 
           typeof rating === 'number' && 
           !isNaN(rating) && 
           rating > 0 && 
           rating >= 4.5;
  };

  const isValidStock = (stock: any) => {
    // Block zeros explicitly
    if (stock === 0 || stock === null || stock === undefined) {
      return false;
    }
    
    return stock && 
           typeof stock === 'number' && 
           !isNaN(stock) && 
           stock > 0 && 
           stock <= 5;
  };

  const isValidWholesalePrice = (price: any) => {
    // Block zeros explicitly
    if (price === 0 || price === null || price === undefined) {
      return false;
    }
    
    return price && 
           typeof price === 'number' && 
           !isNaN(price) && 
           price > 0;
  };

  // تحديد الـ styling والمحتوى حسب variant
  const isOnImage = variant === 'onImage';
  const isBelowName = variant === 'belowName';

  // Container classes based on variant
  const containerClasses = isOnImage 
    ? `absolute top-2 ${isRTL ? 'left-2' : 'right-2'} flex flex-col gap-1 items-end text-center z-10 max-w-[90px] sm:max-w-[100px]`
    : `flex flex-wrap gap-1 items-center justify-start ${className}`;

  return (
    <div className={containerClasses}>
      {/* البادجز على الصورة - الخصم والجديد فقط */}
      {isOnImage && (
        <>
          {/* بادج الخصم */}
          {isValidDiscount(product.discount) && (
            <Badge variant="destructive" className="bg-red-500 text-white font-bold animate-pulse text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
              -{typeof product.discount === 'string' ? parseFloat(product.discount) : product.discount}%
            </Badge>
          )}
          
          {/* بادج منتج جديد */}
          {isNewProduct() && (
            <Badge variant="secondary" className="bg-green-500 text-white font-bold text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
              {t('new')}
            </Badge>
          )}
        </>
      )}
      
      {/* باقي البادجز - تحت الاسم */}
      {isBelowName && (
        <>
          {/* بادج انخفاض السعر */}
          {hasPriceDrop() && (
            <Badge variant="destructive" className="bg-orange-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
              {t('priceDrop')}
            </Badge>
          )}
          
          {/* بادج الأكثر طلباً */}
          {product.top_ordered === true && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
              {t('topOrdered')}
            </Badge>
          )}
          
          {/* بادج المنتج المميز */}
          {product.featured === true && (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
              {t('featured')}
            </Badge>
          )}
          
          {/* بادج التقييم العالي */}
          {isValidRating(product.rating) && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
              ⭐ {product.rating!.toFixed(1)}
            </Badge>
          )}
          
          {/* بادج الكمية المحدودة */}
          {isValidStock(product.stock_quantity) && (
            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
              {t('limitedStock')}: {product.stock_quantity}
            </Badge>
          )}
          
          {/* بادج عملاء الجملة */}
          {isWholesale && isValidWholesalePrice(product.wholesalePrice) && (
            <Badge className="bg-blue-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
              {t('wholesale')}
            </Badge>
          )}
          
          {/* بادج حالة المخزون */}
          {typeof product.inStock === 'boolean' && (
            product.inStock ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                {t('inStock')}
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                {t('outOfStock')}
              </Badge>
            )
          )}
        </>
      )}
    </div>
  );
};

export default ProductCardBadges;
