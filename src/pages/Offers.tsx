import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useOffersRealtime } from "@/hooks/useOffersRealtime";
import { useLanguage } from "@/utils/languageContextUtils";
import { useLocation, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import CartSidebar from "@/components/CartSidebar";
import OfferCard from "@/components/OfferCard";
import { Badge } from "@/components/ui/badge";
import { ClearableInput } from "@/components/ui/ClearableInput";
import { Percent } from "lucide-react";
import { Navigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";
import { getSetting } from "@/services/settingsService";
import config from "@/configs/activeConfig";

const Offers: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [hideOffers, setHideOffers] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { offers, loading: isLoading, error } = useOffersRealtime();
  const { primaryColor, secondaryColor } = config.visual;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    getSetting("hide_offers_page").then((val) =>
      setHideOffers(val === "true")
    );
  }, []);

  // Handle search change and update URL
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const params = new URLSearchParams(location.search);
    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
    }
    const newSearch = params.toString();
    const newPath = newSearch ? `${location.pathname}?${newSearch}` : location.pathname;
    navigate(newPath, { replace: true });
  };

  // Handle URL search parameter on component mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [location.search]);

  const filteredOffers = offers.filter(
    (offer: Database["public"]["Tables"]["offers"]["Row"]) => {
      if (debouncedSearchQuery === "") return true;
      
      const searchLower = debouncedSearchQuery.toLowerCase().trim();
      const titleAr = offer.title_ar?.toLowerCase() || "";
      const titleEn = offer.title_en?.toLowerCase() || "";
      const descriptionAr = offer.description_ar?.toLowerCase() || "";
      const descriptionEn = offer.description_en?.toLowerCase() || "";
      
      return titleAr.includes(searchLower) ||
             titleEn.includes(searchLower) ||
             descriptionAr.includes(searchLower) ||
             descriptionEn.includes(searchLower);
    }
  );

  if (hideOffers) return <Navigate to="/" replace />;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-3 text-sm">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center text-muted-foreground max-w-md">
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
          <h2 className="text-xl font-semibold mb-2">{t("error")}</h2>
          <p className="mb-4 text-sm">{error.message || t("errorLoadingData")}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
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
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        

        {/* Animated Banner */}
        {!debouncedSearchQuery && (
  <div
    className="rounded-xl p-1 text-white text-center mb-2"
    style={{
      backgroundImage: `linear-gradient(270deg, ${primaryColor}, ${secondaryColor}, ${primaryColor})`,
      backgroundSize: "300% 300%",
      animation: "gradientBG 6s ease infinite",
    }}
  >
    <style>
      {`
        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}
    </style>

    <h2 className="text-2xl font-bold mb-2">{t("limitedTimeOffers")}</h2>
  </div>
)}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 ${isRTL ? "right-3" : "left-3"}`} />
                <ClearableInput
                  placeholder={t("searchOffers")}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onClear={() => handleSearchChange("")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setDebouncedSearchQuery(searchQuery);
                    }
                  }}
                  className={`${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"} h-11 text-base rounded-full border-2 border-gray-200 focus:border-primary w-full`}
                  aria-label={t("searchInput")}
                />
              </div>
            </div>
          </div>
        </div>


        {/* Offers Grid */}
        {filteredOffers.length === 0 ? (
          <div className="text-center py-20">
            <Percent className="h-14 w-14 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-1">
              {debouncedSearchQuery ? t("noSearchResults") : t("noOffersAvailable")}
            </h3>
            <p className="text-gray-500 text-sm">
              {debouncedSearchQuery ? t("tryDifferentSearch") : t("checkBackLater")}
            </p>
            {debouncedSearchQuery && (
              <button
                onClick={() => handleSearchChange("")}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
              >
                {t("clearSearch")}
              </button>
            )}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {filteredOffers.map(
              (offer: Database["public"]["Tables"]["offers"]["Row"]) => (
                <motion.div
                  key={offer.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 }
                  }}
                  transition={{ duration: 0.4 }}
                >
                  <OfferCard offer={offer} equalHeight={true} />
                </motion.div>
              )
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Offers;