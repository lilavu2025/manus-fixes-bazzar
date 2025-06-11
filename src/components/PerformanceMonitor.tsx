import { PerformanceMonitor } from '@/utils/performanceMonitorUtil';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

// Component for automatic performance monitoring
const PerformanceMonitorComponent: React.FC = () => {
  usePerformanceMonitor();
  return null;
};

export default PerformanceMonitorComponent;