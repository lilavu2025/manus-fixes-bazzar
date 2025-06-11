import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/useAuth';
import { useLanguage } from '@/utils/languageContextUtils';
import { toast } from 'sonner';

export interface FavoriteButtonProps {
  productId: string;
  className?: string;
  onClick?: () => void | Promise<void>; // <-- Add this line
  size?: 'sm' | 'icon' | 'default';
  variant?: 'ghost' | 'outline' | 'secondary';
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ 
  productId, 
  className = '', 
  size = 'icon',
  variant = 'ghost',
  onClick, // <-- Add this line
}) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { user } = useAuth();
  const { t } = useLanguage();

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error(t('pleaseLogin') || 'Please login to add favorites');
      return;
    }
    
    try {
      await toggleFavorite(productId);
    } catch (error: unknown) {
      console.error('Error toggling favorite:', error);
      
      // Handle specific error cases
      if (typeof error === 'object' && error && 'code' in error && (error as { code?: string }).code === '23505') {
        // Duplicate key error - item is already in favorites
        toast.info(t('alreadyInFavorites') || 'Item is already in your favorites');
      } else {
        toast.error(t('errorUpdatingFavorites') || 'Error updating favorites');
      }
    }
  };

  const isFav = isFavorite(productId);

  return (
    <Button
      size={size}
      variant={variant}
      className={`${className} ${isFav ? 'text-red-500' : ''}`}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        handleFavorite(e);
        if (onClick) onClick();
      }}
      aria-label={isFav ? t('removeFromFavorites') : t('addToFavorites')}
    >
      <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
    </Button>
  );
};

export default FavoriteButton;
