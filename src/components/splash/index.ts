// Splash Screen Components Export
export { default as NativeSplashScreen } from './NativeSplashScreen';
export { default as ModernSplashScreen } from './ModernSplashScreen';
export { useSplashScreen } from './useSplashScreen';

// Types
export interface SplashScreenProps {
  onFinish: () => void;
  duration?: number;
}

export interface SplashScreenHookOptions {
  duration?: number;
  minDisplayTime?: number;
}
