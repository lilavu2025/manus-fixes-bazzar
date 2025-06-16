import React, { useState } from 'react';
import { useOffersRealtime } from '@/hooks/useOffersRealtime';
import { useLanguage } from '@/utils/languageContextUtils';
import Header from '@/components/Header';
import CartSidebar from '@/components/CartSidebar';
import { Badge } from '@/components/ui/badge';
import { Percent } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/hooks/useSupabaseData';
import { Link } from 'react-router-dom';
import { Heart, Share2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
// import { useFavorites } from '@/hooks/useFavorites';
import LazyImage from '@/components/LazyImage';
import type { Database } from '@/integrations/supabase/types';
import type { Product } from '@/types';
import { getDisplayPrice } from '@/utils/priceUtils';
import { useAuth } from '@/contexts/useAuth';

const Offers: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { profile } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { addToCart } = useCart();

  // استخدم hook الجديد لجلب العروض مع التحديث الفوري
  const { offers, loading: isLoading, error, refetch } = useOffersRealtime();

  // تصفية العروض حسب البحث
  const filteredOffers = offers.filter((offer: Database['public']['Tables']['offers']['Row']) =>
    searchQuery === '' || 
    offer.title_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.title_en?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">{t('error')}</h2>
          <p className="mb-4">{error.message || t('errorLoadingData')}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">{t('retry')}</button>
        </div>
      </div>
    );
  }

  // تحويل بيانات العرض إلى منتج متوافق مع السلة
  function offerToProduct(offer: Database['public']['Tables']['offers']['Row']): Product {
    return {
      id: offer.id,
      name: offer.title_ar || offer.title_en || '',
      nameEn: offer.title_en || '',
      description: offer.description_ar || '',
      descriptionEn: offer.description_en || '',
      price: offer.discount_percent || 0, // أو يمكن وضع سعر العرض إذا كان متوفرًا
      originalPrice: undefined,
      wholesalePrice: undefined,
      image: offer.image_url,
      images: offer.image_url ? [offer.image_url] : [],
      category: '',
      inStock: true,
      rating: 0,
      reviews: 0,
      discount: offer.discount_percent,
      featured: false,
      tags: [],
    };
  }

  function handleBuyNow(product: Database['public']['Tables']['offers']['Row']) {
    addToCart(offerToProduct(product), 1);
    setIsCartOpen(true);
  }

  // function FavoriteButton({ productId }: { productId: string }) {
  //   const { isFavorite, toggleFavorite } = useFavorites();
  //   const fav = isFavorite(productId);
  //   return (
  //     <button
  //       type="button"
  //       aria-label="Favorite"
  //       className={`p-2 rounded-full border transition ${fav ? 'bg-red-100 text-red-600' : 'bg-white text-gray-400 hover:text-red-500'}`}
  //       onClick={e => {
  //         e.preventDefault();
  //         toggleFavorite(productId);
  //       }}
  //     >
  //       <Heart className="w-5 h-5" />
  //     </button>
  //   );
  // }

  function ShareButton({ product }: { product: Database['public']['Tables']['offers']['Row'] }) {
    const { t } = useLanguage();
    const handleShare = async (e: React.MouseEvent) => {
      e.preventDefault();
      const url = window.location.origin + `/offer/${product.id}`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: product.title_ar || product.title_en,
            text: product.description_ar || product.description_en,
            url,
          });
        } catch {
          // intentionally ignore share errors
        }
      } else {
        await navigator.clipboard.writeText(url);
        alert(t('linkCopied') || 'تم نسخ الرابط');
      }
    };
    return (
      <button
        type="button"
        aria-label="Share"
        className="p-2 rounded-full border bg-white text-gray-400 hover:text-blue-500 transition"
        onClick={handleShare}
      >
        <Share2 className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Header onSearchChange={setSearchQuery} onCartClick={() => setIsCartOpen(true)} onMenuClick={() => {}} />

      <div className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h1 className="text-3xl font-bold">{t('offers')}</h1>
            <Percent className="h-8 w-8 text-primary" />
          </div>
          <p className="text-gray-600 mb-6">
            {t('specialOffers')}
          </p>
          {filteredOffers.length > 0 && (
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {filteredOffers.length} {t('offers')}
            </Badge>
          )}
        </div>

        {/* Special Offers Banner */}
        {!searchQuery && (
          <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-8 text-white text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">{t('limitedTimeOffers')}</h2>
            <p className="text-lg opacity-90">{t('dontMissOut')}</p>
          </div>
        )}

        {/* Offers Grid */}
        {filteredOffers.length === 0 ? (
          <div className="text-center py-12">
            <Percent className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noOffersAvailable')}</h3>
            <p className="text-gray-500">{t('checkBackLater')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredOffers.map((offer: Database['public']['Tables']['offers']['Row']) => (
              <div
                key={offer.id}
                className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center transition hover:shadow-lg group relative"
              >
                <LazyImage
                  src={offer.image_url}
                  alt={offer.title_ar || offer.title_en || t('specialOffer')}
                  className="w-full h-40 object-cover rounded mb-4 group-hover:scale-105 transition-transform duration-200"
                />
                <h3 className="text-xl font-bold mb-2 text-center w-full truncate">
                  {offer.title_ar || offer.title_en}
                </h3>
                <p className="text-gray-600 mb-2 text-center w-full line-clamp-2">
                  {offer.description_ar || offer.description_en}
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-primary">
                    {t('discount')}: {offer.discount_percent}%
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-4">
                  {t('validUntil')}: {new Date(offer.end_date).toLocaleDateString()}
                </div>
                <button
                  onClick={() => window.open('#', '_blank')}
                  className="mt-auto w-full bg-primary text-white rounded-lg py-2 font-bold hover:bg-primary/90 transition text-center block"
                >
                  {t('viewOffer')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Offers;
