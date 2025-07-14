import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Play, Pause, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Banner } from "@/types";
import LazyImage from "@/components/LazyImage";
import { useLanguage } from "@/utils/languageContextUtils";
import { useSimpleSwipe } from "@/hooks/use-touch-swipe";
import { useIsMobile } from "@/hooks/use-mobile";

interface BannerCarouselProps {
  banners: Banner[];
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState<boolean[]>(new Array(banners.length).fill(false));
  const intervalRef = useRef<number | null>(null);
  const { t, isRTL } = useLanguage();
  const isMobile = useIsMobile();

  // Auto-play logic with pause/play functionality
  useEffect(() => {
    if (isPlaying && !isHovered) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % banners.length);
      }, 6000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [banners.length, isPlaying, isHovered]);

  // Preload next image for smooth transitions
  useEffect(() => {
    const nextIndex = (currentSlide + 1) % banners.length;
    const img = new Image();
    img.src = banners[nextIndex]?.image;
  }, [currentSlide, banners]);

  const handleImageLoad = (index: number) => {
    setImageLoaded(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // إعداد السحب للبنرات
  const swipeHandlers = useSimpleSwipe(
    () => {
      // السحب لليسار = البنر التالي (في اللغة العربية)
      if (isRTL) {
        nextSlide();
      } else {
        prevSlide();
      }
    },
    () => {
      // السحب لليمين = البنر السابق (في اللغة العربية)
      if (isRTL) {
        prevSlide();
      } else {
        nextSlide();
      }
    },
    {
      minSwipeDistance: 50,
      preventDefaultDuringSwipe: false,
    }
  );

  return (
    <div 
      className="relative w-full min-h-48 sm:min-h-64 md:min-h-80 lg:min-h-96 xl:min-h-[28rem] rounded-2xl overflow-hidden group select-none shadow-2xl border border-white/10"
      {...swipeHandlers}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ touchAction: 'manipulation' }}
    >
      {/* Advanced CSS animations and effects */}
      <style>{`
        @keyframes slideInFromRight {
          0% {
            opacity: 0;
            transform: translateX(60px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        
        @keyframes slideInFromLeft {
          0% {
            opacity: 0;
            transform: translateX(-60px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(40px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          0% {
            opacity: 0;
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .animate-slide-in-right {
          animation: slideInFromRight 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        .animate-slide-in-left {
          animation: slideInFromLeft 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        .animate-fade-up {
          animation: fadeInUp 1s ease-out forwards;
          animation-delay: 0.4s;
        }

        .animate-scale-in {
          animation: scaleIn 0.6s ease-out forwards;
        }

        .shimmer-effect::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          animation: shimmer 2s infinite;
          pointer-events: none;
        }

        .loading-skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        .glass-effect {
          backdrop-filter: blur(12px);
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-modern {
          background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-modern:hover {
          background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1));
          transform: scale(1.05) translateY(-2px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        }
      `}</style>

      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            index === currentSlide 
              ? "opacity-100 z-20" 
              : "opacity-0 z-10"
          }`}
        >
          {/* Image with loading skeleton */}
          <div className="relative w-full h-full">
            {!imageLoaded[index] && (
              <div className="absolute inset-0 loading-skeleton rounded-2xl" />
            )}
            <div
              className={`w-full h-full bg-center bg-contain bg-no-repeat transition-all duration-700 ${
                imageLoaded[index] ? 'animate-scale-in' : 'opacity-0'
              }`}
              style={{ backgroundImage: `url(${banner.image})` }}
            />
            {/* Hidden image for loading detection */}
            <img
              src={banner.image}
              alt={banner.title}
              onLoad={() => handleImageLoad(index)}
              className="hidden"
            />
          </div>

          {/* Multi-layer gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Shimmer effect for premium feel */}
          <div className="absolute inset-0 shimmer-effect opacity-30" />

          {/* Content with enhanced animations */}
          <div className={`absolute inset-0 flex items-center ${isRTL ? 'justify-end' : 'justify-start'} p-4 sm:p-6 md:p-8 lg:p-12`}>
            <div className={`text-white max-w-xs sm:max-w-md lg:max-w-lg ${
              index === currentSlide 
                ? (isRTL ? 'animate-slide-in-left' : 'animate-slide-in-right')
                : 'opacity-0'
            }`}>
              <div className="glass-effect rounded-2xl p-4 sm:p-6 lg:p-8 max-w-full backdrop-blur-md border border-white/20">
                {/* Decorative elements */}
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                  <div className="h-px bg-gradient-to-r from-yellow-400 to-transparent flex-1" />
                </div>

                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 leading-tight bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                  {banner.title}
                </h2>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl opacity-90 mb-4 sm:mb-6 leading-relaxed">
                  {banner.subtitle}
                </p>
                
                {/* Enhanced CTA button */}
                <div className="flex items-center gap-3">
                  {banner.link ? (
                    <a
                      href={banner.link}
                      target={banner.link.startsWith("http") ? "_blank" : undefined}
                      rel={banner.link.startsWith("http") ? "noopener" : undefined}
                    >
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary text-white font-semibold px-6 sm:px-8 md:px-10 text-sm sm:text-base md:text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
                      >
                        <Zap className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                        {t("shopNow")}
                      </Button>
                    </a>
                  ) : (
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold px-6 sm:px-8 md:px-10 text-sm sm:text-base md:text-lg rounded-xl opacity-60"
                      disabled
                    >
                      {t("shopNow")}
                    </Button>
                  )}
                </div>

                {/* Bottom decorative line */}
                <div className="flex items-center gap-2 mt-4">
                  <div className="h-px bg-gradient-to-r from-transparent to-white/30 flex-1" />
                  <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Modern navigation buttons for desktop */}
      {!isMobile && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={prevSlide}
            className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 btn-modern text-white opacity-0 group-hover:opacity-100 transition-all duration-300 h-10 w-10 sm:h-12 sm:w-12 z-30`}
          >
            {isRTL ? (
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={nextSlide}
            className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 transform -translate-y-1/2 btn-modern text-white opacity-0 group-hover:opacity-100 transition-all duration-300 h-10 w-10 sm:h-12 sm:w-12 z-30`}
          >
            {isRTL ? (
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </Button>
        </>
      )}

      {/* Enhanced mobile navigation */}
      {isMobile && banners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={prevSlide}
            className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 btn-modern text-white h-9 w-9 z-30 opacity-80`}
          >
            {isRTL ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={nextSlide}
            className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 btn-modern text-white h-9 w-9 z-30 opacity-80`}
          >
            {isRTL ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </>
      )}

      {/* Play/Pause control */}
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlayPause}
        className="absolute top-4 right-4 btn-modern text-white opacity-0 group-hover:opacity-100 transition-all duration-300 h-8 w-8 z-30"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      {/* Enhanced indicators with progress bars */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-3 z-30">
        <div className="flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`relative h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 bg-white shadow-lg"
                  : "w-3 bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Slide ${index + 1}`}
            >
              {index === currentSlide && isPlaying && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/60 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>
        
        {/* Slide counter */}
        <div className="glass-effect px-3 py-1 rounded-full text-white text-xs font-medium">
          {currentSlide + 1} / {banners.length}
        </div>
      </div>
    </div>
  );
};

export default BannerCarousel;
