// دوال preloader المنفصلة عن المكون
import { useState, useEffect } from 'react';

export const useImagePreloader = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  return isLoaded;
};
