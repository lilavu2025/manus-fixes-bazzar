import React from 'react';
import { useLanguage } from '@/utils/languageContextUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Heart } from 'lucide-react';

const Favorites: React.FC = () => {
  const { t, isRTL } = useLanguage();

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-6">
        <Card className="text-center py-16">
          <CardContent>
            <Heart className="h-20 w-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-medium text-gray-900 mb-3">{t('favoritesNotAvailable') || 'المفضلة غير متاحة حالياً'}</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">{t('favoritesComingSoon') || 'ميزة المفضلة قيد التطوير وستكون متاحة قريباً'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Favorites;
