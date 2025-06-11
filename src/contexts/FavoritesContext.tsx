import React, { createContext, useReducer, ReactNode } from 'react';
import { Product } from '@/types';
import { favoritesReducer, initialFavoritesState } from '../utils/favoritesContextUtils';
import type { FavoritesContextType, FavoritesState, FavoritesAction } from '../types/favorites';

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(favoritesReducer, initialFavoritesState);
  
  // Load favorites from localStorage on mount
  React.useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      try {
        const favoriteItems = JSON.parse(savedFavorites);
        dispatch({ type: 'LOAD_FAVORITES', payload: favoriteItems });
      } catch (error) {
        console.error('Error loading favorites from localStorage:', error);
      }
    }
  }, []);
  
  // Save favorites to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(state.items));
  }, [state.items]);
  
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
  
  const value: FavoritesContextType = {
    state,
    addFavorite,
    removeFavorite,
    clearFavorites,
    isFavorite,
    toggleFavorite
  };
  
  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export default FavoritesContext;
export { FavoritesProvider };