import { useState, useEffect, useCallback } from "react";
import { OfferService, type Offer, type OfferApplicationResult } from "@/services/offerService";
import { useAuth } from "@/contexts/useAuth";
import type { Product } from "@/types/product";

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export const useOffers = () => {
  const { profile } = useAuth();
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // جلب العروض النشطة
  const fetchActiveOffers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const offers = await OfferService.getActiveOffers();
      setActiveOffers(offers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في جلب العروض");
      console.error("Error fetching offers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // تطبيق العروض على السلة
  const applyOffersToCart = useCallback(async (
    cartItems: CartItem[]
  ): Promise<OfferApplicationResult> => {
    try {
      return await OfferService.applyOffers(cartItems, profile?.user_type);
    } catch (err) {
      console.error("Error applying offers:", err);
      return {
        appliedOffers: [],
        totalDiscount: 0,
        updatedItems: cartItems,
        freeItems: []
      };
    }
  }, [profile?.user_type]);

  // جلب العروض المتعلقة بمنتج معين
  const getOffersForProduct = useCallback(async (productId: string) => {
    try {
      return await OfferService.getOffersForProduct(productId);
    } catch (err) {
      console.error("Error getting offers for product:", err);
      return [];
    }
  }, []);

  // تسجيل استخدام العرض
  const recordOfferUsage = useCallback(async (
    offerId: string,
    orderId: string,
    userId: string | null,
    discountAmount: number
  ) => {
    try {
      await OfferService.recordOfferUsage(offerId, orderId, userId, discountAmount);
    } catch (err) {
      console.error("Error recording offer usage:", err);
    }
  }, []);

  // جلب إحصائيات العرض
  const getOfferStats = useCallback(async (offerId: string) => {
    try {
      return await OfferService.getOfferStats(offerId);
    } catch (err) {
      console.error("Error getting offer stats:", err);
      return {
        usageCount: 0,
        totalDiscount: 0,
        totalOrders: 0,
        averageDiscount: 0
      };
    }
  }, []);

  // تحقق من صحة العرض على منتج
  const checkOfferValidityForProduct = useCallback(async (
    offerId: string,
    productId: string
  ) => {
    try {
      return await OfferService.isOfferValidForProduct(offerId, productId);
    } catch (err) {
      console.error("Error checking offer validity:", err);
      return false;
    }
  }, []);

  // جلب العروض عند التحميل الأول
  useEffect(() => {
    fetchActiveOffers();
  }, [fetchActiveOffers]);

  return {
    activeOffers,
    loading,
    error,
    fetchActiveOffers,
    applyOffersToCart,
    getOffersForProduct,
    recordOfferUsage,
    getOfferStats,
    checkOfferValidityForProduct
  };
};

export default useOffers;
