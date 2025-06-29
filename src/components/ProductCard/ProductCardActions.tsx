import React from "react";
import { Eye, Share2, Mail, Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/types";
import FavoriteButton from "./FavoriteButton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLanguage } from "@/utils/languageContextUtils";
import { toast } from "sonner";

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
}) => {
  const { t } = useLanguage();
  const [shareOpen, setShareOpen] = React.useState(false);

  const productUrl = `${window.location.origin}/product/${product.id}`;
  const shareText = encodeURIComponent(
    `${product.name}\n${product.description}\n${productUrl}`,
  );
  // مشاركة عبر واتساب
  const handleShareWhatsapp = () => {
    const whatsappUrl = `https://wa.me/?text=${shareText}`;
    window.open(whatsappUrl, "_blank");
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
  };

  // مشاركة عبر واجهة النظام (native share)
  const handleNativeShare = async () => {
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
  };

  return (
    <div className="absolute top-2 left-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -translate-x-4 group-hover:translate-x-0 transition-transform">
      <Button
        size="icon"
        variant="secondary"
        className="h-8 w-8 bg-white/90 hover:bg-orange-100 hover:text-orange-600 shadow-md transition-colors"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onQuickView();
        }}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <FavoriteButton
        productId={product.id}
        variant="secondary"
        className="h-8 w-8 bg-white/90 hover:bg-orange-100 hover:text-orange-600 shadow-md transition-colors"
        onClick={async (e?: React.MouseEvent) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          await onFavorite();
        }}
      />
      <Popover open={shareOpen} onOpenChange={setShareOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-white/90 hover:bg-orange-100 hover:text-orange-600 shadow-md transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShareOpen((v) => !v);
            }}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-64 max-w-xs p-2 space-y-1 z-50 bg-white border border-gray-200 rounded-lg shadow-xl animate-fade-in"
        >
          <div className="flex flex-col gap-1">
            <button
              className="flex items-center gap-2 w-full px-2 py-1 hover:bg-gray-100 rounded text-sm transition-colors"
              onClick={handleShareWhatsapp}
            >
              <MessageCircle className="h-4 w-4 text-green-600" />
              {t("shareViaWhatsapp")}
            </button>
            <button
              className="flex items-center gap-2 w-full px-2 py-1 hover:bg-gray-100 rounded text-sm transition-colors"
              onClick={handleShareEmail}
            >
              <Mail className="h-4 w-4 text-blue-600" />
              {t("shareViaEmail")}
            </button>
            <button
              className="flex items-center gap-2 w-full px-2 py-1 hover:bg-gray-100 rounded text-sm transition-colors"
              onClick={handleCopyLink}
            >
              <Copy className="h-4 w-4" />
              {t("copyLink")}
            </button>
            {navigator.share && (
              <button
                className="flex items-center gap-2 w-full px-2 py-1 hover:bg-gray-100 rounded text-sm transition-colors"
                onClick={handleNativeShare}
              >
                <Share2 className="h-4 w-4 text-gray-600" />
                {t("shareSystem")}
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ProductCardActions;
