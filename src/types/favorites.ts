import { Product } from '@/types';

export interface FavoritesState {
  items: Product[];
  count: number;
}

export type FavoritesAction =
  | { type: 'ADD_FAVORITE'; payload: Product }
  | { type: 'REMOVE_FAVORITE'; payload: string }
  | { type: 'CLEAR_FAVORITES' }
  | { type: 'LOAD_FAVORITES'; payload: Product[] };

export interface FavoritesContextType {
  state: FavoritesState;
  addFavorite: (product: Product) => void;
  removeFavorite: (productId: string) => void;
  clearFavorites: () => void;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: Product) => void;
}
