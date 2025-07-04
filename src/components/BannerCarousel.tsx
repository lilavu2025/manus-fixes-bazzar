import * as React from "react";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Banner } from "@/types";
import LazyImage from "@/components/LazyImage";
import { useLanguage } from "@/utils/languageContextUtils";

interface BannerCarouselProps {
  banners: Banner[];
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <div className="relative w-full h-48 sm:h-64 md:h-80 lg:h-96 rounded-xl overflow-hidden group">
      {/* تعريف الانيميشن داخل JSX */}
      <style>{`
        @keyframes fadeInSlideUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeInSlideUp 1s ease forwards;
          animation-delay: 0.3s;
        }
      `}</style>

      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <LazyImage
            src={banner.image}
            alt={banner.title}
            className="w-full h-full object-cover"
            priority={index === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

          <div className="absolute inset-0 flex items-center justify-start p-4 sm:p-6 md:p-8">
            <div className="text-white max-w-xs sm:max-w-md animate-fade-in">
              <div className="bg-black/30 sm:bg-black/70 rounded-lg p-1 sm:p-4 max-w-full">
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-4xl font-bold mb-2 sm:mb-4">
                  {banner.title}
                </h2>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl opacity-90 mb-3 sm:mb-6">
                  {banner.subtitle}
                </p>
                {banner.link ? (
                  <a
                    href={banner.link}
                    target={banner.link.startsWith("http") ? "_blank" : undefined}
                    rel={banner.link.startsWith("http") ? "noopener" : undefined}
                  >
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-white font-semibold px-2 sm:px-6 md:px-8 text-xs sm:text-sm md:text-base"
                    >
                      {t("shopNow")}
                    </Button>
                  </a>
                ) : (
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white font-semibold px-2 sm:px-6 md:px-8 text-xs sm:text-sm md:text-base"
                    disabled
                  >
                    {t("shopNow")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation buttons */}
      <Button
        variant="ghost"
        size="icon"
        onClick={prevSlide}
        className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 sm:h-10 sm:w-10"
      >
        <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={nextSlide}
        className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 sm:h-10 sm:w-10"
      >
        <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
      </Button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide
                ? "bg-white"
                : "bg-white/50 hover:bg-white/70"
            }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerCarousel;
