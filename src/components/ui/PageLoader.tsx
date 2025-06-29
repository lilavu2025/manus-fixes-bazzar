import React from 'react';
import { useLanguage } from '@/utils/languageContextUtils';
import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ 
  message, 
  showProgress = false, 
  progress = 0 
}) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="relative mb-6">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
          {showProgress && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500 mt-1 block">
                {Math.round(progress)}%
              </span>
            </div>
          )}
        </div>
        
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          {message || t('loadingPage')}
        </h2>
        
        <div className="flex items-center justify-center space-x-1 rtl:space-x-reverse">
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
        </div>
        
        <p className="text-sm text-gray-500 mt-4">
          {t('pleaseWait')}...
        </p>
      </div>
    </div>
  );
};

export default PageLoader;
