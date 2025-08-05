import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/utils/languageContextUtils";
import { OfferService } from "@/services/offerService";
import { OfferStatsService } from "@/services/offerStatsService";
import { 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  Gift, 
  ShoppingCart, 
  DollarSign,
  Target,
  Clock
} from "lucide-react";

interface OverallStats {
  totalOffers: number;
  activeOffers: number;
  totalUsage: number;
  totalDiscount: number;
  averageDiscount: number;
  totalOrders: number;
  bestPerformingOffer: any;
  expiringSoon: number;
  totalRevenue: number;
  totalFreeItems: number;
}

interface OfferSummaryStatsProps {
  offers: any[];
}

const OfferSummaryStats: React.FC<OfferSummaryStatsProps> = ({ offers }) => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<OverallStats>({
    totalOffers: 0,
    activeOffers: 0,
    totalUsage: 0,
    totalDiscount: 0,
    averageDiscount: 0,
    totalOrders: 0,
    bestPerformingOffer: null,
    expiringSoon: 0,
    totalRevenue: 0,
    totalFreeItems: 0
  });
  const [loading, setLoading] = useState(true);
  const [databaseReady, setDatabaseReady] = useState(true);

  useEffect(() => {
    const calculateStats = async () => {
      setLoading(true);
      try {
        // التحقق من جاهزية قاعدة البيانات
        const isReady = await OfferStatsService.checkDatabaseStructure();
        setDatabaseReady(isReady);

        if (!isReady) {
          // إذا لم تكن قاعدة البيانات جاهزة، نعرض إحصائيات أساسية فقط
          setStats({
            totalOffers: offers.length,
            activeOffers: offers.filter(offer => offer.active).length,
            totalUsage: 0,
            totalDiscount: 0,
            averageDiscount: 0,
            totalOrders: 0,
            bestPerformingOffer: null,
            expiringSoon: 0,
            totalRevenue: 0,
            totalFreeItems: 0
          });
          return;
        }

        console.log('🔄 بدء حساب الإحصائيات المحسنة...');
        
        // طريقة محسنة: جلب جميع الإحصائيات في استدعاء واحد
        const [overallStats, ...offerStatsArray] = await Promise.all([
          OfferStatsService.getOverallOfferStats('30d'),
          ...offers.map(offer => OfferStatsService.getOfferStatistics(offer.id, '30d'))
        ]);

        console.log('� تم الحصول على جميع الإحصائيات:', { overallStats, offerStatsCount: offerStatsArray.length });

        // العثور على أفضل عرض أداءً
        let bestOffer = null;
        let maxUsage = 0;
        
        offers.forEach((offer, index) => {
          const stats = offerStatsArray[index];
          if (stats.totalOrders > maxUsage) {
            maxUsage = stats.totalOrders;
            bestOffer = { ...offer, stats };
          }
        });

        // حساب العروض التي تنتهي قريباً
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const expiringSoon = offers.filter(offer => {
          if (!offer.end_date) return false;
          const endDate = new Date(offer.end_date);
          return endDate > now && endDate <= weekFromNow;
        }).length;

        const activeOffers = offers.filter(offer => offer.active).length;

        const finalStats = {
          totalOffers: offers.length,
          activeOffers,
          totalUsage: overallStats.totalOrders,
          totalDiscount: overallStats.totalDiscountAmount,
          averageDiscount: overallStats.totalOrders > 0 ? overallStats.totalDiscountAmount / overallStats.totalOrders : 0,
          totalOrders: overallStats.totalOrders,
          bestPerformingOffer: bestOffer,
          expiringSoon,
          totalRevenue: overallStats.totalRevenue,
          totalFreeItems: overallStats.totalFreeItems
        };

        console.log('✅ الإحصائيات النهائية المحسوبة:', {
          finalStats,
          componentsValues: {
            totalOffers: offers.length,
            activeOffers,
            overallStats: {
              totalOrders: overallStats.totalOrders,
              totalDiscountAmount: overallStats.totalDiscountAmount,
              totalRevenue: overallStats.totalRevenue,
              totalFreeItems: overallStats.totalFreeItems
            }
          }
        });
        setStats(finalStats);
        
      } catch (error) {
        console.error("خطأ في حساب الإحصائيات:", error);
        // في حالة الخطأ، نعرض إحصائيات فارغة بدلاً من بيانات وهمية
        setStats({
          totalOffers: offers.length,
          activeOffers: offers.filter(offer => offer.active).length,
          totalUsage: 0,
          totalDiscount: 0,
          averageDiscount: 0,
          totalOrders: 0,
          bestPerformingOffer: null,
          expiringSoon: 0,
          totalRevenue: 0,
          totalFreeItems: 0
        });
        setDatabaseReady(false);
      } finally {
        setLoading(false);
      }
    };

    if (offers.length > 0) {
      calculateStats();
    } else {
      setLoading(false);
    }
  }, [offers]);

  const getLocalizedText = (ar: string, en: string, he: string) => {
    const language = t("language") || "ar";
    switch (language) {
      case 'en':
        return en || ar || he || "";
      case 'he':
        return he || en || ar || "";
      case 'ar':
      default:
        return ar || en || he || "";
    }
  };

  console.log('🖼️ عرض الكومبوننت مع الإحصائيات:', {
    loading,
    databaseReady,
    currentStats: stats,
    statsValues: {
      totalOffers: stats.totalOffers,
      activeOffers: stats.activeOffers,
      totalUsage: stats.totalUsage,
      totalDiscount: stats.totalDiscount,
      totalOrders: stats.totalOrders,
      totalRevenue: stats.totalRevenue,
      totalFreeItems: stats.totalFreeItems
    }
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t("overallStats") || "الإحصائيات العامة"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* تحذير في حالة عدم جاهزية قاعدة البيانات */}
        {!databaseReady && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <div className="h-4 w-4 rounded-full bg-yellow-400"></div>
              <span className="text-sm font-medium">
                تحذير: أعمدة العروض غير موجودة في قاعدة البيانات
              </span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              يرجى تشغيل ملف complete-offers-migration.sql لعرض الإحصائيات الحقيقية
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* إجمالي العروض */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Gift className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalOffers}</div>
            <div className="text-sm text-gray-600">{t("totalOffers") || "إجمالي العروض"}</div>
          </div>

          {/* العروض النشطة */}
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.activeOffers}</div>
            <div className="text-sm text-gray-600">{t("activeOffers") || "العروض النشطة"}</div>
          </div>

          {/* إجمالي الاستخدامات */}
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <ShoppingCart className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{stats.totalUsage}</div>
            <div className="text-sm text-gray-600">{t("totalUsage") || "إجمالي الاستخدامات"}</div>
          </div>

          {/* إجمالي الخصم */}
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="h-6 w-6 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {stats.totalDiscount.toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">{t("totalSavings") || "إجمالي التوفير"}</div>
          </div>
        </div>

        {/* معلومات إضافية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* أفضل عرض أداءً */}
          {stats.bestPerformingOffer && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">
                  {t("bestPerformingOffer") || "أفضل عرض أداءً"}
                </span>
              </div>
              <div className="text-sm">
                <div className="font-medium">
                  {getLocalizedText(
                    stats.bestPerformingOffer.title_ar,
                    stats.bestPerformingOffer.title_en,
                    stats.bestPerformingOffer.title_he
                  )}
                </div>
                <div className="text-gray-600">
                  {stats.bestPerformingOffer.stats?.totalOrders || 0} {t("usages") || "استخدام"}
                </div>
              </div>
            </div>
          )}

          {/* العروض التي تنتهي قريباً */}
          {stats.expiringSoon > 0 && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-800">
                  {t("expiringSoon") || "تنتهي قريباً"}
                </span>
              </div>
              <div className="text-sm">
                <div className="text-2xl font-bold text-red-600">{stats.expiringSoon}</div>
                <div className="text-gray-600">
                  {t("offersExpireWithinWeek") || "عرض ينتهي خلال أسبوع"}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* متوسط الخصم */}
        {stats.averageDiscount > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {t("averageDiscount") || "متوسط الخصم"}
              </span>
              <Badge variant="outline" className="bg-white">
                {stats.averageDiscount.toFixed(2)} {t("currency")}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OfferSummaryStats;
