import React from 'react';
import { useLanguage } from '@/utils/languageContextUtils';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message, 
  size = 'md', 
  fullScreen = false 
}) => {
  const { t } = useLanguage();
  
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const content = (
    <div className="text-center">
      <div className={`animate-spin rounded-full border-b-2 border-primary mx-auto mb-4 ${sizeClasses[size]}`}></div>
      <p className="text-gray-600 animate-pulse">
        {message || t('loading')}...
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
