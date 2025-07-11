import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/utils/languageContextUtils";
import { X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import LazyImage from "@/components/LazyImage";
import { Product } from '@/types';
import ProductCardBadges from "./ProductCard/ProductCardBadges";
import { useSimpleSwipe } from "@/hooks/use-touch-swipe";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProductImageGalleryProps {
  product: Product;
}

const ProductImageGallery = ({ product }: ProductImageGalleryProps) => {
  const { t, isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const [selectedImage, setSelectedImage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // تحسين عرض الصور - إعطاء الأولوية للصور المتعددة ثم الصورة الرئيسية
  const images =
    product.images && Array.isArray(product.images) && product.images.length > 0
      ? product.images.filter((img) => img && img.trim() !== "")
      : [product.image].filter((img) => img && img.trim() !== "");

  // التنقل بين الصور
  const navigateImage = useCallback(
    (direction: number) => {
      if (images.length <= 1) return;

      if (direction === -1) {
        setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      } else {
        setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      }
    },
    [images.length],
  );

  // إعداد السحب للصور
  const swipeHandlers = useSimpleSwipe(
    () => {
      // السحب لليسار = الصورة التالية (في اللغة العربية)
      if (isRTL) {
        navigateImage(1);
      } else {
        navigateImage(-1);
      }
    },
    () => {
      // السحب لليمين = الصورة السابقة (في اللغة العربية)
      if (isRTL) {
        navigateImage(-1);
      } else {
        navigateImage(1);
      }
    },
    {
      minSwipeDistance: 30,
      preventDefaultDuringSwipe: true,
    }
  );

  // التنقل بين الصور باستخدام لوحة المفاتيح
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showModal) return;

      if (e.key === "Escape") {
        setShowModal(false);
        setIsZoomed(false);
      } else if (e.key === "ArrowLeft") {
        navigateImage(-1);
      } else if (e.key === "ArrowRight") {
        navigateImage(1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showModal, selectedImage, images.length, navigateImage]);

  // فتح المودال
  const openModal = () => {
    setShowModal(true);
    setIsZoomed(false);
  };

  // إغلاق المودال
  const closeModal = () => {
    setShowModal(false);
    setIsZoomed(false);
  };

  return (
    <div className="space-y-4">
      {/* صورة المنتج الرئيسية مع إمكانية التكبير */}
      <div
        className="product-image-container responsive-product-image relative group cursor-zoom-in select-none"
        onClick={openModal}
        {...swipeHandlers}
        style={{ touchAction: 'pan-y pinch-zoom' }}
      >
        {images.length > 0 && (
          <div
            className="product-image-bg transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundImage: `url(${images[selectedImage] || product.image})` }}
          />
        )}

        {/* أيقونة التكبير */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* أسهم التنقل للصور المتعددة - مخفية على الموبايل لأن السحب متوفر */}
        {images.length > 1 && !isMobile && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-2" : "left-2"} bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              onClick={(e) => {
                e.stopPropagation();
                navigateImage(-1);
              }}
            >
              {isRTL ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-2" : "right-2"} bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              onClick={(e) => {
                e.stopPropagation();
                navigateImage(1);
              }}
            >
              {isRTL ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </>
        )}

        {/* أسهم التنقل للموبايل - تظهر دائماً */}
        {images.length > 1 && isMobile && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-2" : "left-2"} bg-white/80 hover:bg-white transition-opacity duration-300 z-10`}
              onClick={(e) => {
                e.stopPropagation();
                navigateImage(-1);
              }}
            >
              {isRTL ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-2" : "right-2"} bg-white/80 hover:bg-white transition-opacity duration-300 z-10`}
              onClick={(e) => {
                e.stopPropagation();
                navigateImage(1);
              }}
            >
              {isRTL ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </>
        )}

        {/* مؤشر الصور مع نص توجيهي على الموبايل */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <div className="flex gap-2">
              {images.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === selectedImage ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* إضافة البادجات فوق الصورة */}
        <div className="absolute top-2 left-2 z-10">
          <ProductCardBadges product={product} variant="onImage" />
        </div>
      </div>

      {/* Modal لتكبير الصورة مع ميزات متقدمة */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm select-none"
          onClick={closeModal}
          {...swipeHandlers}
          style={{ touchAction: 'pan-y pinch-zoom' }}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* زر الإغلاق */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white"
              onClick={closeModal}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* أسهم التنقل في المودال - مخفية على الموبايل */}
            {images.length > 1 && !isMobile && (
              <>
                <Button
                  variant="ghost"
                  size="lg"
                  className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-4" : "left-4"} z-10 bg-white/20 hover:bg-white/30 text-white`}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage(-1);
                  }}
                >
                  {isRTL ? (
                    <ChevronRight className="h-8 w-8" />
                  ) : (
                    <ChevronLeft className="h-8 w-8" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-4" : "right-4"} z-10 bg-white/20 hover:bg-white/30 text-white`}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage(1);
                  }}
                >
                  {isRTL ? (
                    <ChevronLeft className="h-8 w-8" />
                  ) : (
                    <ChevronRight className="h-8 w-8" />
                  )}
                </Button>
              </>
            )}

            {/* أسهم التنقل للموبايل في المودال - تظهر دائماً */}
            {images.length > 1 && isMobile && (
              <>
                <Button
                  variant="ghost"
                  size="lg"
                  className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-4" : "left-4"} z-10 bg-white/20 hover:bg-white/30 text-white`}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage(-1);
                  }}
                >
                  {isRTL ? (
                    <ChevronRight className="h-8 w-8" />
                  ) : (
                    <ChevronLeft className="h-8 w-8" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-4" : "right-4"} z-10 bg-white/20 hover:bg-white/30 text-white`}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage(1);
                  }}
                >
                  {isRTL ? (
                    <ChevronLeft className="h-8 w-8" />
                  ) : (
                    <ChevronRight className="h-8 w-8" />
                  )}
                </Button>
              </>
            )}

            {/* الصورة المكبرة */}
            <div className="relative flex items-center justify-center max-w-full max-h-full">
              <div
                className={`w-[90vw] h-[80vh] bg-center bg-contain bg-no-repeat rounded-lg shadow-2xl transition-transform duration-300 cursor-zoom-in ${
                  isZoomed ? "scale-125" : "scale-100"
                }`}
                style={{ backgroundImage: `url(${images[selectedImage] || product.image})` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsZoomed(!isZoomed);
                }}
              />
            </div>

            {/* معلومات الصورة */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-white">
              <p className="text-lg font-medium mb-2">{product.name}</p>
              {images.length > 1 && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm opacity-80">
                    {selectedImage + 1} من {images.length}
                  </p>
                  {isMobile && (
                    <p className="text-xs opacity-60 bg-black/30 px-2 py-1 rounded">
                      {t("swipeToNavigateImages")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Thumbnail images for multiple images */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors flex-shrink-0 ${
                index === selectedImage ? "border-primary" : "border-gray-200"
              }`}
            >
              <div
                className="w-full h-full bg-center bg-contain bg-no-repeat"
                style={{ backgroundImage: `url(${image})` }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
