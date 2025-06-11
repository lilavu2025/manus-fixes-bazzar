import React, { useState } from 'react';
import { useFavorites } from '@/hooks/useFavorites';
import { useLanguage } from '@/utils/languageContextUtils';
import { useAuth } from '@/contexts/useAuth';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import CartSidebar from '@/components/CartSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { Product } from '@/types/product';

const Favorites: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  // استخدم favoriteProducts و isLoading مباشرة من useFavorites
  const { favorites, favoriteProducts, isLoading, error: favoritesError, clearFavorites } = useFavorites();

  // مسح جميع المفضلة
  const handleClearAll = async () => {
    if (!favorites || favorites.length === 0) return;
    try {
      await clearFavorites();
    } catch (error) {
      console.error('خطأ في مسح المفضلة:', error);
    }
  };

  // مكون الـ Loading
  const LoadingComponent = () => (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <div className={`flex items-center gap-3 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Skeleton className="h-8 w-8 rounded-full" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  // mapping للمنتجات المفضلة لتوحيد النوع
  const mappedFavoriteProducts: Product[] = Array.isArray(favoriteProducts)
    ? (favoriteProducts as Tables<'products'>[]).map((p) => ({
        id: p.id,
        name: p.name_en || '',
        nameEn: p.name_en || '',
        nameHe: p.name_he || '',
        description: p.description_ar || '',
        descriptionEn: p.description_en || '',
        descriptionHe: p.description_he || '',
        price: Number(p.price),
        originalPrice: p.original_price ?? undefined,
        wholesalePrice: p.wholesale_price ?? undefined,
        image: p.image,
        images: p.images ?? [],
        category: p.category_id,
        inStock: p.in_stock ?? false,
        rating: Number(p.rating) || 0,
        reviews: p.reviews_count || 0,
        discount: p.discount ?? undefined,
        featured: p.featured ?? false,
        tags: p.tags ?? [],
        stock_quantity: p.stock_quantity ?? 0,
        active: p.active ?? true,
      }))
    : [];

  if (favoritesError) {
    let errorMsg = t('errorLoadingFavorites');
    if (typeof favoritesError === 'object' && favoritesError !== null && 'message' in favoritesError && typeof (favoritesError as { message?: string }).message === 'string') {
      errorMsg = (favoritesError as { message?: string }).message || errorMsg;
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">{t('error')}</h2>
          <p className="mb-4">{errorMsg}</p>
          <Button onClick={() => window.location.reload()}>{t('retry')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* رأس الصفحة */}
      <Header
        onSearchChange={() => {}}
        onCartClick={() => setIsCartOpen(true)}
        onMenuClick={() => {}}
      />
      {isLoading ? (
        <LoadingComponent />
      ) : (
        <div className="container mx-auto px-4 py-6">
          {/* رأس قسم المفضلة */}
          <div className="mb-8">
            <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Heart className="h-8 w-8 text-primary fill-primary" />
                <div>
                  <h1 className="text-3xl font-bold">{t('favorites')}</h1>
                  <p className="text-gray-600 mt-1">
                    {mappedFavoriteProducts.length > 0 
                      ? `${mappedFavoriteProducts.length} ${t('products')}`
                      : t('noFavoritesYet')
                    }
                  </p>
                </div>
              </div>
              
              {/* أزرار الإجراءات */}
              {mappedFavoriteProducts.length > 0 && (
                <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('clearAll')}
                  </Button>
                </div>
              )}
            </div>
            
            {/* إحصائيات سريعة */}
            {mappedFavoriteProducts.length > 0 && (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 text-center ${isRTL ? 'text-right' : 'text-left'}`}>
                    <div>
                      <p className="text-2xl font-bold text-primary">{mappedFavoriteProducts.length}</p>
                      <p className="text-sm text-gray-600">{t('favoriteProducts')}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {mappedFavoriteProducts.filter(p => p.inStock).length}
                      </p>
                      <p className="text-sm text-gray-600">{t('inStock')}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">
                        {mappedFavoriteProducts.filter(p => p.discount && p.discount > 0).length}
                      </p>
                      <p className="text-sm text-gray-600">{t('onSale')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* محتوى الصفحة */}
          {mappedFavoriteProducts.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent>
                <Heart className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-xl font-medium text-gray-900 mb-3">{t('noFavorites')}</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">{t('addFavoritesHint')}</p>
                <Button 
                  onClick={() => window.location.href = '/products'}
                  className={`flex items-center gap-2 mx-auto ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <ShoppingBag className="h-4 w-4" />
                  {t('browseProducts')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mappedFavoriteProducts.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* سايدبار السلة */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Favorites;