// مكون كرت المنتج - يعرض معلومات المنتج مع إمكانيات التفاعل
import React, { useState, memo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Product } from '@/types/product';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/useAuth';
import { useLanguage } from '@/utils/languageContextUtils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import ProductCardImage from './ProductCard/ProductCardImage';
import ProductCardContent from './ProductCard/ProductCardContent';
import ProductCardQuickView from './ProductCard/ProductCardQuickView';

// خصائص مكون كرت المنتج
interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

// مكون كرت المنتج مع تحسين الأداء باستخدام memo
const ProductCard: React.FC<ProductCardProps> = memo(({ product, onQuickView }) => {
  // استخدام الخطافات للوصول للوظائف المختلفة
  const { addItem, getItemQuantity} = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // حالات المكون المحلية
  const [quantity, setQuantity] = useState(1);
  const [showQuickView, setShowQuickView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // الحصول على كمية المنتج في السلة
  const cartQuantity = getItemQuantity(product.id);

  // وظيفة إضافة المنتج إلى السلة مع تحديث فوري للواجهة
  const handleAddToCart = useCallback(async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      await addItem(product, quantity);
      toast.success(t('addedToCart'));
    } catch (error) {
      console.error('خطأ في إضافة المنتج للسلة:', error);
      toast.error(t('errorAddingToCart') || 'حدث خطأ في إضافة المنتج للسلة');
    } finally {
      setIsLoading(false);
    }
  }, [addItem, product, quantity, isLoading, t]);

  // وظيفة الشراء المباشر - توجه إلى صفحة الدفع
  const handleBuyNow = useCallback(async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      await addItem(product, quantity);
      navigate('/checkout', { 
        state: { 
          directBuy: true, 
          product: product, 
          quantity: quantity 
        } 
      });
    } catch (error) {
      console.error('خطأ في عملية الشراء المباشر:', error);
      toast.error(t('errorProcessingOrder') || 'حدث خطأ في معالجة الطلب');
    } finally {
      setIsLoading(false);
    }
  }, [addItem, product, quantity, isLoading, t, navigate]);

  // وظيفة فتح العرض السريع للمنتج
  const handleQuickView = useCallback(() => {
    if (onQuickView) {
      onQuickView(product);
    } else {
      setShowQuickView(true);
    }
  }, [onQuickView, product]);

  // وظيفة إضافة/إزالة المنتج من المفضلة
  const handleFavorite = useCallback(async () => {
    if (!user) {
      toast.error(t('pleaseLogin'));
      return;
    }
    
    try {
      const wasInFavorites = isFavorite(product.id);
      await toggleFavorite(product.id);
      toast.success(wasInFavorites ? t('removedFromFavorites') : t('addedToFavorites'));
    } catch (error) {
      console.error('خطأ في تحديث المفضلة:', error);
      toast.error(t('errorUpdatingFavorites') || 'حدث خطأ في تحديث المفضلة');
    }
  }, [user, toggleFavorite, product.id, t, isFavorite]);

  // وظيفة مشاركة المنتج
  const handleShare = useCallback(async () => {
    const productUrl = `${window.location.origin}/product/${product.id}`;
    
    try {
      // استخدام واجهة المشاركة الأصلية إذا كانت متاحة
      if (navigator.share && navigator.canShare) {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: productUrl
        });
      } else {
        // نسخ الرابط إلى الحافظة كبديل
        await navigator.clipboard.writeText(productUrl);
        toast.success(t('linkCopied'));
      }
    } catch (error) {
      // حل بديل للمتصفحات القديمة
      try {
        const textArea = document.createElement('textarea');
        textArea.value = productUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success(t('linkCopied'));
      } catch (fallbackError) {
        console.error('خطأ في مشاركة المنتج:', fallbackError);
        toast.error(t('errorSharing') || 'حدث خطأ في المشاركة');
      }
    }
  }, [product, t]);

  // وظيفة التنقل إلى صفحة تفاصيل المنتج
  const handleCardClick = useCallback(() => {
    navigate(`/product/${product.id}`);
  }, [navigate, product.id]);

  // التحقق من حالة المفضلة
  const isFav = isFavorite(product.id);

  return (
    <>
      {/* كرت المنتج الرئيسي مع تأثيرات التفاعل */}
      <Card 
        className="product-card group relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-offset-2 cursor-pointer"
        onClick={handleCardClick}
      >
        {/* صورة المنتج مع أزرار التفاعل */}
        <ProductCardImage
          product={product}
          isFavorite={isFav}
          onQuickView={handleQuickView}
          onFavorite={handleFavorite}
          onShare={handleShare}
          isLoading={isLoading}
        />
        
        {/* محتوى المنتج مع الأزرار */}
        <ProductCardContent
          product={product}
          quantity={quantity}
          cartQuantity={cartQuantity}
          onQuantityChange={setQuantity}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          isLoading={isLoading}
          onProductClick={handleCardClick}
        />
      </Card>

      {/* مودال العرض السريع للمنتج */}
      <ProductCardQuickView
        product={product}
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
        quantity={quantity}
        cartQuantity={cartQuantity}
        isFavorite={isFav}
        onQuantityChange={setQuantity}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        onFavorite={handleFavorite}
        onShare={handleShare}
      />
    </>
  );
});

export default ProductCard;

// إضافة اسم العرض للتصحيح
ProductCard.displayName = 'ProductCard';
