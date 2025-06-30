import React, { useEffect, useState } from "react";
import { useOffersRealtime } from "@/hooks/useOffersRealtime";
import { useLanguage } from "@/utils/languageContextUtils";
import CartSidebar from "@/components/CartSidebar";
import OfferCard from "@/components/OfferCard";
import { Badge } from "@/components/ui/badge";
import { Percent } from "lucide-react";
import { Navigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";
import { getSetting } from "@/services/settingsService";
import config from "@/configs/activeConfig";

const Offers: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [hideOffers, setHideOffers] = useState(false);

  // استخدم hook الجديد لجلب العروض مع التحديث الفوري
  const { offers, loading: isLoading, error } = useOffersRealtime();
  const { primaryColor, secondaryColor } = config.visual;

  useEffect(() => {
    getSetting("hide_offers_page").then((val) => setHideOffers(val === "true"));
  }, []);

  // تصفية العروض حسب البحث
  const filteredOffers = offers.filter(
    (offer: Database["public"]["Tables"]["offers"]["Row"]) =>
      searchQuery === "" ||
      offer.title_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.title_en?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (hideOffers) return <Navigate to="/" replace />;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">{t("error")}</h2>
          <p className="mb-4">{error.message || t("errorLoadingData")}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            {t("retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gray-50 ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h1 className="text-3xl font-bold">{t("offers")}</h1>
            <Percent className="h-8 w-8 text-primary" />
          </div>
          <p className="text-gray-600 mb-6">{t("specialOffers")}</p>
          {filteredOffers.length > 0 && (
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {filteredOffers.length} {t("offers")}
            </Badge>
          )}
        </div>

        {/* Special Offers Banner */}
        {!searchQuery && (
          <div
            className="rounded-xl p-8 text-white text-center mb-8"
            style={{
              background: `linear-gradient(to left, ${primaryColor}, ${secondaryColor})`,
            }}
          >
            <h2 className="text-2xl font-bold mb-2">
              {t("limitedTimeOffers")}
            </h2>
            <p className="text-lg opacity-90">{t("dontMissOut")}</p>
          </div>
        )}

        {/* Offers Grid */}
        {filteredOffers.length === 0 ? (
          <div className="text-center py-12">
            <Percent className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("noOffersAvailable")}
            </h3>
            <p className="text-gray-500">{t("checkBackLater")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredOffers.map(
              (offer: Database["public"]["Tables"]["offers"]["Row"]) => (
                <OfferCard key={offer.id} offer={offer} />
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Offers;
