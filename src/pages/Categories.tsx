import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
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
        className="rounded-xl p-8 text-white text-center mb-10"
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

      <div className="container mx-auto px-2 sm:px-4">
        {/* Advanced Search Bar & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex-1 flex items-center gap-2">
            <ClearableInput
              type="text"
              className={`w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:ring-2 focus:ring-primary focus:border-primary transition ${
                isRTL ? "pr-8" : "pl-8"
              }`}
              placeholder={t("searchCategories")}
              value={searchQuery}
              onChange={handleSearchChange}
              onClear={() => {
                setSearchQuery("");
                const params = new URLSearchParams(location.search);
                params.delete("search");
                navigate({ search: params.toString() }, { replace: true });
              }}
            />
          </div>
        </div>

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
