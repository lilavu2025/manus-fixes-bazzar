import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, DollarSign, ShoppingCart, Target, Award, Gift } from "lucide-react";
import { useLanguage } from "@/utils/languageContextUtils";
import { OfferService, type Offer } from "@/services/offerService";
import { OfferStatsService, OfferStatistics } from "@/services/offerStatsService";

interface OfferStatsProps {
  offer: Offer;
  variant?: "card" | "inline";
}

const OfferStatsCard: React.FC<OfferStatsProps> = ({ offer, variant = "card" }) => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<OfferStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [databaseReady, setDatabaseReady] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // التحقق من جاهزية قاعدة البيانات
        const isReady = await OfferStatsService.checkDatabaseStructure();
        setDatabaseReady(isReady);

        if (isReady) {
          const offerStats = await OfferStatsService.getOfferStatistics(offer.id, '30d');
          setStats(offerStats);
        } else {
          // إذا لم تكن قاعدة البيانات جاهزة، نعرض إحصائيات فارغة
          setStats({
            totalOrders: 0,
            totalDiscountAmount: 0,
            totalRevenue: 0,
            totalFreeItems: 0,
            conversionRate: 0,
            averageOrderValue: 0
          });
        }
      } catch (error) {
        console.error("Error fetching offer stats:", error);
        setDatabaseReady(false);
        setStats({
          totalOrders: 0,
          totalDiscountAmount: 0,
          totalRevenue: 0,
          totalFreeItems: 0,
          conversionRate: 0,
          averageOrderValue: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [offer.id]);

  const getLocalizedText = (ar: string, en: string, he: string) => {
    return ar || en || he || "";
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} ${t("currency")}`;
  };

  if (loading) {
    if (variant === "inline") {
      return (
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          <div className="flex gap-4">
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      );
    }
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm">
            {getLocalizedText(offer.title_ar, offer.title_en, offer.title_he)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // العرض المضغوط للاستخدام داخل الكروت
  if (variant === "inline") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-gray-700">{t("offerStats")}</div>
          {offer.active ? (
            <Badge variant="default" className="text-xs px-2 py-0.5">
              {t("active")}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {t("inactive")}
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="font-semibold text-blue-600">{stats?.totalOrders || 0}</div>
            <div className="text-gray-600">{t("orders") || "طلبات"}</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="font-semibold text-green-600">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <div className="text-gray-600">{t("revenue") || "إيرادات"}</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded">
            <div className="font-semibold text-red-600">{formatCurrency(stats?.totalDiscountAmount || 0)}</div>
            <div className="text-gray-600">{t("saved") || "وفر"}</div>
          </div>
        </div>

        {/* مؤشر الأداء */}
        <div className="flex items-center justify-center gap-1 text-xs">
          {(stats?.totalOrders || 0) > 10 ? (
            <>
              <Award className="h-3 w-3 text-yellow-500" />
              <span className="text-yellow-600 font-medium">{t("excellent")}</span>
            </>
          ) : (stats?.totalOrders || 0) > 5 ? (
            <>
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-600 font-medium">{t("good")}</span>
            </>
          ) : (stats?.totalOrders || 0) > 0 ? (
            <>
              <Users className="h-3 w-3 text-blue-500" />
              <span className="text-blue-600 font-medium">{t("fair")}</span>
            </>
          ) : (
            <span className="text-gray-500">{t("noUsage")}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium truncate">
            {getLocalizedText(offer.title_ar, offer.title_en, offer.title_he)}
          </CardTitle>
          <Badge 
            variant={offer.active ? "default" : "secondary"}
            className="text-xs"
          >
            {offer.active ? t("active") : t("inactive")}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* تحذير في حالة عدم جاهزية قاعدة البيانات */}
        {!databaseReady && (
          <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
            ⚠️ تحتاج قاعدة البيانات للتحديث لعرض الإحصائيات
          </div>
        )}

        {/* النوع والخصم */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{t("discountType")}:</span>
          <span className="font-medium">
            {offer.discount_type === "percentage" 
              ? `${offer.discount_percentage}%`
              : formatCurrency(offer.discount_amount || 0)
            }
          </span>
        </div>

        {/* الإحصائيات */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-gray-600">{t("totalOrders")}</p>
              <p className="font-semibold text-sm">{stats?.totalOrders || 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-gray-600">{t("totalRevenue")}</p>
              <p className="font-semibold text-sm">{formatCurrency(stats?.totalRevenue || 0)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-xs text-gray-600">{t("totalDiscount")}</p>
              <p className="font-semibold text-sm">{formatCurrency(stats?.totalDiscountAmount || 0)}</p>
            </div>
          </div>

          {stats && stats.totalFreeItems > 0 && (
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs text-gray-600">{t("freeItems")}</p>
                <p className="font-semibold text-sm">{stats.totalFreeItems}</p>
              </div>
            </div>
          )}
        </div>

        {/* متوسط الخصم */}
        {(stats?.averageOrderValue || 0) > 0 && (
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <span className="text-gray-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {t("averageOrderValue")}:
            </span>
            <span className="font-medium text-green-600">
              {formatCurrency(stats?.averageOrderValue || 0)}
            </span>
          </div>
        )}

        {/* مؤشر الأداء */}
        <div className="flex items-center justify-between text-xs pt-2 border-t">
          <span className="text-gray-500">{t("performance")}:</span>
          <div className="flex items-center gap-1">
            {(stats?.totalOrders || 0) > 10 ? (
              <>
                <Award className="h-3 w-3 text-yellow-500" />
                <span className="text-yellow-600 font-medium">{t("excellent")}</span>
              </>
            ) : (stats?.totalOrders || 0) > 5 ? (
              <>
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-600 font-medium">{t("good")}</span>
              </>
            ) : (stats?.totalOrders || 0) > 0 ? (
              <>
                <Users className="h-3 w-3 text-blue-500" />
                <span className="text-blue-600 font-medium">{t("moderate")}</span>
              </>
            ) : (
              <span className="text-gray-500">{t("noUsage")}</span>
            )}
          </div>
        </div>

        {/* تواريخ العرض */}
        <div className="text-xs text-gray-500 pt-1 border-t">
          <div>{t("validFrom")}: {new Date(offer.start_date).toLocaleDateString()}</div>
          <div>{t("validTo")}: {new Date(offer.end_date).toLocaleDateString()}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfferStatsCard;
