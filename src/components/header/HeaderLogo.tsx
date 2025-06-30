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
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-contain bg-white shadow"
      />
      <div className="hidden sm:block">
        <h1 className="text-lg sm:text-xl font-bold text-gradient">{t('storeName')}</h1>
        <p className="text-xs text-gray-500 hidden lg:block">{t('storeDescription')}</p>
      </div>
    </Link>
  );
};

export default HeaderLogo;
