/**
 * Application Performance Optimization Utilities
 */

import { logger } from './logger';

// Debounce function for search and input optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

// Throttle function for scroll and resize events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Lazy loading observer for images and components
export function createLazyObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver(callback, defaultOptions);
}

// Memory optimization utilities
export class MemoryOptimizer {
  private static timers: Set<number> = new Set();
  private static intervals: Set<number> = new Set();
  private static observers: Set<IntersectionObserver | MutationObserver | PerformanceObserver> = new Set();

  static setTimeout(callback: () => void, delay: number): number {
    const timer = window.setTimeout(() => {
      callback();
      this.timers.delete(timer);
    }, delay);
    
    this.timers.add(timer);
    return timer;
  }

  static setInterval(callback: () => void, delay: number): number {
    const interval = window.setInterval(callback, delay);
    this.intervals.add(interval);
    return interval;
  }

  static clearTimeout(timer: number): void {
    clearTimeout(timer);
    this.timers.delete(timer);
  }

  static clearInterval(interval: number): void {
    clearInterval(interval);
    this.intervals.delete(interval);
  }

  static addObserver(observer: IntersectionObserver | MutationObserver | PerformanceObserver): void {
    this.observers.add(observer);
  }

  static cleanup(): void {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();

    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();

    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Bundle splitting utilities
export const loadChunk = async (chunkName: string): Promise<any> => {
  try {
    switch (chunkName) {
      case 'admin':
        return await import('../pages/AdminDashboard');
      case 'charts':
        return await import('recharts');
      case 'forms':
        return await import('react-hook-form');
      default:
        throw new Error(`Unknown chunk: ${chunkName}`);
    }
  } catch (error) {
    console.error(`Failed to load chunk ${chunkName}:`, error);
    throw error;
  }
};

// Performance monitoring helpers
export const measurePerformance = (name: string, fn: () => void): void => {
  if ('performance' in window && 'mark' in performance) {
    performance.mark(`${name}-start`);
    fn();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  } else {
    fn();
  }
};

// Network optimization
export class NetworkOptimizer {
  private static cache = new Map<string, any>();
  private static pendingRequests = new Map<string, Promise<any>>();

  static async fetchWithCache<T>(
    url: string, 
    options: RequestInit = {},
    cacheTime = 5 * 60 * 1000 // 5 minutes default
  ): Promise<T> {
    const cacheKey = `${url}-${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      return cached.data;
    }

    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // Make new request
    const requestPromise = fetch(url, options)
      .then(response => response.json())
      .then(data => {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
        this.pendingRequests.delete(cacheKey);
        return data;
      })
      .catch(error => {
        this.pendingRequests.delete(cacheKey);
        throw error;
      });

    this.pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  static clearCache(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

// Connection quality detection
export class ConnectionMonitor {
  private static connection: any = null;

  static init(): void {
    if ('connection' in navigator) {
      this.connection = (navigator as any).connection;
    }
  }

  static getConnectionType(): string {
    if (!this.connection) return 'unknown';
    return this.connection.effectiveType || 'unknown';
  }

  static isSlowConnection(): boolean {
    if (!this.connection) return false;
    return this.connection.effectiveType === 'slow-2g' || 
           this.connection.effectiveType === '2g';
  }

  static getDownlinkSpeed(): number {
    if (!this.connection) return 0;
    return this.connection.downlink || 0;
  }
}

// Image optimization utilities
export const getOptimizedImageUrl = (
  src: string,
  width?: number,
  height?: number,
  quality = 85,
  format = 'webp'
): string => {
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }

  // For external URLs, return as is
  if (src.startsWith('http')) {
    return src;
  }

  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', quality.toString());
  params.set('f', format);

  const queryString = params.toString();
  return queryString ? `${src}?${queryString}` : src;
};

// Bundle analyzer helper
export const analyzeBundleSize = (): void => {
  if (process.env.NODE_ENV === 'development') {
    logger.log('Bundle analysis is only available in production builds');
    return;
  }

  import('rollup-plugin-visualizer').then(({ visualizer }) => {
    logger.log('Bundle analysis complete');
  }).catch(error => {
    logger.warn('Bundle analyzer not available:', error);
  });
};

export default {
  debounce,
  throttle,
  createLazyObserver,
  MemoryOptimizer,
  loadChunk,
  measurePerformance,
  NetworkOptimizer,
  ConnectionMonitor,
  getOptimizedImageUrl,
  analyzeBundleSize,
};
