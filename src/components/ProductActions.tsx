import * as React from "react";
import { useState } from 'react';
import { Mail, Share2, ShoppingCart, Copy, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { isRTL, useLanguage } from '@/utils/languageContextUtils';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { Product } from '@/types';
import QuantitySelector from '@/components/QuantitySelector';
import FavoriteButton from '@/components/ProductCard/FavoriteButton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ProductActionsProps {
  product: Product;
  onBuyNow: () => void;
}

const ProductActions = ({ product, onBuyNow }: ProductActionsProps) => {
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const { addToCart, getItemQuantity } = useCart();
  const [shareOpen, setShareOpen] = useState(false);

  const cartQuantity = getItemQuantity(product.id);

  const handleAddToCart = async () => {
    console.log('Add to cart clicked with quantity:', quantity);
    if (!product.inStock) {
      toast.error(t('productOutOfStock'));
      return;
    }
    
    try {
      await addToCart(product, quantity);
      console.log('Product added to cart successfully');
      setQuantity(1);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(t('errorAddingToCart'));
    }
  };

  const productUrl = `${window.location.origin}/product/${product.id}`;
  const shareText = encodeURIComponent(`${product.name}\n${product.description}\n${productUrl}`);

  // مشاركة عبر واتساب
  const handleShareWhatsapp = () => {
    const whatsappUrl = `https://wa.me/?text=${shareText}`;
    window.open(whatsappUrl, '_blank');
    setShareOpen(false);
  };

  // مشاركة عبر الإيميل
  const handleShareEmail = () => {
    const subject = encodeURIComponent(product.name);
    const body = encodeURIComponent(`${product.description}\n${productUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    setShareOpen(false);
  };

  // نسخ الرابط
  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(productUrl);
        toast.success(t('linkCopied') || 'تم نسخ الرابط');
      } else {
        // fallback
        const tempInput = document.createElement('input');
        tempInput.value = productUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        toast.success(t('linkCopied') || 'تم نسخ الرابط');
      }
    } catch {
      toast.error(t('shareError') || 'حدث خطأ في النسخ');
    }
    setShareOpen(false);
  };

  // مشاركة عبر واجهة النظام (native share)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: productUrl
        });
        toast.success(t('sharedSuccessfully') || 'تمت المشاركة بنجاح');
      } catch {
        // تجاهل إغلاق المستخدم
      }
    } else {
      toast.error(t('shareError') || 'المشاركة غير مدعومة على هذا المتصفح');
    }
    setShareOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Quantity & Add to Cart */}
      {product.inStock && (
        <div className="space-y-4">
          <div className={`flex items-center gap-12 w-full ${isRTL ? 'flex-row-reverse justify-end' : 'justify-start'}`}>
            <QuantitySelector
              quantity={quantity}
              onQuantityChange={setQuantity}
              max={99}
              min={1}
            />
            <label className="block text-sm font-semibold mb-2">{t('quantity')}</label>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleAddToCart}
              className="flex-1 gap-2"
              size="lg"
              disabled={!product.inStock}
            >
              <ShoppingCart className="h-5 w-5" />
              {t('addToCart')}
              {cartQuantity > 0 && (
                <Badge variant="secondary" className="mr-2">
                  {cartQuantity}
                </Badge>
              )}
            </Button>
            
            <Button
              onClick={onBuyNow}
              variant="secondary"
              size="lg"
              className="flex-1"
              disabled={!product.inStock}
            >
              {t('buyNow')}
            </Button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <FavoriteButton
          productId={product.id}
          variant="outline"
          size="default"
          className="flex-1"
        />
        <Popover open={shareOpen} onOpenChange={setShareOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="flex-1">
              <Share2 className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-44 p-2 space-y-1">
            <button className="flex items-center gap-2 w-full px-2 py-1 hover:bg-gray-100 rounded text-sm" onClick={handleShareWhatsapp}>
              <MessageCircle className="h-4 w-4 text-green-600" />
              {t('shareViaWhatsapp') || 'واتساب'}
            </button>
            <button className="flex items-center gap-2 w-full px-2 py-1 hover:bg-gray-100 rounded text-sm" onClick={handleShareEmail}>
              <Mail className="h-4 w-4 text-blue-600" />
              {t('shareViaEmail') || 'إيميل'}
            </button>
            <button className="flex items-center gap-2 w-full px-2 py-1 hover:bg-gray-100 rounded text-sm" onClick={handleCopyLink}>
              <Copy className="h-4 w-4" />
              {t('copyLink') || 'نسخ الرابط'}
            </button>
            {navigator.share && (
              <button className="flex items-center gap-2 w-full px-2 py-1 hover:bg-gray-100 rounded text-sm" onClick={handleNativeShare}>
                <Share2 className="h-4 w-4 text-gray-600" />
                {t('shareSystem') || 'مشاركة النظام'}
              </button>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default ProductActions;
