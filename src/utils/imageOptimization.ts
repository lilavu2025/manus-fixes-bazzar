// Image optimization utilities
export const imageFormats = {
  webp: 'image/webp',
  avif: 'image/avif',
  jpeg: 'image/jpeg',
  png: 'image/png'
};

// Check if browser supports WebP
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

// Check if browser supports AVIF
export const supportsAVIF = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const avif = new Image();
    avif.onload = avif.onerror = () => {
      resolve(avif.height === 2);
    };
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
};

// Generate optimized image URL
export const getOptimizedImageUrl = (src: string, width?: number, height?: number, format?: string): string => {
  if (!src) return '/placeholder.svg';
  
  // If it's already a data URL or external URL, return as is
  if (src.startsWith('data:') || src.startsWith('http')) {
    return src;
  }
  
  // For local images, we can add query parameters for optimization
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  if (format) params.set('f', format);
  
  const queryString = params.toString();
  return queryString ? `${src}?${queryString}` : src;
};

// Generate responsive image sizes
export const generateResponsiveSizes = (breakpoints: { [key: string]: number }) => {
  return Object.entries(breakpoints)
    .map(([media, width]) => `(max-width: ${media}px) ${width}px`)
    .join(', ');
};

// Default responsive breakpoints
export const defaultBreakpoints = {
  '640': 640,   // sm
  '768': 768,   // md
  '1024': 1024, // lg
  '1280': 1280, // xl
  '1536': 1536  // 2xl
};

// Preload critical images
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Lazy load images with intersection observer
export const createImageObserver = (callback: (entries: IntersectionObserverEntry[]) => void) => {
  if (!('IntersectionObserver' in window)) {
    return null;
  }
  
  return new IntersectionObserver(callback, {
    rootMargin: '50px 0px',
    threshold: 0.01
  });
};