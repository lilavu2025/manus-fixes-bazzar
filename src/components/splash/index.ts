// Splash Screen Components Export
export { default as NativeSplashScreen } from './NativeSplashScreen';
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
