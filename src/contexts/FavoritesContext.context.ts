import { createContext } from 'react';
import { FavoritesContextType } from '@/types/favorites';

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);
export default FavoritesContext;
