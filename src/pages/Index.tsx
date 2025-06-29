import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import BannerCarousel from "@/components/BannerCarousel";
import CategoryCard from "@/components/CategoryCard";
import CartSidebar from "@/components/CartSidebar";
import { Button } from "@/components/ui/button";
import { useBanners } from "@/hooks/useSupabaseData";
import { useCategoriesRealtime } from "@/hooks/useCategoriesRealtime";
import { useProductsRealtime } from "@/hooks/useProductsRealtime";
import { useLanguage } from "@/utils/languageContextUtils";
import { getLocalizedName } from "@/utils/getLocalizedName";
import { mapProductFromDb } from "@/types/mapProductFromDb";
import type { Banner as SupabaseBanner } from "@/integrations/supabase/dataFetchers";
import type { Banner as AppBanner, Product } from "@/types/index";
import TopOrderedProducts from "@/components/TopOrderedProducts";
import { fetchTopOrderedProducts } from "@/integrations/supabase/dataSenders";

interface IndexProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const Index = ({ searchQuery, setSearchQuery }: IndexProps) => {
  const { t, isRTL, language } = useLanguage();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [topOrdered, setTopOrdered] = useState<Product[]>([]);

  const { data: bannersData } = useBanners();
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategoriesRealtime();
  const {
    products: productsRaw,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useProductsRealtime();
  const banners: AppBanner[] = (bannersData ?? []).map(
    (b: SupabaseBanner): AppBanner => ({
      id: b.id,
      title: b.title_en || b.title_ar || "",
      subtitle: b.subtitle_en || b.subtitle_ar || "",
      image: b.image,
      link: b.link,
      active: b.active,
    }),
  );
  const products: Product[] = Array.isArray(productsRaw)
    ? productsRaw.map(mapProductFromDb)
    : [];

  // المنتجات المميزة للصفحة الرئيسية فقط (حد أقصى 4)
  const featuredHome = products.filter((product) => product.featured && product.active !== false).slice(0, 4);

  const filteredProducts = products.filter((product) => {
    if (searchQuery === "") return true;
    const q = searchQuery.toLowerCase();
    return (
      (product.name && product.name.toLowerCase().includes(q)) ||
      (product.nameEn && product.nameEn.toLowerCase().includes(q)) ||
      (product.nameHe && product.nameHe.toLowerCase().includes(q))
    );
  });
  const displayProducts = searchQuery ? filteredProducts : featuredHome;

  useEffect(() => {
    console.log("[Index] mounted at", new Date().toISOString());
    fetchTopOrderedProducts().then((data) => {
      const mapped = Array.isArray(data) ? data.map(mapProductFromDb) : [];
      setTopOrdered(mapped.filter((p) => p.active !== false).slice(0, 4));
    });
    return () => {
      console.log("[Index] unmounted at", new Date().toISOString());
    };
  }, []);

  const productsErrorMsg = "";
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

  return (
    <div
      className={`min-h-screen bg-gray-50 ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCartClick={() => setIsCartOpen(true)}
        onMenuClick={() => {}}
      /> */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Banner */}
        {!searchQuery && banners.length > 0 && (
          <section className="mb-12">
            <BannerCarousel banners={banners} />
          </section>
        )}

        {/* Search Results */}
        {searchQuery && (
          <section className="mb-8 bg-white/80 rounded-xl p-4 shadow-sm">
            <h2 className="text-2xl font-bold mb-6">
              {t("searchResults")} "{searchQuery}"
            </h2>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">{t("noProductsFound")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product as import("@/types/product").Product}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Categories */}
        {!searchQuery && (
          <section className="mb-12 bg-white/80 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{t("categories")}</h2>
              <Button
                asChild
                variant="outline"
                className="font-bold border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <Link to="/categories" aria-label={t("viewAllCategories")}>{t("viewAllCategories")}</Link>
              </Button>
            </div>
            {categoriesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg p-4 animate-pulse"
                  >
                    <div className="h-20 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : categoriesError ? (
              <div className="text-center py-8">
                <p className="text-red-500">
                  {t("errorLoadingCategories")}: {categoriesErrorMsg}
                </p>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">{t("noCategoriesAvailable")}</p>
              </div>
            ) : (
              <>
                {/* الفئات: 3 فقط على الشاشات الصغيرة، 6 على الشاشات الكبيرة */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {categories
                    .filter((c) => c.active)
                    .slice(0, 6)
                    .map((category, idx) => {
                      // على الشاشات الصغيرة، اعرض فقط أول 3
                      if (window.innerWidth < 768 && idx >= 3) return null;
                      return <CategoryCard key={category.id} category={category} />;
                    })}
                </div>
                {/* زر عرض كل الفئات أسفل الكروت على الشاشات الصغيرة فقط */}
                <div className="mt-4 block md:hidden">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full font-bold border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    <Link to="/categories" aria-label={t("viewAllCategories")}>{t("viewAllCategories")}</Link>
                  </Button>
                </div>
              </>
            )}
          </section>
        )}

        {/* زر عرض جميع المنتجات على الشاشات الصغيرة فقط */}
        {!searchQuery && (
          <section className="bg-white/80 rounded-xl p-4 shadow-sm mb-4 block md:hidden">
            <div className="mb-4 block md:hidden mb-6 items-center justify-between">
              <h2 className="text-2xl font-bold">{t("allProducts")}</h2>
              <Button
                asChild
                variant="outline"
                className="w-full font-bold border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <Link to="/products" aria-label={t("viewAllProducts")}>{t("viewAllProducts")}</Link>
              </Button>
            </div>
          </section>
        )}

        {/* Top Ordered Products */}
        {!searchQuery && (
          <section className="bg-white/80 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{t("topOrderedProducts")}</h2>
              <div className="hidden md:block">
                <Button
                  asChild
                  variant="outline"
                  className="font-bold border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                  <Link to="/products?topOrdered=1" aria-label={t("viewAll")}>{t("viewAll")}</Link>
                </Button>
              </div>
            </div>
            {topOrdered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">{t("noTopSellingProducts")}</p>
                <Button asChild className="mt-4">
                  <Link to="/products" aria-label={t("viewAll")}>
                    {t("viewAll")}
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {topOrdered.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {/* زر عرض الكل أسفل الكروت على الشاشات الصغيرة فقط */}
                <div className="mt-4 block md:hidden">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full font-bold border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    <Link to="/products?topOrdered=1" aria-label={t("viewAll")}>{t("viewAll")}</Link>
                  </Button>
                </div>
              </>
            )}
          </section>
        )}

        {/* Featured Products */}
        {!searchQuery && (
          <section className="bg-white/80 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{t("featuredProducts")}</h2>
              <div className="hidden md:block">
                <Button
                  asChild
                  variant="outline"
                  className="font-bold border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                  <Link to="/products?featured=1" aria-label={t("viewAll")}>{t("viewAll")}</Link>
                </Button>
              </div>
            </div>
            {featuredHome.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">{t("noFeaturedProducts")}</p>
                <Button asChild className="mt-4">
                  <Link to="/products" aria-label={t("browseAllProducts")}>{t("browseAllProducts")}</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {featuredHome.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {/* زر عرض الكل أسفل الكروت على الشاشات الصغيرة فقط */}
                <div className="mt-4 block md:hidden">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full font-bold border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    <Link to="/products?featured=1" aria-label={t("viewAll")}>{t("viewAll")}</Link>
                  </Button>
                </div>
              </>
            )}
          </section>
        )}
      </main>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Index;
