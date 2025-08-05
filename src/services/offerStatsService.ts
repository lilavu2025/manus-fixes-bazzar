import { supabase } from "@/integrations/supabase/client";

export interface OfferStatistics {
  totalOrders: number;
  totalDiscountAmount: number;
  totalRevenue: number;
  totalFreeItems: number;
  conversionRate: number;
  averageOrderValue: number;
  period?: string;
}

export interface OfferUsageDetail {
  id: string;
  order_id: string;
  user_id: string;
  discount_amount: number;
  free_items_count: number;
  created_at: string;
  order?: {
    order_number: number;
    total: number;
    status: string;
    customer_name: string;
  };
}

export class OfferStatsService {
  // تخزين مؤقت بسيط للنتائج
  private static cache = new Map<string, { data: any, timestamp: number }>();
  private static CACHE_DURATION = 2 * 60 * 1000; // 2 دقائق

  private static getCacheKey(type: string, id?: string, period?: string): string {
    return `${type}_${id || 'all'}_${period || 'all'}`;
  }

  private static getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private static setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * التحقق من وجود الأعمدة المطلوبة في قاعدة البيانات
   */
  static async checkDatabaseStructure(): Promise<boolean> {
    try {
      // محاولة جلب عينة صغيرة للتحقق من وجود الأعمدة
      const { data, error } = await supabase
        .from('orders')
        .select('applied_offers, free_items, discount_from_offers')
        .limit(1);

      if (error) {
        console.error('تحذير: أعمدة العروض غير موجودة في قاعدة البيانات:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('خطأ في التحقق من هيكل قاعدة البيانات:', error);
      return false;
    }
  }

  /**
   * احصائيات العرض من قاعدة البيانات الحقيقية
   */
  static async getOfferStatistics(offerId: string, period?: '7d' | '30d' | '90d' | 'all'): Promise<OfferStatistics> {
    try {
      // التحقق من التخزين المؤقت أولاً
      const cacheKey = this.getCacheKey('offer', offerId, period);
      const cachedResult = this.getFromCache<OfferStatistics>(cacheKey);
      if (cachedResult) {
        console.log(`📦 استخدام النتيجة المخزنة للعرض ${offerId}`);
        return cachedResult;
      }

      // التحقق من وجود الأعمدة المطلوبة
      const hasRequiredColumns = await this.checkDatabaseStructure();
      if (!hasRequiredColumns) {
        console.warn('تحذير: أعمدة العروض غير موجودة. يرجى تشغيل ملف complete-offers-migration.sql');
        return this.getEmptyStats();
      }

      // تحديد فترة البحث
      let dateFilter = '';
      if (period) {
        const now = new Date();
        const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 0;
        if (daysAgo > 0) {
          const fromDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          dateFilter = fromDate.toISOString();
        }
      }

      // نهج مبسط: جلب جميع الطلبات التي لها applied_offers (بغض النظر عن الحالة)
      let ordersQuery = supabase
        .from('orders')
        .select(`
          id,
          total,
          discount_from_offers,
          applied_offers,
          free_items,
          created_at,
          status
        `)
        .not('applied_offers', 'is', null);

      if (dateFilter) {
        ordersQuery = ordersQuery.gte('created_at', dateFilter);
      }

      const { data: orders, error } = await ordersQuery;

      console.log('نتيجة الاستعلام للعرض:', { 
        offerId,
        ordersCount: orders?.length || 0, 
        error: error?.message,
        period,
        sampleOrder: orders?.[0] ? {
          id: orders[0].id,
          status: orders[0].status,
          hasAppliedOffers: !!orders[0].applied_offers,
          discountFromOffers: orders[0].discount_from_offers
        } : null
      });

      if (error) {
        console.error('خطأ في جلب الطلبات:', error);
        return this.getEmptyStats();
      }

      if (!orders || orders.length === 0) {
        console.log(`لا توجد طلبات تحتوي على applied_offers للفترة ${period || 'all'}`);
        return this.getEmptyStats();
      }

      console.log(`تم العثور على ${orders.length} طلبات تحتوي على applied_offers للفترة ${period || 'all'}`);

      // تصفية الطلبات التي تحتوي على هذا العرض
      const relevantOrders = orders.filter(order => {
        if (!order.applied_offers) return false;
        
        try {
          const appliedOffers = typeof order.applied_offers === 'string' 
            ? JSON.parse(order.applied_offers) 
            : order.applied_offers;

          // البحث في التنسيق الجديد: array من objects تحتوي على offer.id
          if (Array.isArray(appliedOffers)) {
            return appliedOffers.some(appliedOffer => {
              return appliedOffer.offer && appliedOffer.offer.id === offerId;
            });
          }
        } catch (e) {
          console.error('خطأ في تحليل applied_offers:', e, order.applied_offers);
        }
        
        return false;
      });

      console.log(`العثور على ${relevantOrders.length} طلبات للعرض ${offerId} من أصل ${orders.length} طلبات`);

      // إذا لم نجد طلبات محددة للعرض، نعرض إحصائيات فارغة
      if (relevantOrders.length === 0) {
        console.log(`لا توجد طلبات تحتوي على العرض ${offerId}`);
        return this.getEmptyStats();
      }

      // حساب الإحصائيات
      let totalDiscountAmount = 0;
      let totalRevenue = 0;
      let totalFreeItems = 0;

      relevantOrders.forEach(order => {
        try {
          const appliedOffers = typeof order.applied_offers === 'string' 
            ? JSON.parse(order.applied_offers) 
            : order.applied_offers;

          // البحث عن العرض المحدد وجلب قيمة الخصم
          if (Array.isArray(appliedOffers)) {
            const offerData = appliedOffers.find(appliedOffer => 
              appliedOffer.offer && appliedOffer.offer.id === offerId
            );
            
            if (offerData) {
              // إضافة قيمة الخصم للعرض المحدد
              totalDiscountAmount += offerData.discountAmount || 0;
              
              // حساب العناصر المجانية
              if (offerData.freeProducts && Array.isArray(offerData.freeProducts)) {
                offerData.freeProducts.forEach(freeProduct => {
                  totalFreeItems += freeProduct.quantity || 1;
                });
              }
            }
          }
        } catch (e) {
          console.error('خطأ في حساب الخصم للطلب:', order.id, e);
        }

        totalRevenue += order.total || 0;
      });

      const totalOrders = relevantOrders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const conversionRate = orders.length > 0 ? (totalOrders / orders.length) * 100 : 0;

      const result = {
        totalOrders,
        totalDiscountAmount,
        totalRevenue,
        totalFreeItems,
        conversionRate,
        averageOrderValue,
        period
      };

      console.log(`إحصائيات العرض ${offerId}:`, result);
      
      // حفظ النتيجة في التخزين المؤقت
      this.setCache(cacheKey, result);
      
      return result;

    } catch (error) {
      console.error('خطأ في حساب إحصائيات العرض:', error);
      return this.getEmptyStats();
    }
  }

  /**
   * تفاصيل استخدام العرض من قاعدة البيانات الحقيقية
   */
  static async getOfferUsageDetails(offerId: string, limit: number = 50): Promise<OfferUsageDetail[]> {
    try {
      // جلب الطلبات التي استخدمت هذا العرض
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total,
          status,
          customer_name,
          applied_offers,
          discount_from_offers,
          free_items,
          created_at,
          user_id
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('خطأ في جلب تفاصيل الطلبات:', error);
        return [];
      }

      if (!orders) return [];

      // تصفية وتحويل البيانات
      const usageDetails: OfferUsageDetail[] = [];

      orders.forEach(order => {
        if (!order.applied_offers) return;

        try {
          const appliedOffers = typeof order.applied_offers === 'string' 
            ? JSON.parse(order.applied_offers) 
            : order.applied_offers;

          let offerFound = false;
          let discountAmount = 0;
          let freeItemsCount = 0;

          // البحث في العروض المطبقة
          if (Array.isArray(appliedOffers)) {
            const offerData = appliedOffers.find(offer => offer.id === offerId);
            if (offerData) {
              offerFound = true;
              discountAmount = offerData.discount_amount || 0;
            }
          } else if (appliedOffers.offers && Array.isArray(appliedOffers.offers)) {
            const offerData = appliedOffers.offers.find(offer => offer.id === offerId);
            if (offerData) {
              offerFound = true;
              discountAmount = offerData.discount_amount || 0;
            }
          }

          // حساب العناصر المجانية
          if (order.free_items && offerFound) {
            try {
              const freeItems = typeof order.free_items === 'string' 
                ? JSON.parse(order.free_items) 
                : order.free_items;

              if (Array.isArray(freeItems)) {
                freeItems.forEach(item => {
                  if (item.offer_id === offerId) {
                    freeItemsCount += item.quantity || 1;
                  }
                });
              }
            } catch (e) {
              console.error('خطأ في تحليل العناصر المجانية:', e);
            }
          }

          if (offerFound) {
            usageDetails.push({
              id: `${order.id}-${offerId}`,
              order_id: order.id,
              user_id: order.user_id,
              discount_amount: discountAmount,
              free_items_count: freeItemsCount,
              created_at: order.created_at,
              order: {
                order_number: order.order_number,
                total: order.total,
                status: order.status,
                customer_name: order.customer_name
              }
            });
          }
        } catch (e) {
          console.error('خطأ في تحليل بيانات الطلب:', e);
        }
      });

      return usageDetails;

    } catch (error) {
      console.error('خطأ في جلب تفاصيل استخدام العرض:', error);
      return [];
    }
  }

  /**
   * احصائيات شاملة لجميع العروض
   */
  static async getAllOffersStatistics(period?: '7d' | '30d' | '90d' | 'all') {
    try {
      let query = supabase
        .from('offers')
        .select('*')
        .eq('active', true);

      const { data: offers, error } = await query;

      if (error) {
        console.error('خطأ في جلب العروض:', error);
        return [];
      }

      if (!offers) return [];

      // جلب إحصائيات كل عرض
      const offersWithStats = await Promise.all(
        offers.map(async (offer) => {
          const stats = await this.getOfferStatistics(offer.id, period);
          return {
            ...offer,
            statistics: stats
          };
        })
      );

      return offersWithStats;
    } catch (error) {
      console.error('خطأ في جلب إحصائيات جميع العروض:', error);
      return [];
    }
  }

  /**
   * احصائيات فارغة
   */
  private static getEmptyStats(): OfferStatistics {
    return {
      totalOrders: 0,
      totalDiscountAmount: 0,
      totalRevenue: 0,
      totalFreeItems: 0,
      conversionRate: 0,
      averageOrderValue: 0
    };
  }

  /**
   * احصائيات العروض الإجمالية من قاعدة البيانات الحقيقية
   */
  static async getOverallOfferStats(period?: '7d' | '30d' | '90d' | 'all') {
    try {
      // التحقق من التخزين المؤقت أولاً
      const cacheKey = this.getCacheKey('overall', undefined, period);
      const cachedResult = this.getFromCache<OfferStatistics>(cacheKey);
      if (cachedResult) {
        console.log('📦 استخدام النتيجة المخزنة للإحصائيات الإجمالية');
        return cachedResult;
      }

      // التحقق من وجود الأعمدة المطلوبة
      const hasRequiredColumns = await this.checkDatabaseStructure();
      if (!hasRequiredColumns) {
        console.warn('تحذير: أعمدة العروض غير موجودة. يرجى تشغيل ملف complete-offers-migration.sql');
        return this.getEmptyStats();
      }

      // تحديد فترة البحث
      let dateFilter = '';
      if (period) {
        const now = new Date();
        const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 0;
        if (daysAgo > 0) {
          const fromDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          dateFilter = fromDate.toISOString();
        }
      }

      // جلب جميع الطlبات المكتملة التي تحتوي على applied_offers
      let ordersQuery = supabase
        .from('orders')
        .select(`
          id,
          total,
          discount_from_offers,
          applied_offers,
          free_items,
          created_at,
          status
        `)
        .not('applied_offers', 'is', null);

      if (dateFilter) {
        ordersQuery = ordersQuery.gte('created_at', dateFilter);
      }

      const { data: orders, error } = await ordersQuery;

      console.log('🔍 الطلبات للإحصائيات الإجمالية:', {
        ordersCount: orders?.length || 0,
        error: error?.message,
        sampleOrder: orders?.[0] ? {
          id: orders[0].id,
          status: orders[0].status,
          total: orders[0].total,
          discount_from_offers: orders[0].discount_from_offers
        } : null
      });

      if (error) {
        console.error('خطأ في جلب الطلبات للإحصائيات الإجمالية:', error);
        return this.getEmptyStats();
      }

      if (!orders || orders.length === 0) {
        return this.getEmptyStats();
      }

      // حساب الإحصائيات الإجمالية
      let totalDiscountAmount = 0;
      let totalRevenue = 0;
      let totalFreeItems = 0;
      let ordersWithOffers = 0;

      orders.forEach(order => {
        totalRevenue += order.total || 0;

        // حساب الخصم من العروض (التعامل مع النص والأرقام)
        const discountValue = order.discount_from_offers;
        if (discountValue && discountValue.toString() !== '0') {
          const numericDiscount = typeof discountValue === 'string' 
            ? parseFloat(discountValue) 
            : discountValue;
          
          if (!isNaN(numericDiscount) && numericDiscount > 0) {
            totalDiscountAmount += numericDiscount;
            ordersWithOffers++;
          }
        }

        // حساب العناصر المجانية من applied_offers
        if (order.applied_offers) {
          try {
            const appliedOffers = typeof order.applied_offers === 'string' 
              ? JSON.parse(order.applied_offers) 
              : order.applied_offers;

            if (Array.isArray(appliedOffers)) {
              appliedOffers.forEach(appliedOffer => {
                if (appliedOffer.freeProducts && Array.isArray(appliedOffer.freeProducts)) {
                  appliedOffer.freeProducts.forEach(freeProduct => {
                    totalFreeItems += freeProduct.quantity || 1;
                  });
                }
              });
            }
          } catch (e) {
            console.error('خطأ في حساب العناصر المجانية الإجمالية:', e);
          }
        }
      });

      const totalOrders = ordersWithOffers;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const conversionRate = orders.length > 0 ? (ordersWithOffers / orders.length) * 100 : 0;

      const result = {
        totalOrders,
        totalDiscountAmount,
        totalRevenue,
        totalFreeItems,
        conversionRate,
        averageOrderValue,
        period
      };

      console.log('الإحصائيات الإجمالية للعروض:', result);
      
      // حفظ النتيجة في التخزين المؤقت
      this.setCache(cacheKey, result);
      
      return result;

    } catch (error) {
      console.error('خطأ في حساب الإحصائيات الإجمالية:', error);
      return this.getEmptyStats();
    }
  }
}
