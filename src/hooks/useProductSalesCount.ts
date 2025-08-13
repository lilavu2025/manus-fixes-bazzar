import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook لحساب عدد المبيعات والتوزيعات المجانية للمنتجات مباشرة من order_items
 * يستبعد الطلبات الملغاة ويفصل بين المبيعات والعناصر المجانية
 */
export function useProductSalesCount(productIds: string[]) {
  const [salesData, setSalesData] = useState<Map<string, { sales: number, free: number, total: number }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productIds || productIds.length === 0) {
      setSalesData(new Map());
      setLoading(false);
      return;
    }

    const calculateSales = async () => {
      try {
        setLoading(true);
        setError(null);

        // جلب جميع عناصر الطلبات للمنتجات المحددة
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('product_id, quantity, order_id')
          .in('product_id', productIds);

        if (itemsError) {
          throw new Error(`خطأ في جلب عناصر الطلبات: ${itemsError.message}`);
        }

        if (!orderItems || orderItems.length === 0) {
          // تهيئة جميع المنتجات بصفر
          const emptyMap = new Map();
          productIds.forEach(id => emptyMap.set(id, { sales: 0, free: 0, total: 0 }));
          setSalesData(emptyMap);
          setLoading(false);
          return;
        }

        // جلب حالات الطلبات والعناصر المجانية
        const orderIds = [...new Set(orderItems.map(item => item.order_id))];
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id, status, free_items, applied_offers')
          .in('id', orderIds);

        if (ordersError) {
          throw new Error(`خطأ في جلب الطلبات: ${ordersError.message}`);
        }

        // إنشاء خريطة لحالات الطلبات والعناصر المجانية
        const orderStatusMap = new Map();
        const freeItemsMap = new Map<string, number>();

        orders?.forEach(order => {
          orderStatusMap.set(order.id, order.status);
          
          // معالجة العناصر المجانية من free_items
          if (order.free_items) {
            try {
              const freeItems = typeof order.free_items === 'string' 
                ? JSON.parse(order.free_items) 
                : order.free_items;
              
              if (Array.isArray(freeItems)) {
                freeItems.forEach((item: any) => {
                  const productId = item.productId || item.product_id;
                  const quantity = item.quantity || 1;
                  if (productId && productIds.includes(productId)) {
                    const currentFree = freeItemsMap.get(productId) || 0;
                    freeItemsMap.set(productId, currentFree + quantity);
                  }
                });
              }
            } catch (e) {
              console.warn('خطأ في تحليل free_items:', e);
            }
          }

          // معالجة العناصر المجانية من applied_offers.freeProducts
          if (order.applied_offers) {
            try {
              const appliedOffers = typeof order.applied_offers === 'string' 
                ? JSON.parse(order.applied_offers) 
                : order.applied_offers;
              
              if (Array.isArray(appliedOffers)) {
                appliedOffers.forEach((offer: any) => {
                  if (offer.freeProducts && Array.isArray(offer.freeProducts)) {
                    offer.freeProducts.forEach((item: any) => {
                      const productId = item.productId || item.product_id;
                      const quantity = item.quantity || 1;
                      if (productId && productIds.includes(productId)) {
                        const currentFree = freeItemsMap.get(productId) || 0;
                        freeItemsMap.set(productId, currentFree + quantity);
                      }
                    });
                  }
                });
              }
            } catch (e) {
              console.warn('خطأ في تحليل applied_offers:', e);
            }
          }
        });

        // حساب المبيعات (جميع العناصر هي مبيعات ما لم تكن في قائمة المجانية)
        const salesMap = new Map<string, { sales: number, free: number, total: number }>();
        productIds.forEach(id => salesMap.set(id, { sales: 0, free: 0, total: 0 })); // تهيئة بصفر

        for (const item of orderItems as any[]) {
          const orderStatus = orderStatusMap.get(item.order_id);
          if (orderStatus !== 'cancelled') {
            const current = salesMap.get(item.product_id) || { sales: 0, free: 0, total: 0 };
            const quantity = item.quantity || 0;
            
            // جميع العناصر في order_items تعتبر مبيعات
            current.sales += quantity;
            current.total = current.sales + current.free;
            salesMap.set(item.product_id, current);
          }
        }

        // إضافة العناصر المجانية إلى النتيجة
        freeItemsMap.forEach((freeQuantity, productId) => {
          const current = salesMap.get(productId) || { sales: 0, free: 0, total: 0 };
          current.free = freeQuantity;
          current.total = current.sales + current.free;
          salesMap.set(productId, current);
        });

        setSalesData(salesMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطأ غير معروف');
        // تهيئة جميع المنتجات بصفر في حالة الخطأ
        const errorMap = new Map();
        productIds.forEach(id => errorMap.set(id, { sales: 0, free: 0, total: 0 }));
        setSalesData(errorMap);
      } finally {
        setLoading(false);
      }
    };

    calculateSales();
  }, [productIds.join(',')]); // إعادة الحساب عند تغيير قائمة المنتجات

  return { salesData, loading, error };
}

/**
 * Hook لحساب عدد المبيعات لمنتج واحد
 */
export function useSingleProductSalesCount(productId: string) {
  const { salesData, loading, error } = useProductSalesCount([productId]);
  
  const data = salesData.get(productId) || { sales: 0, free: 0, total: 0 };
  
  return {
    salesCount: data.sales,
    freeCount: data.free,
    totalCount: data.total,
    loading,
    error
  };
}
