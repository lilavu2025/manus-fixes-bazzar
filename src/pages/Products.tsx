import React, { useState, useEffect } from "react";
import { useProductsRealtime } from "@/hooks/useProductsRealtime";
import { useCategories } from "@/hooks/useSupabaseData";
import { useLanguage } from "@/utils/languageContextUtils";
import ProductCard from "@/components/ProductCard";
import CartSidebar from "@/components/CartSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getLocalizedName } from "@/utils/getLocalizedName";
import { mapProductFromDb } from "@/types/mapProductFromDb";
import { fetchTopOrderedProducts } from "@/integrations/supabase/dataSenders";

const Products: React.FC = () => {
  const { t, isRTL, language } = useLanguage();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({
    min: "",
    max: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showTopOrdered, setShowTopOrdered] = useState(false);
  const [topOrderedProducts, setTopOrderedProducts] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  const {
    products: productsRaw,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useProductsRealtime();
  const {
    data: categoriesRaw,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories();
  const productsList = Array.isArray(productsRaw)
    ? productsRaw.map(mapProductFromDb)
    : [];
  const categories = Array.isArray(categoriesRaw) ? categoriesRaw : [];

  // عند تحميل الصفحة أو تغيير الرابط: مزامنة selectedCategory مع URL فقط عند التغيير الحقيقي
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get("category");
    const topOrderedParam = params.get("topOrdered");
    const featuredParam = params.get("featured");
    if (topOrderedParam === "1" || topOrderedParam === "true") {
      setShowTopOrdered(true);
    } else {
      setShowTopOrdered(false);
    }
    if (featuredParam === "1" || featuredParam === "true") {
      setSortBy("featured");
    } else if (sortBy === "featured") {
      setSortBy("default");
    }
    if (cat && cat !== selectedCategory) {
      setSelectedCategory(cat);
    } else if (!cat && selectedCategory !== "all") {
      setSelectedCategory("all");
    }
    // eslint-disable-next-line
  }, [location.search]);

  // عند تغيير الفئة من الـ Select: حدث الـ URL فقط إذا اختلفت القيمة
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    const params = new URLSearchParams(location.search);
    if (value === "all") {
      if (params.has("category")) {
        params.delete("category");
        navigate({ search: params.toString() }, { replace: true });
      }
    } else {
      if (params.get("category") !== value) {
        params.set("category", value);
        navigate({ search: params.toString() }, { replace: true });
      }
    }
  };

  useEffect(() => {
    if (showTopOrdered) {
      fetchTopOrderedProducts().then((data) => {
        // مرر النتائج عبر mapProductFromDb لضمان وجود inStock وstock_quantity
        const mapped = Array.isArray(data) ? data.map(mapProductFromDb) : [];
        setTopOrderedProducts(mapped);
      });
    }
  }, [showTopOrdered]);

  // تعديل الفلترة في صفحة المنتجات لعرض المنتجات المميزة فقط إذا كان featured=1
  const filteredProducts = productsList
    .filter((product) => {
      if (product.active === false) return false;
      if (showTopOrdered) return true; // سيتم الفلترة لاحقاً
      if (sortBy === "featured" || new URLSearchParams(location.search).get("featured") === "1") {
        return product.featured === true;
      }
      // فلترة حسب الفئة
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      const matchesSearch =
        getLocalizedName(product, language)
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice =
        (!priceRange.min || product.price >= Number(priceRange.min)) &&
        (!priceRange.max || product.price <= Number(priceRange.max));
      return matchesCategory && matchesSearch && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "newest":
          return 0; // Would use created_at if available
        default:
          return 0;
      }
    });

  const clearFilters = () => {
    setSelectedCategory("all");
    setSortBy("default");
    setPriceRange({ min: "", max: "" });
    setSearchQuery("");
    setShowTopOrdered(false); // إلغاء تفعيل الأكثر مبيعاً
    setTopOrderedProducts([]); // تفريغ قائمة الأكثر مبيعاً
  };

  const activeFiltersCount = [
    selectedCategory !== "all" ? selectedCategory : null,
    sortBy !== "default" ? sortBy : null,
    priceRange.min,
    priceRange.max,
  ].filter(Boolean).length;

  if (productsLoading || categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">{t("loading")}</p>
        </div>
      </div>
    );
  }

  let productsErrorMsg = t("errorLoadingData");
  if (
    typeof productsError === "object" &&
    productsError !== null &&
    "message" in productsError &&
    typeof (productsError as { message?: string }).message === "string"
  ) {
    productsErrorMsg =
      (productsError as { message?: string }).message || productsErrorMsg;
  }
  let categoriesErrorMsg = t("errorLoadingData");
  if (
    typeof categoriesError === "object" &&
    categoriesError !== null &&
    "message" in categoriesError &&
    typeof (categoriesError as { message?: string }).message === "string"
  ) {
    categoriesErrorMsg =
      (categoriesError as { message?: string }).message || categoriesErrorMsg;
  }

  if (productsError || categoriesError) {
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
          <p className="mb-4">{productsErrorMsg || categoriesErrorMsg}</p>
          <Button onClick={() => window.location.reload()}>{t("retry")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gray-50 ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* <Header onSearchChange={setSearchQuery} onCartClick={() => setIsCartOpen(true)} onMenuClick={() => { } } searchQuery={''} /> */}

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Advanced Filters & Search Bar */}
        {/* <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex-1 flex items-center gap-2">
            <Input
              type="text"
              className="w-full"
              placeholder={t('searchProducts')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
            <span className="inline-flex items-center text-xs bg-primary/10 text-primary font-semibold rounded px-2 py-1">
              {t('total')}: {productsList.length}
            </span>
            <span className="inline-flex items-center text-xs bg-gray-200 text-gray-700 font-semibold rounded px-2 py-1">
              {t('showing')}: {filteredProducts.length}
            </span>
          </div>
        </div> */}

        {/* Page Header */}
        <div className="flex flex-col sm:items-center sm:justify-between mb-4 gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t("products")}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base mt-1">
              {filteredProducts.length} {t("products")}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            {t("filters")}
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg p-4 sm:p-6 mb-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("category")}
                </label>
                <Select
                  value={selectedCategory}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("allCategories")} />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="all">{t("allCategories")}</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {getLocalizedName(category, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("sortBy")}
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("sortBy")} />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="default">{t("default")}</SelectItem>
                    <SelectItem value="newest">{t("newest")}</SelectItem>
                    <SelectItem value="price-low">{t("priceLowHigh")}</SelectItem>
                    <SelectItem value="price-high">{t("priceHighLow")}</SelectItem>
                    <SelectItem value="featured">{t("featuredProducts")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("priceRange")}
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder={t("min")}
                    value={priceRange.min}
                    onChange={(e) =>
                      setPriceRange((prev) => ({
                        ...prev,
                        min: e.target.value,
                      }))
                    }
                  />
                  <Input
                    type="number"
                    placeholder={t("max")}
                    value={priceRange.max}
                    onChange={(e) =>
                      setPriceRange((prev) => ({
                        ...prev,
                        max: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* الأكثر مبيعاً */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  الأكثر مبيعاً
                </label>
                <Button
                  variant={showTopOrdered ? "default" : "outline"}
                  className="w-full"
                  onClick={() => setShowTopOrdered((prev) => !prev)}
                >
                  {showTopOrdered
                    ? "عرض الكل"
                    : "عرض الأكثر مبيعاً"}
                </Button>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button
                  variant="destructive"
                  onClick={clearFilters}
                  className="w-full gap-2"
                  disabled={activeFiltersCount === 0}
                >
                  <X className="h-4 w-4" />
                  {t("clearFilters")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="gap-2">
                {categories.find((c) => c.id === selectedCategory)?.name}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleCategoryChange("all")}
                />
              </Badge>
            )}
            {sortBy !== "default" && (
              <Badge variant="secondary" className="gap-2">
                {t("sortBy")}: {t(sortBy)}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSortBy("default")}
                />
              </Badge>
            )}
            {(priceRange.min || priceRange.max) && (
              <Badge variant="secondary" className="gap-2">
                {priceRange.min || "0"} - {priceRange.max || "∞"}{" "}
                {t("currency")}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setPriceRange({ min: "", max: "" })}
                />
              </Badge>
            )}
          </div>
        )}

        {/* Products Grid */}
        {showTopOrdered ? (
          topOrderedProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                لا يوجد منتجات أكثر مبيعاً حالياً
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
              {topOrderedProducts.filter((product) => product.active !== false).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">{t("noProductsFound")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Products;
