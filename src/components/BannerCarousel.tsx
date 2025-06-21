import * as React from "react";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Banner } from "@/types";
import LazyImage from "@/components/LazyImage";

interface BannerCarouselProps {
  banners: Banner[];
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

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
    <div className="relative w-full h-64 md:h-80 lg:h-96 rounded-xl overflow-hidden group">
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

          <div className="absolute inset-0 flex items-center justify-start p-8">
            <div className="text-white max-w-md animate-fade-in">
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                {banner.title}
              </h2>
              <p className="text-lg md:text-xl opacity-90 mb-6">
                {banner.subtitle}
              </p>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-semibold px-8"
              >
                اكتشف المزيد
              </Button>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation buttons */}
      <Button
        variant="ghost"
        size="icon"
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight className="h-6 w-6" />
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
          />
        ))}
      </div>
    </div>
  );
};

export default BannerCarousel;
