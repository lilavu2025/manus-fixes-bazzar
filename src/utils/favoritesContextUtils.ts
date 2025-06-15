/*
import { useContext } from 'react';
import FavoritesContext from '../contexts/FavoritesContext.context';
import type { FavoritesContextType, FavoritesState, FavoritesAction } from '../types/favorites';

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const favoritesReducer = (state: FavoritesState, action: FavoritesAction): FavoritesState => {
  switch (action.type) {
    case 'ADD_FAVORITE': {
      const product = action.payload;
      if (state.items.some(item => item.id === product.id)) {
        return state;
      }
      const updatedItems = [...state.items, product];
      return {
        items: updatedItems,
        count: updatedItems.length
      };
    }
    case 'REMOVE_FAVORITE': {
      const productId = action.payload;
      const updatedItems = state.items.filter(item => item.id !== productId);
      return {
        items: updatedItems,
        count: updatedItems.length
      };
    }
    case 'CLEAR_FAVORITES':
      return {
        items: [],
        count: 0
      };
    case 'LOAD_FAVORITES': {
      const items = action.payload;
      return {
        items,
        count: items.length
      };
    }
    default:
      return state;
  }
};

export const initialFavoritesState: FavoritesState = {
  items: [],
  count: 0
};
*/
