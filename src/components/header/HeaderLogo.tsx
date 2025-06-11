import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/utils/languageContextUtils';

const HeaderLogo: React.FC = () => {
  const { t } = useLanguage();

  return (
    <Link to="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-sm sm:text-xl">م</span>
      </div>
      <div className="hidden sm:block">
        <h1 className="text-lg sm:text-xl font-bold text-gradient">{t('storeName')}</h1>
        <p className="text-xs text-gray-500 hidden lg:block">{t('storeDescription')}</p>
      </div>
    </Link>
  );
};

export default HeaderLogo;
