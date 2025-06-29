/**
 * Enhanced Performance Monitor
 * Tracks and reports various performance metrics
 */

interface PerformanceMetrics {
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
  timeToInteractive?: number;
  totalBlockingTime?: number;
  memoryUsage?: number;
  navigationTiming?: PerformanceNavigationTiming;
}

export class EnhancedPerformanceMonitor {
  private static instance: EnhancedPerformanceMonitor;
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];

  private constructor() {
    this.init();
  }

  static getInstance(): EnhancedPerformanceMonitor {
    if (!EnhancedPerformanceMonitor.instance) {
      EnhancedPerformanceMonitor.instance = new EnhancedPerformanceMonitor();
    }
    return EnhancedPerformanceMonitor.instance;
  }

  init() {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return;
    }

    this.observeWebVitals();
    this.observeNavigationTiming();
    this.observeMemoryUsage();
  }

  private observeWebVitals() {
    try {
      // Observe First Contentful Paint
      if ('PerformanceObserver' in window) {
        const fcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.firstContentfulPaint = entry.startTime;
            }
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(fcpObserver);

        // Observe Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.largestContentfulPaint = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // Observe First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const firstInputEntry = entry as any;
            if (firstInputEntry.processingStart && firstInputEntry.processingStart > firstInputEntry.startTime) {
              this.metrics.firstInputDelay = firstInputEntry.processingStart - firstInputEntry.startTime;
            }
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

        // Observe Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          this.metrics.cumulativeLayoutShift = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      }
    } catch (error) {
      console.warn('Error setting up Web Vitals observers:', error);
    }
  }

  private observeNavigationTiming() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.metrics.navigationTiming = navigation;
          this.metrics.timeToInteractive = navigation.domInteractive - navigation.fetchStart;
        }
      }, 0);
    }
  }

  private observeMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize;
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getPerformanceScore(): number {
    const { firstContentfulPaint, largestContentfulPaint, firstInputDelay, cumulativeLayoutShift } = this.metrics;
    
    let score = 100;
    
    // Deduct points based on Web Vitals thresholds
    if (firstContentfulPaint && firstContentfulPaint > 3000) score -= 20;
    if (largestContentfulPaint && largestContentfulPaint > 4000) score -= 25;
    if (firstInputDelay && firstInputDelay > 300) score -= 30;
    if (cumulativeLayoutShift && cumulativeLayoutShift > 0.25) score -= 25;
    
    return Math.max(0, score);
  }

  generateReport(): string {
    const metrics = this.getMetrics();
    const score = this.getPerformanceScore();
    
    return JSON.stringify({
      score,
      metrics,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    }, null, 2);
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

export default EnhancedPerformanceMonitor;
