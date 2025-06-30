import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/utils/languageContextUtils';
import config from "@/configs/activeConfig";

const HeaderLogo: React.FC = () => {
  const { t } = useLanguage();

  return (
    <Link to="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
      <img
        src={config.visual.logo}
        alt={t('storeName')}
        className="w-16 h-16 sm:w-16 sm:h-16 rounded-lg object-contain bg-white shadow"
      />
      <div className="hidden sm:block">
        <h1 className="text-lg sm:text-xl font-bold text-gradient">{t('storeName')}</h1>
        <p className="text-xs text-gray-500 hidden lg:block">{t('storeDescription')}</p>
      </div>
    </Link>
  );
};

export default HeaderLogo;
