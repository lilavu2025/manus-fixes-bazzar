import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import BannerCarousel from "@/components/BannerCarousel";
import CategoryCard from "@/components/CategoryCard";
import CartSidebar from "@/components/CartSidebar";
import WelcomeMessage from "@/components/WelcomeMessage";
import { Button } from "@/components/ui/button";
import { ClearableInput } from "@/components/ui/ClearableInput";
import { useBanners } from "@/hooks/useSupabaseData";
import { useCategoriesRealtime } from "@/hooks/useCategoriesRealtime";
import { useProductsRealtime } from "@/hooks/useProductsRealtime";
import { useOffersRealtime } from "@/hooks/useOffersRealtime";
import { useLanguage } from "@/utils/languageContextUtils";
import { getLocalizedName } from "@/utils/getLocalizedName";
import { mapProductFromDb } from "@/types/mapProductFromDb";
import type { Banner as SupabaseBanner } from "@/integrations/supabase/dataFetchers";
import type { Banner as AppBanner, Product } from "@/types/index";
import TopOrderedProducts from "@/components/TopOrderedProducts";
import { fetchTopOrderedProducts } from "@/integrations/supabase/dataSenders";
import config from "@/configs/activeConfig";
import { useEqualHeight } from "@/hooks/useEqualHeight";
import OfferCard from "@/components/OfferCard";

interface IndexProps {}

const Index: React.FC = () => {
  const { t, isRTL, language } = useLanguage();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [topOrdered, setTopOrdered] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Hook لضمان تساوي ارتفاع الكروت
  const gridRef = useEqualHeight();
  const gridRef2 = useEqualHeight();

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
  const { offers, loading: offersLoading, error: offersError } = useOffersRealtime();

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
  const featuredHome = products
    .filter((product) => product.featured && product.active !== false)
    .sort((a, b) => {
      if (a.inStock && !b.inStock) return -1;
      if (!a.inStock && b.inStock) return 1;
      return 0;
    })
    .slice(0, 4);

  const filteredProducts = products
    .filter((product) => {
      if (searchQuery === "") return true;
      const q = searchQuery.toLowerCase();
      return (
        (product.name && product.name.toLowerCase().includes(q)) ||
        (product.nameEn && product.nameEn.toLowerCase().includes(q)) ||
        (product.nameHe && product.nameHe.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (a.inStock && !b.inStock) return -1;
      if (!a.inStock && b.inStock) return 1;
      return 0;
    });
  const displayProducts = searchQuery ? filteredProducts : featuredHome;
  const { primaryColor, secondaryColor } = config.visual;

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
      {/* Welcome Message - يظهر دائماً عندما لا يكون هناك بحث */}
      {!searchQuery && <WelcomeMessage />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <section className="mb-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-sm border border-gray-100">
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 ${isRTL ? "right-3" : "left-3"}`} />
                <ClearableInput
                  placeholder={t("search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery("")}
                  className={`${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"} h-12 text-base rounded-full border-2 border-gray-200 focus:border-primary w-full`}
                  aria-label={t("searchInput")}
                />
              </div>
            </div>
          </div>
        </section>
        {/* Hero Banner */}
        {!searchQuery && banners.length > 0 && (
          <section className="mb-12">
            <BannerCarousel banners={banners} />
          </section>
        )}

        {/* Offers Section */}
        {!searchQuery && offers.length > 0 && (
          <section className="bg-white/80 rounded-xl p-4 shadow-sm mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{t("specialOffers")}</h2>
              <div className="hidden md:block">
                <Button
                  asChild
                  variant="outline"
                  className="font-bold py-2 px-4 rounded shadow-md transition-all duration-300 text-[hsl(var(--primary))] hover:text-[hsl(var(--secondary))] bg-white"
                >
                  <Link to="/offers" aria-label={t("viewAllOffers")}>{t("viewAll")}</Link>
                </Button>
              </div>
            </div>
            <motion.div
              ref={gridRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: {
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
            >
              {offers.map((offer) => (
                <motion.div
                  key={offer.id}
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.4 }}
                >
                  <OfferCard
                    offer={offer}
                    showFullTitle
                    showDescriptionWithReadMore
                    equalHeight
                  />
                </motion.div>
              ))}
            </motion.div>
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
              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
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
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    transition={{ duration: 0.4 }}
                  >
                    <ProductCard product={product as import("@/types/product").Product} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </section>
        )}
        {/* Categories */}
        {!searchQuery && (
          <section className="mb-12 bg-white/80 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{t("categories")}</h2>
              <div className="hidden md:block">
                <Button
                  asChild
                  variant="outline"
                  className="font-bold py-2 px-4 rounded shadow-md transition-all duration-300 text-[hsl(var(--primary))] hover:text-[hsl(var(--secondary))] bg-white"
                >
                  <Link to="/categories" aria-label={t("viewAllCategories")}>{t("viewAll")}</Link>
                </Button>
              </div>
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
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
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
                  {categories
                    .filter((c) => c.active)
                    .slice(0, 6)
                    .map((category, idx) => {
                      if (window.innerWidth < 768 && idx >= 3) return null;
                      return (
                        <motion.div
                          key={category.id}
                          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                          transition={{ duration: 0.4 }}
                        >
                          <CategoryCard category={category} />
                        </motion.div>
                      );
                    })}
                </motion.div>
                {/* زر عرض كل الفئات أسفل الكروت على الشاشات الصغيرة فقط */}
                <div className="mt-4 block md:hidden">
                  <Button
                    asChild
                    variant="outline"
                    className="font-bold py-2 px-4 rounded shadow-md transition-all duration-300 text-[hsl(var(--primary))] hover:text-[hsl(var(--secondary))] bg-white"
                  >
                    <Link to="/categories" aria-label={t("viewAllCategories")}>{t("viewAllCategories")}</Link>
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
                  className="font-bold py-2 px-4 rounded shadow-md transition-all duration-300 text-[hsl(var(--primary))] hover:text-[hsl(var(--secondary))] bg-white"
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
                <motion.div
                  ref={gridRef}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
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
                  {featuredHome.map((product) => (
                    <motion.div
                      key={product.id}
                      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                      transition={{ duration: 0.4 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </motion.div>
                {/* زر عرض الكل أسفل الكروت على الشاشات الصغيرة فقط */}
                <div className="mt-4 block md:hidden">
                  <Button
                    asChild
                    variant="outline"
                    className="font-bold py-2 px-4 rounded shadow-md transition-all duration-300 text-[hsl(var(--primary))] hover:text-[hsl(var(--secondary))] bg-white"
                  >
                    <Link to="/products?featured=1" aria-label={t("viewAll")}>{t("viewAll")}</Link>
                  </Button>
                </div>
              </>
            )}
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
                  className="font-bold py-2 px-4 rounded shadow-md transition-all duration-300 text-[hsl(var(--primary))] hover:text-[hsl(var(--secondary))] bg-white"
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
                <motion.div
                  ref={gridRef2}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
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
                  {topOrdered.map((product) => (
                    <motion.div
                      key={product.id}
                      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                      transition={{ duration: 0.4 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </motion.div>
                {/* زر عرض الكل أسفل الكروت على الشاشات الصغيرة فقط */}
                <div className="mt-4 block md:hidden">
                  <Button
                    asChild
                    variant="outline"
                    className="font-bold py-2 px-4 rounded shadow-md transition-all duration-300 text-[hsl(var(--primary))] hover:text-[hsl(var(--secondary))] bg-white"
                  >
                    <Link to="/products?topOrdered=1" aria-label={t("viewAll")}>{t("viewAll")}</Link>
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
                className="font-bold py-2 px-4 rounded shadow-md transition-all duration-300 text-[hsl(var(--primary))] hover:text-[hsl(var(--secondary))] bg-white"
              >
                <Link to="/products" aria-label={t("viewAllProducts")}>{t("viewAllProducts")}</Link>
              </Button>
            </div>
          </section>
        )}

        

        
      </main>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Index;
