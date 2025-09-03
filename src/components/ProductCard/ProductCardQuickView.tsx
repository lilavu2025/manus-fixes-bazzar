import React, { useState } from "react";
import { Star, ShoppingCart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/utils/languageContextUtils";
import { useAuth } from "@/contexts/useAuth";
import { Product } from "@/types";
import QuantitySelector from "@/components/QuantitySelector";
import FavoriteButton from "@/components/ProductCard/FavoriteButton";
import ProductInfo from "../ProductInfo";
import { ProductVariantMiniSelector } from "@/components/ProductVariantMiniSelector";
import { useProductVariants } from "@/hooks/useProductVariants";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Mail, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { getDisplayPrice } from "@/utils/priceUtils";

export interface ProductCardQuickViewProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  quantity: number;
  cartQuantity: number;
  isFavorite: boolean;
  onQuantityChange: React.Dispatch<React.SetStateAction<number>>;
  onAddToCart: (variantData?: { variantId?: string; selectedVariant?: Record<string, string> }) => Promise<void>;
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
  onFavorite,
  onShare,
}) => {
  const { t, isRTL } = useLanguage();
  const { profile } = useAuth();
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>();
  const [selectedVariantAttrs, setSelectedVariantAttrs] = useState<Record<string, string> | undefined>();
  const [selectedVariantObj, setSelectedVariantObj] = useState<{ price: number; wholesale_price?: number | null; image?: string } | null>(null);
  
  // Variants hooks
  const variantHook = useProductVariants({
    productId: product.id,
    options: [],
    variants: [],
    defaultPrice: product.price,
    defaultWholesalePrice: product.wholesalePrice || 0,
    defaultImage: product.image
  });
  
  // إعادة تعيين الصورة المحددة عند فتح النافذة
  React.useEffect(() => {
    if (isOpen) {
      setSelectedImageIndex(0);
    }
  }, [isOpen]);
  
  // تحسين عرض الصور - إعطاء الأولوية للصور المتعددة ثم الصورة الرئيسية
  const images = React.useMemo(() => {
    const base = (product.images && Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image]
    ).filter((img) => img && img.trim() !== "");
    const vimg = (selectedVariantObj as any)?.image || undefined;
    if (vimg && vimg.trim() !== "") {
      return [vimg, ...base.filter((b) => b !== vimg)];
    }
    return base;
  }, [product.images, product.image, selectedVariantObj]);
      
  const productUrl = `${window.location.origin}/product/${product.id}`;
  const shareText = encodeURIComponent(
    `${product.name}\n${product.description}\n${productUrl}`,
  );

  const handleShareWhatsapp = () => {
    const whatsappUrl = `https://wa.me/?text=${shareText}`;
    window.open(whatsappUrl, "_blank");
    setShareOpen(false);
  };
  const handleShareEmail = () => {
    const subject = encodeURIComponent(product.name);
    const body = encodeURIComponent(`${product.description}\n${productUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    setShareOpen(false);
  };
  const handleCopyLink = async () => {
    try {
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(productUrl);
        toast.success(t("linkCopied"));
      } else {
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
  };
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: productUrl,
        });
        toast.success(t("sharedSuccessfully"));
      } catch (err) {
        // المستخدم أغلق نافذة المشاركة أو حدث خطأ آخر
        // يمكن تجاهل الخطأ أو تسجيله إذا رغبت
      }
    } else {
      toast.error(t("shareError"));
    }
    setShareOpen(false);
  };

  const displayPrice = getDisplayPrice(
    product as import("@/types/product").Product,
    profile?.user_type,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader> */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* الصورة الرئيسية */}
            <div className="product-image-container responsive-product-image relative">
              <div
                className="product-image-bg"
                style={{ backgroundImage: `url(${images[selectedImageIndex] || product.image})` }}
              />
            </div>
            
            {/* الصور المصغرة */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-gray-300">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? "thumbnail-active border-primary"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className="thumbnail-image w-full h-full"
                      style={{ backgroundImage: `url(${image})` }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="w-full">
              <ProductInfo
                product={{
                  ...product,
                  price: displayPrice,
                  nameHe: (product as { nameHe?: string }).nameHe || "",
                  descriptionHe:
                    (product as { descriptionHe?: string }).descriptionHe || "",
                }}
                selectedVariant={selectedVariantObj}
              />
            </div>

            {/* عرض الفيرنتس إن وجدت */}
            <div className="border-t pt-4">
              <ProductVariantMiniSelector
                productId={product.id}
                compact={false}
                className="space-y-3"
                showSelectedInfo={false}
                disabled={!product.inStock}
        onVariantChange={(variant: any) => {
                  if (variant) {
                    setSelectedVariantId(variant.id);
                    setSelectedVariantAttrs(variant.option_values || undefined);
          setSelectedVariantObj({ price: variant.price, wholesale_price: variant.wholesale_price, image: (variant as any).image });
          setSelectedImageIndex(0);
                  } else {
                    setSelectedVariantId(undefined);
                    setSelectedVariantAttrs(undefined);
          setSelectedVariantObj(null);
          setSelectedImageIndex(0);
                  }
                }}
              />
            </div>

            <div
              className={`flex items-center gap-12 w-full ${isRTL ? "flex-row-reverse justify-end" : "justify-start"}`}
            >
              <QuantitySelector
                quantity={quantity}
                onQuantityChange={(newQuantity) => {
                  if (newQuantity > product.stock_quantity) {
                    toast.error(t("exceededStockQuantity"));
                  } else {
                    onQuantityChange(newQuantity);
                  }
                }}
                max={product.stock_quantity}
                min={1}
                disabled={!product.inStock}
              />
              <span className="text-sm sm:text-base text-gray-600 whitespace-nowrap">
                {t("quantity")}:
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const totalQuantityInCart = cartQuantity + quantity;
                  if (totalQuantityInCart > product.stock_quantity) {
                    setTimeout(() => toast.error(t("exceededStockQuantity")), 0);
                  } else {
                    const variantData = (product as any).has_variants && selectedVariantId
                      ? { variantId: selectedVariantId, selectedVariant: selectedVariantAttrs || {} }
                      : undefined;
                    onAddToCart(variantData);
                  }
                }}
                disabled={!product.inStock}
                className="flex-1 gap-2"
                variant={cartQuantity > 0 ? "secondary" : "default"}
              >
                <ShoppingCart className="h-4 w-4" />
                {cartQuantity > 0
                  ? `${t("inCart")} (${cartQuantity})`
                  : t("addToCart")}
              </Button>
            </div>

            <div className="flex gap-2">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductCardQuickView;
