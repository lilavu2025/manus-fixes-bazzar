/*
// /home/ubuntu/modern-mobile-bazaar/src/hooks/useFavorites.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from '@/contexts/useAuth';
import { useLanguage } from '@/utils/languageContextUtils';
import { toast } from "sonner";
import { FavoriteService } from "@/services/supabaseService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Product } from "@/types"; // Assuming Product type is defined
import { Language } from "@/types/language";
import { useLiveSupabaseQuery } from './useLiveSupabaseQuery';
import { setCookie, getCookie } from '@/utils/commonUtils';

export const useFavorites = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();

  // تفعيل polling وتحديث عند العودة للنافذة في جلب favoriteIds
  const { data: favoriteIdsRaw = [], isLoading: isLoadingIds, error: fetchError } = useQuery<string[]>({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) {
        // Guest user: Load from cookies
        try {
          const guestFavorites = getCookie("favorites_guest");
          return guestFavorites ? JSON.parse(guestFavorites) : [];
        } catch (error) {
          console.error("[useFavorites] Error loading guest favorites from cookies:", error);
          return [];
        }
      }
      return await FavoriteService.getUserFavorites(user.id);
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    // تم تعطيل polling (refetchInterval) لأن المتصفح يوقفه بالخلفية،
    // والاعتماد على WebSocket أو إعادة الجلب عند العودة للواجهة أفضل.
    // refetchInterval: false,
  });
  const favoriteIds: string[] = useMemo(() => favoriteIdsRaw || [], [favoriteIdsRaw]);

  // Save guest favorites to cookies
  useEffect(() => {
    if (!user && Array.isArray(favoriteIds)) {
      try {
        setCookie("favorites_guest", JSON.stringify(favoriteIds), 60 * 60 * 24 * 30); // 30 يوم
      } catch (error) {
        console.error("[useFavorites] Error saving guest favorites to cookies:", error);
      }
    }
  }, [favoriteIds, user]);

  // Mutation for adding a favorite
  const addFavoriteMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) {
        // Guest: Update local state directly via query cache invalidation/update
        const currentGuestFavorites = JSON.parse(getCookie("favorites_guest") || "[]");
        if (!currentGuestFavorites.includes(productId)) {
          const updatedGuestFavorites = [...currentGuestFavorites, productId];
          setCookie("favorites_guest", JSON.stringify(updatedGuestFavorites), 60 * 60 * 24 * 30);
        }
        return productId; // Return ID for optimistic update
      }
      // Logged-in user: Call service
      const { error } = await FavoriteService.addFavorite(user.id, productId);
      if (error) {
        // Handle potential errors, e.g., unique constraint violation if already added
        console.error("[useFavorites] Error adding favorite via service:", error);
        throw error;
      }
      return productId;
    },
    onMutate: async (productId) => {
      // Optimistic update: Add to cache immediately
      await queryClient.cancelQueries({ queryKey: ["favorites", user?.id] });
      const previousFavorites = queryClient.getQueryData<string[]>(["favorites", user?.id]);
      queryClient.setQueryData<string[]>(["favorites", user?.id], (old = []) => 
        old.includes(productId) ? old : [...old, productId]
      );
      return { previousFavorites }; // Return context for rollback
    },
    onError: (err, productId, context) => {
      // Rollback on error
      if (context?.previousFavorites) {
        queryClient.setQueryData(["favorites", user?.id], context.previousFavorites);
      }
      toast.error(t("errorAddingToFavorites"));
    },
    onSettled: (productId) => {
      // Invalidate to ensure consistency after mutation settles
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
      // Also invalidate favorite product details if that query exists
      queryClient.invalidateQueries({ queryKey: ["favoriteProducts", user?.id] }); 
    },
    onSuccess: () => {
      toast.success(t("addedToFavorites"));
    }
  });

  // Mutation for removing a favorite
  const removeFavoriteMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) {
        // Guest: Update local state directly
        const currentGuestFavorites = JSON.parse(getCookie("favorites_guest") || "[]");
        const updatedGuestFavorites = currentGuestFavorites.filter((id: string) => id !== productId);
        setCookie("favorites_guest", JSON.stringify(updatedGuestFavorites), 60 * 60 * 24 * 30);
        return productId; // Return ID for optimistic update
      }
      // Logged-in user: Call service
      const { error } = await FavoriteService.removeFavorite(user.id, productId);
      if (error) {
        console.error("[useFavorites] Error removing favorite via service:", error);
        throw error;
      }
      return productId;
    },
    onMutate: async (productId) => {
      // Optimistic update: Remove from cache immediately
      await queryClient.cancelQueries({ queryKey: ["favorites", user?.id] });
      const previousFavorites = queryClient.getQueryData<string[]>(["favorites", user?.id]);
      queryClient.setQueryData<string[]>(["favorites", user?.id], (old = []) => 
        old.filter(id => id !== productId)
      );
      return { previousFavorites }; // Return context for rollback
    },
    onError: (err, productId, context) => {
      // Rollback on error
      if (context?.previousFavorites) {
        queryClient.setQueryData(["favorites", user?.id], context.previousFavorites);
      }
      toast.error(t("errorRemovingFromFavorites"));
    },
    onSettled: (productId) => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["favoriteProducts", user?.id] });
    },
    onSuccess: () => {
      toast.success(t("removedFromFavorites"));
    }
  });

  // Mutation for clearing all favorites
  const clearFavoritesMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        // Guest: Clear cookies
        setCookie("favorites_guest", "[]", -1); // Set expiration in the past to delete
        return;
      }
      // Logged-in user: Call service
      const { error } = await FavoriteService.clearUserFavorites(user.id);
      if (error) {
        console.error("[useFavorites] Error clearing favorites via service:", error);
        throw error;
      }
    },
    onMutate: async () => {
      // Optimistic update: Clear cache
      await queryClient.cancelQueries({ queryKey: ["favorites", user?.id] });
      const previousFavorites = queryClient.getQueryData<string[]>(["favorites", user?.id]);
      queryClient.setQueryData<string[]>(["favorites", user?.id], []);
      return { previousFavorites };
    },
    onError: (err, variables, context) => {
      // Rollback
      if (context?.previousFavorites) {
        queryClient.setQueryData(["favorites", user?.id], context.previousFavorites);
      }
      toast.error(t("errorClearingFavorites"));
    },
    onSettled: () => {
      // Invalidate
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["favoriteProducts", user?.id] });
    },
    onSuccess: () => {
      toast.success(t("favoritesCleared"));
    }
  });

  // Toggle function using the mutations
  const toggleFavorite = useCallback((productId: string) => {
    if (!productId) {
      toast.error(t("invalidProduct"));
      return;
    }
    const isFav = favoriteIds.includes(productId);
    if (isFav) {
      removeFavoriteMutation.mutate(productId);
    } else {
      addFavoriteMutation.mutate(productId);
    }
  }, [favoriteIds, addFavoriteMutation, removeFavoriteMutation, t]);

  // Check if a product is favorite
  const isFavorite = useCallback((productId: string): boolean => {
    return favoriteIds.includes(productId);
  }, [favoriteIds]);

  // Get count
  const getFavoritesCount = useCallback((): number => {
    return favoriteIds.length;
  }, [favoriteIds]);

  // تفعيل polling دائم لجلب تفاصيل المنتجات المفضلة
  const { data: favoriteProductsRaw = [], loading: isLoadingProducts, error: productsError } = useLiveSupabaseQuery({
    queryFn: async () => {
      if (favoriteIds.length === 0) return [];
      const { data, error } = await FavoriteService.getFavoriteProductDetails(favoriteIds, language as Language);
      if (error) return [];
      return data || [];
    },
    retryInterval: 5000,
  });

  return {
    favorites: favoriteIds, // List of product IDs
    favoriteProducts: favoriteProductsRaw, // إذا احتجت تحويل لنوع Product، أضف mapping هنا
    isLoading: isLoadingIds || (favoriteIds.length > 0 && isLoadingProducts), // Combined loading state
    error: fetchError || productsError,
    toggleFavorite,
    isFavorite,
    getFavoritesCount,
    clearFavorites: clearFavoritesMutation.mutate,
    isToggling: addFavoriteMutation.isPending || removeFavoriteMutation.isPending,
    isClearing: clearFavoritesMutation.isPending,
  };
};
*/
