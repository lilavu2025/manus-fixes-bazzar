import React from 'react';
import { useLanguage } from '@/utils/languageContextUtils';

interface UserErrorDisplayProps {
  error: Error | unknown;
}

const UserErrorDisplay: React.FC<UserErrorDisplayProps> = ({ error }) => {
  const { t } = useLanguage();
  return (
    <div className="text-center py-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
        <h3 className="text-red-800 font-semibold mb-2">{t('errorLoadingData')}</h3>
        <p className="text-red-600 text-sm mb-4">
          {error instanceof Error ? error.message : t('unexpectedError')}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
        >
          {t('retry')}
        </button>
      </div>
    </div>
  );
};

export default UserErrorDisplay;
