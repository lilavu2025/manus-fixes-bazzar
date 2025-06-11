import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/utils/languageContextUtils';
import { X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import LazyImage from '@/components/LazyImage';

interface ProductImageGalleryProps {
  product: {
    name: string;
    image: string;
    images?: string[];
    discount?: number;
  };
}

const ProductImageGallery = ({ product }: ProductImageGalleryProps) => {
  const { t, isRTL } = useLanguage();
  const [selectedImage, setSelectedImage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // تحسين عرض الصور - إعطاء الأولوية للصور المتعددة ثم الصورة الرئيسية
  const images = product.images && Array.isArray(product.images) && product.images.length > 0 
    ? product.images.filter(img => img && img.trim() !== '') 
    : [product.image].filter(img => img && img.trim() !== '');

  // التنقل بين الصور
  const navigateImage = useCallback((direction: number) => {
    if (images.length <= 1) return;
    
    if (direction === -1) {
      setSelectedImage(prev => prev === 0 ? images.length - 1 : prev - 1);
    } else {
      setSelectedImage(prev => prev === images.length - 1 ? 0 : prev + 1);
    }
  }, [images.length]);

  // التنقل بين الصور باستخدام لوحة المفاتيح
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showModal) return;
      
      if (e.key === 'Escape') {
        setShowModal(false);
        setIsZoomed(false);
      } else if (e.key === 'ArrowLeft') {
        navigateImage(-1);
      } else if (e.key === 'ArrowRight') {
        navigateImage(1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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
      <div className="relative overflow-hidden rounded-xl bg-white border group cursor-zoom-in" onClick={openModal}>
        {images.length > 0 && (
          <LazyImage
            src={images[selectedImage] || product.image}
            alt={product.name}
            className="w-full h-96 object-cover transition-transform duration-300 group-hover:scale-105"
            priority={true}
          />
        )}
        
        {/* أيقونة التكبير */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        {/* شارة الخصم */}
        {product.discount && (
          <Badge variant="destructive" className="absolute top-4 right-4">
            {t('discount')} {product.discount}%
          </Badge>
        )}
        
        {/* أسهم التنقل للصور المتعددة */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-2' : 'left-2'} bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              onClick={(e) => {
                e.stopPropagation();
                navigateImage(-1);
              }}
            >
              {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-2' : 'right-2'} bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              onClick={(e) => {
                e.stopPropagation();
                navigateImage(1);
              }}
            >
              {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </>
        )}
        
        {/* مؤشر الصور */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === selectedImage ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Modal لتكبير الصورة مع ميزات متقدمة */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm" onClick={closeModal}>
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
            
            {/* أسهم التنقل في المودال */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="lg"
                  className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} z-10 bg-white/20 hover:bg-white/30 text-white`}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage(-1);
                  }}
                >
                  {isRTL ? <ChevronRight className="h-8 w-8" /> : <ChevronLeft className="h-8 w-8" />}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-4' : 'right-4'} z-10 bg-white/20 hover:bg-white/30 text-white`}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage(1);
                  }}
                >
                  {isRTL ? <ChevronLeft className="h-8 w-8" /> : <ChevronRight className="h-8 w-8" />}
                </Button>
              </>
            )}
            
            {/* الصورة المكبرة */}
            <div className="relative flex items-center justify-center max-w-full max-h-full">
              <img
                src={images[selectedImage] || product.image}
                alt={product.name}
                className={`max-w-[90vw] max-h-[80vh] object-contain rounded-lg shadow-2xl transition-transform duration-300 cursor-zoom-in ${
                  isZoomed ? 'scale-125' : 'scale-100'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsZoomed(!isZoomed);
                }}
                onError={(e) => {
                  console.error('فشل في تحميل الصورة المكبرة:', images[selectedImage]);
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            </div>
            
            {/* معلومات الصورة */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-white">
              <p className="text-lg font-medium mb-2">{product.name}</p>
              {images.length > 1 && (
                <p className="text-sm opacity-80">
                  {selectedImage + 1} من {images.length}
                </p>
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
                index === selectedImage ? 'border-primary' : 'border-gray-200'
              }`}
            >
              <img
                src={image}
                alt={`${product.name} ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Thumbnail failed to load:', image);
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
