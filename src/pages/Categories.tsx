import React, { useState } from 'react';
import { useCategoriesRealtime } from '@/hooks/useCategoriesRealtime';
import { useLanguage } from '@/utils/languageContextUtils';
import Header from '@/components/Header';
import CategoryCard from '@/components/CategoryCard';
import CartSidebar from '@/components/CartSidebar';

const Categories: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { categories, loading, error, refetch } = useCategoriesRealtime();

  console.log('Categories page - data:', categories);
  console.log('Categories page - loading:', loading);
  console.log('Categories page - error:', error);

  // فلترة الفئات: فقط الفئات النشطة + البحث
  const filteredCategories = categories
    .filter(category => category.active)
    .filter(category => category.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    let errorMsg = t('errorLoadingData');
    if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: string }).message === 'string') {
      errorMsg = (error as { message?: string }).message || errorMsg;
    }
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          onSearchChange={setSearchQuery}
          onCartClick={() => setIsCartOpen(true)}
          onMenuClick={() => {}}
        />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-red-500 text-lg">خطأ في تحميل الفئات: {errorMsg}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-primary text-white px-4 py-2 rounded"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Header onSearchChange={setSearchQuery} onCartClick={() => setIsCartOpen(true)} onMenuClick={() => {}} />

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Advanced Search Bar & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:ring-2 focus:ring-primary focus:border-primary transition"
              placeholder={t('searchCategories')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
            <span className="inline-flex items-center text-xs bg-primary/10 text-primary font-semibold rounded px-2 py-1">
              {t('total')}: {categories.length}
            </span>
            <span className="inline-flex items-center text-xs bg-gray-200 text-gray-700 font-semibold rounded px-2 py-1">
              {t('showing')}: {filteredCategories.length}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 text-gray-900">
            {t('categories')}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {t('browseProductCategories')}
          </p>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {searchQuery ? t('noCategoriesFound') : 'لا توجد فئات متاحة'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredCategories.map(category => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Categories;
