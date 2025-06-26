export class PerformanceMonitor {
  static getInstance(): PerformanceMonitor {
    return new PerformanceMonitor();
  }
  init() {}
  cleanup() {}
  getMetrics() { return {}; }
  logMetrics() {}
}
