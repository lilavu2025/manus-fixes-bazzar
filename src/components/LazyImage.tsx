import * as React from "react";
import { useState, useEffect, useRef, memo } from 'react';
import { cn } from '@/lib/utils';

// Enhanced image formats support
const imageFormats = {
  webp: 'image/webp',
  avif: 'image/avif',
  jpg: 'image/jpeg',
  png: 'image/png'
};

// Check browser support for modern image formats
const checkFormatSupport = async (format: string): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  return new Promise((resolve) => {
    const testImages = {
      webp: 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
      avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAABAA0ABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=',
    };
    
    const img = new Image();
    img.onload = () => resolve(img.width > 0 && img.height > 0);
    img.onerror = () => resolve(false);
    img.src = testImages[format as keyof typeof testImages] || '';
  });
};

// Get optimized image URL with format selection
const getOptimizedImageUrl = (src: string, width?: number, height?: number, format = 'webp'): string => {
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) return src;
  
  // For external URLs, return as is
  if (src.startsWith('http')) return src;
  
  // Add query parameters for optimization
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  if (format) params.set('f', format);
  params.set('q', '85'); // Quality
  
  const queryString = params.toString();
  return queryString ? `${src}?${queryString}` : src;
};

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderSrc?: string;
  blurDataURL?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  fallback?: string;
  sizes?: string;
  srcSet?: string;
  quality?: number;
}

const LazyImage = memo(function LazyImage({
  src,
  alt,
  className,
  placeholderSrc = '/placeholder.svg',
  blurDataURL,
  width,
  height,
  priority = false,
  onLoad,
  onError,
  fallback = '/placeholder.svg',
  sizes,
  srcSet,
  quality = 85,
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState(placeholderSrc);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [optimalFormat, setOptimalFormat] = useState<string>('jpg');
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Check browser support for modern formats
  useEffect(() => {
    const checkSupport = async () => {
      const webpSupport = await checkFormatSupport('webp');
      const avifSupport = await checkFormatSupport('avif');
      
      if (avifSupport) {
        setOptimalFormat('avif');
      } else if (webpSupport) {
        setOptimalFormat('webp');
      } else {
        setOptimalFormat('jpg');
      }
    };
    
    checkSupport();
  }, []);

  useEffect(() => {
    if (!imgRef.current || priority || isInView) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, isInView]);

  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      setIsError(false);
      onLoad?.();
    };
    
    img.onerror = () => {
      setImageSrc(fallback || placeholderSrc);
      setIsError(true);
      onError?.();
    };
  }, [isInView, src, placeholderSrc, fallback, onLoad, onError]);

  // Generate responsive srcSet if not provided
  const generateSrcSet = (baseSrc: string) => {
    if (srcSet) return srcSet;
    
    const baseUrl = baseSrc.split('?')[0];
    const params = baseSrc.includes('?') ? '?' + baseSrc.split('?')[1] : '';
    
    return [
      `${baseUrl}?w=400${params} 400w`,
      `${baseUrl}?w=800${params} 800w`,
      `${baseUrl}?w=1200${params} 1200w`,
    ].join(', ');
  };

  // Generate sizes attribute if not provided
  const generateSizes = () => {
    if (sizes) return sizes;
    return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
  };

  return (
    <div 
      className={cn('relative overflow-hidden bg-muted', className)}
      style={{ width, height }}
    >
      {/* Blur placeholder */}
      {blurDataURL && !isLoaded && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
          aria-hidden="true"
        />
      )}
      
      {/* Loading placeholder */}
      {!isLoaded && !blurDataURL && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {/* Main image */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        srcSet={!isError && src !== placeholderSrc ? generateSrcSet(src) : undefined}
        sizes={generateSizes()}
        width={width}
        height={height}
        {...(priority ? { fetchpriority: 'high' } : {})}
      />
      
      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs">Image not available</p>
          </div>
        </div>
      )}
    </div>
  );
});

export default LazyImage;