// src/utils/debugLanguages.ts
import config from '@/configs/activeConfig';

export const debugLanguageSystem = () => {
  console.log('🔍 Language System Debug:');
  console.log('- App ID:', config.appId);
  console.log('- Available Languages:', config.availableLanguages);
  console.log('- Default Language:', config.defaultLanguage);
  
  const shouldShow = {
    ar: config.availableLanguages?.includes('ar') || false,
    en: config.availableLanguages?.includes('en') || false,
    he: config.availableLanguages?.includes('he') || false,
  };
  
  console.log('- Should Show Languages:', shouldShow);
  
  return {
    configAppId: config.appId,
    availableLanguages: config.availableLanguages,
    shouldShowLanguages: shouldShow
  };
};

// Call it immediately when imported
debugLanguageSystem();
