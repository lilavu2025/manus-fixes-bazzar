import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/utils/languageContextUtils';
import config from "@/configs/activeConfig";

interface HeaderLogoProps {
  isMobile?: boolean;
  isScrolled?: boolean;
}

const HeaderLogo: React.FC<HeaderLogoProps> = ({ isMobile = false, isScrolled = false }) => {
  const { t } = useLanguage();

  if (isMobile) {
    return (
      <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
        <img
          src={config.visual.logo}
          alt={t('storeName')}
          className={`${isScrolled ? 'w-8 h-8' : 'w-12 h-12'} rounded-xl object-contain bg-white/90 shadow-md border border-primary/20 group-hover:scale-105 transition-all duration-200`}
        />
        <div className="flex flex-col justify-center min-w-0">
          <h1 className={`${isScrolled ? 'text-sm' : 'text-base'} font-bold text-primary tracking-tight leading-tight truncate`}>
            {t('storeName')}
          </h1>
        </div>
      </Link>
    );
  }

  return (
    <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
      <img
        src={config.visual.logo}
        alt={t('storeName')}
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-contain bg-white/90 shadow-lg border-2 border-primary group-hover:scale-105 transition-transform duration-200"
        style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)' }}
      />
      <div className="hidden sm:flex flex-col justify-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight leading-tight drop-shadow-sm">
          {t('storeName')}
        </h1>
        <p className="text-sm text-gray-500 hidden lg:block leading-tight font-medium">{t('storeDescription')}</p>
      </div>
    </Link>
  );
};

export default HeaderLogo;
