// مكون كرت المنتج - يعرض معلومات المنتج مع إمكانيات التفاعل
import * as React from "react";
import { useState, memo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Product } from "@/types/product";
import { useCart } from "@/hooks/useCart";
// import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from "@/contexts/useAuth";
import { useLanguage } from "@/utils/languageContextUtils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ProductCardImage from "./ProductCard/ProductCardImage";
import ProductCardContent from "./ProductCard/ProductCardContent";
import ProductCardQuickView from "./ProductCard/ProductCardQuickView";
import ProductCardActions from "./ProductCard/ProductCardActions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Mail, Share2, Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// خصائص مكون كرت المنتج
interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

// مكون كرت المنتج مع تحسين الأداء باستخدام memo
const ProductCard: React.FC<ProductCardProps> = memo(
  ({ product, onQuickView }) => {
    // استخدام الخطافات للوصول للوظائف المختلفة
    const { addItem, getItemQuantity } = useCart();
    // const { toggleFavorite, isFavorites } = useFavorites();
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    // حالات المكون المحلية
    const [quantity, setQuantity] = useState(1);
    const [showQuickView, setShowQuickView] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);

    // الحصول على كمية المنتج في السلة
    const cartQuantity = getItemQuantity(product.id);

    // وظيفة إضافة المنتج إلى السلة مع تحديث فوري للواجهة
    const handleAddToCart = useCallback(async () => {
      if (isLoading) return;

      try {
        setIsLoading(true);
        await addItem(product, quantity);
        toast.success(t("addedToCart"));
      } catch (error) {
        console.error(
          t("errorAddingToCartLog") || "خطأ في إضافة المنتج للسلة:",
          error,
        );
        toast.error(t("errorAddingToCart"));
      } finally {
        setIsLoading(false);
      }
    }, [addItem, product, quantity, isLoading, t]);



    // وظيفة فتح العرض السريع للمنتج
    const handleQuickView = useCallback(() => {
      if (onQuickView) {
        onQuickView(product);
      } else {
        setShowQuickView(true);
      }
    }, [onQuickView, product]);

    // وظيفة إضافة/إزالة المنتج من المفضلة
    // const handleFavorite = useCallback(async () => {
    //   if (!user) {
    //     toast.error(t('pleaseLogin'));
    //     return;
    //   }
    //   try {
    //     const wasInFavorites = isFavorite(product.id);
    //     await toggleFavorite(product.id);
    //     toast.success(wasInFavorites ? t('removedFromFavorites') : t('addedToFavorites'));
    //   } catch (error) {
    //     console.error(t('errorUpdatingFavoritesLog') || 'خطأ في تحديث المفضلة:', error);
    //     toast.error(t('errorUpdatingFavorites'));
    //   }
    // }, [user, toggleFavorite, product.id, t, isFavorite]);

    // مشاركة عبر واتساب
    const handleShareWhatsapp = useCallback(
      (e?: React.MouseEvent) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const productUrl = `${window.location.origin}/product/${product.id}`;
        const shareText = encodeURIComponent(
          `${product.name}\n${product.description}\n${productUrl}`,
        );
        const whatsappUrl = `https://wa.me/?text=${shareText}`;
        window.open(whatsappUrl, "_blank");
        setShareOpen(false);
      },
      [product],
    );

    // مشاركة عبر الإيميل
    const handleShareEmail = useCallback(
      (e?: React.MouseEvent) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const productUrl = `${window.location.origin}/product/${product.id}`;
        const subject = encodeURIComponent(product.name);
        const body = encodeURIComponent(
          `${product.description}\n${productUrl}`,
        );
        window.open(`mailto:?subject=${subject}&body=${body}`);
        setShareOpen(false);
      },
      [product],
    );

    // نسخ الرابط
    const handleCopyLink = useCallback(
      async (e?: React.MouseEvent) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const productUrl = `${window.location.origin}/product/${product.id}`;
        try {
          if (
            navigator.clipboard &&
            typeof navigator.clipboard.writeText === "function"
          ) {
            await navigator.clipboard.writeText(productUrl);
            toast.success(t("linkCopied"));
          } else {
            // fallback
            const tempInput = document.createElement("input");
            tempInput.value = productUrl;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand("copy");
            document.body.removeChild(tempInput);
            toast.success(t("linkCopied"));
          }
        } catch {
          toast.error(t("shareError"));
        }
        setShareOpen(false);
      },
      [product, t],
    );

    // مشاركة عبر واجهة النظام (native share)
    const handleNativeShare = useCallback(
      async (e?: React.MouseEvent) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const productUrl = `${window.location.origin}/product/${product.id}`;
        if (navigator.share) {
          try {
            await navigator.share({
              title: product.name,
              text: product.description,
              url: productUrl,
            });
            toast.success(t("sharedSuccessfully"));
          } catch {
            // تجاهل إغلاق المستخدم
          }
        } else {
          toast.error(t("shareError"));
        }
        setShareOpen(false);
      },
      [product, t],
    );

    // وظيفة التنقل إلى صفحة تفاصيل المنتج
    const handleCardClick = useCallback(() => {
      navigate(`/product/${product.id}`);
    }, [navigate, product.id]);

    // التحقق من حالة المفضلة
    //const isFav = isFavorite(product.id);
    const isFav = false; // isFavorite(product.id);

    return (
      <div className="w-full flex justify-center">
        {/* كرت المنتج الرئيسي مع تأثيرات التفاعل */}
        <Card
          className="product-card group relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-offset-2 cursor-pointer mx-auto w-full min-w-[280px] max-w-sm h-full flex flex-col"
          onClick={handleCardClick}
        >
          {/* أزرار التفاعل على أقصى يسار الكرت */}
          <div className="absolute top-2 left-2 z-20 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -translate-x-4 group-hover:translate-x-0 transition-transform">
            <ProductCardActions
              product={product}
              onQuickView={handleQuickView}
              //onFavorite={handleFavorite}
              onFavorite={null}
              onShare={async () => {
                setShareOpen((v) => !v);
              }}
            />
            <Popover open={shareOpen} onOpenChange={setShareOpen}>
              <PopoverTrigger asChild>
                {/* زر المشاركة بالمنتج */}
                {/* <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 bg-white/90 hover:bg-orange-100 hover:text-orange-600 shadow-md transition-colors"
                onClick={e => { e.preventDefault(); e.stopPropagation(); setShareOpen((v) => !v); }}
              >
                <Share2 className="h-4 w-4" />
              </Button> */}
              </PopoverTrigger>
              <PopoverContent align="end" className="w-44 p-2 space-y-1 z-50">
                <button
                  className="flex items-center gap-2 w-full px-2 py-1 hover:bg-gray-100 rounded text-sm"
                  onClick={handleShareWhatsapp}
                >
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  {t("shareViaWhatsapp")}
                </button>
                <button
                  className="flex items-center gap-2 w-full px-2 py-1 hover:bg-gray-100 rounded text-sm"
                  onClick={handleShareEmail}
                >
                  <Mail className="h-4 w-4 text-blue-600" />
                  {t("shareViaEmail")}
                </button>
                <button
                  className="flex items-center gap-2 w-full px-2 py-1 hover:bg-gray-100 rounded text-sm"
                  onClick={handleCopyLink}
                >
                  <Copy className="h-4 w-4" />
                  {t("copyLink")}
                </button>
                {navigator.share && (
                  <button
                    className="flex items-center gap-2 w-full px-2 py-1 hover:bg-gray-100 rounded text-sm"
                    onClick={handleNativeShare}
                  >
                    <Share2 className="h-4 w-4 text-gray-600" />
                    {t("shareSystem")}
                  </button>
                )}
              </PopoverContent>
            </Popover>
          </div>
          {/* صورة المنتج */}
          <ProductCardImage
            product={product}
            isFavorite={isFav}
            onQuickView={handleQuickView}
            //onFavorite={handleFavorite}
            onFavorite={null}
            onShare={async () => {
              setShareOpen((v) => !v);
            }}
            isLoading={isLoading}
          />

          {/* محتوى المنتج مع الأزرار */}
          <ProductCardContent
            product={product}
            quantity={quantity}
            cartQuantity={cartQuantity}
            onQuantityChange={setQuantity}
            onAddToCart={handleAddToCart}
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
          //onFavorite={handleFavorite}
          onFavorite={null}
          onShare={async () => {
            setShareOpen((v) => !v);
          }}
        />
      </div>
    );
  },
);

export default ProductCard;

// إضافة اسم العرض للتصحيح
ProductCard.displayName = "ProductCard";
