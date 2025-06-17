import React, { createContext, useReducer, ReactNode, useEffect } from 'react';
import { Product } from '@/types';
import { favoritesReducer, initialFavoritesState } from '../utils/favoritesContextUtils';
import type { FavoritesContextType, FavoritesState, FavoritesAction } from '../types/favorites';
import { setCookie, getCookie, deleteCookie } from '../utils/cookieUtils';
import { useAuth } from '@/contexts/useAuth';
import { FavoriteService } from '@/services/supabaseService';

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(favoritesReducer, initialFavoritesState);
  const { user } = useAuth();

  // Load favorites from cookies on mount
  React.useEffect(() => {
    const savedFavorites = getCookie('favorites');
    if (savedFavorites) {
      try {
        const favoriteItems = JSON.parse(savedFavorites);
        dispatch({ type: 'LOAD_FAVORITES', payload: favoriteItems });
      } catch (error) {
        console.error('Error loading favorites from cookies:', error);
      }
    }
  }, []);
  
  // Save favorites to cookies whenever they change
  React.useEffect(() => {
    setCookie('favorites', JSON.stringify(state.items), 60 * 60 * 24 * 30); // 30 يوم
  }, [state.items]);
  
  // مزامنة المفضلة من الكوكيز إلى قاعدة البيانات عند تسجيل الدخول
  useEffect(() => {
    if (user) {
      const guestFavorites = getCookie('favorites');
      if (guestFavorites) {
        try {
          const items: Product[] = JSON.parse(guestFavorites);
          // أضف كل منتج للمفضلة في قاعدة البيانات
          items.forEach(async (item) => {
            await FavoriteService.addFavorite(user.id, item.id);
          });
          deleteCookie('favorites');
        } catch (error) {
          // إذا فشل التحويل، احذف الكوكيز فقط
          deleteCookie('favorites');
        }
      }
    }
  }, [user]);
  
  const addFavorite = (product: Product) => {
    dispatch({ type: 'ADD_FAVORITE', payload: product });
  };
  
  const removeFavorite = (productId: string) => {
    dispatch({ type: 'REMOVE_FAVORITE', payload: productId });
  };
  
  const clearFavorites = () => {
    dispatch({ type: 'CLEAR_FAVORITES' });
  };
  
  const isFavorite = (productId: string) => {
    return state.items.some(item => item.id === productId);
  };
  
  const toggleFavorite = (product: Product) => {
    if (isFavorite(product.id)) {
      removeFavorite(product.id);
    } else {
      addFavorite(product);
    }
  };
  
  
  return (
    <FavoritesContext.Provider value={{ state, addFavorite, removeFavorite, clearFavorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export { FavoritesProvider };
export default FavoritesContext;