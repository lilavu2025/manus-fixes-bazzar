import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useCategoriesRealtime } from "@/hooks/useCategoriesRealtime";
import { useLanguage } from "@/utils/languageContextUtils";
import { getLocalizedName } from "@/utils/getLocalizedName";
import CategoryCard from "@/components/CategoryCard";
import CartSidebar from "@/components/CartSidebar";
import { ClearableInput } from "@/components/ui/ClearableInput";
import config from "@/configs/activeConfig";

const Categories: React.FC = () => {
  // يمكنك تعديل الألوان حسب الحاجة أو جلبها من config إذا كانت متوفرة
  
  const { t, isRTL, language } = useLanguage();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { primaryColor, secondaryColor } = config.visual;
  const location = useLocation();
  const navigate = useNavigate();

  const { categories, loading, error, refetch } = useCategoriesRealtime();

  // Handle URL search parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    
    if (searchParam && searchParam !== searchQuery) {
      setSearchQuery(searchParam);
    } else if (!searchParam && searchQuery) {
      setSearchQuery("");
    }
  }, [location.search, searchQuery]);

  // Handle search input changes and update URL
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    
    const params = new URLSearchParams(location.search);
    if (newQuery.trim()) {
      params.set("search", newQuery.trim());
    } else {
      params.delete("search");
    }
    navigate({ search: params.toString() }, { replace: true });
  };

  console.log("Categories page - data:", categories);
  console.log("Categories page - loading:", loading);
  console.log("Categories page - error:", error);

  // فلترة الفئات: فقط الفئات النشطة + البحث
  const filteredCategories = categories
    .filter((category) => category.active)
    .filter((category) =>
      getLocalizedName(category, language)
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );

  if (loading) {
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
    let errorMsg = t("errorLoadingData");
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message?: string }).message === "string"
    ) {
      errorMsg = (error as { message?: string }).message || errorMsg;
    }
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-red-500 text-lg">
              خطأ في تحميل الفئات: {errorMsg}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-primary text-white px-4 py-2 rounded"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gray-50 ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
      style={{ paddingTop: '2rem', paddingBottom: '2rem', paddingLeft: '1rem', paddingRight: '1rem' }}
    >
      {/* Animated Banner */}
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
        <h1 className="text-3xl font-bold mb-2">{t("categories")}</h1>
      </div>

      {/* Search Bar */}
      <div className="container mx-auto px-2 sm:px-4 mb-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 ${isRTL ? "right-3" : "left-3"}`} />
              <ClearableInput
                placeholder={t("searchCategories")}
                value={searchQuery}
                onChange={handleSearchChange}
                onClear={() => {
                  setSearchQuery("");
                  const params = new URLSearchParams(location.search);
                  params.delete("search");
                  navigate({ search: params.toString() }, { replace: true });
                }}
                className={`${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"} h-11 text-base rounded-full border-2 border-gray-200 focus:border-primary w-full`}
                aria-label={t("searchInput")}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 sm:px-4">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {searchQuery
                ? t("noCategoriesFound")
                : t("noCategoriesAvailable")}
            </p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
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
            {filteredCategories.map((category) => (
              <motion.div
                key={category.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
                transition={{ duration: 0.4 }}
              >
                <CategoryCard category={category} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Categories;
