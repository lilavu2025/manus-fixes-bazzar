import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/utils/languageContextUtils";
import { toast } from "sonner";
import CartSidebar from "@/components/CartSidebar";
import ProductImageGallery from "@/components/ProductImageGallery";
import ProductInfo from "@/components/ProductInfo";
import ProductActions from "@/components/ProductActions";
import ProductBreadcrumb from "@/components/ProductBreadcrumb";
import RelatedProducts from "@/components/RelatedProducts";
import { getLocalizedName } from "@/utils/getLocalizedName";
import type { Product } from "@/types/index";
import { useProductsRealtime } from "@/hooks/useProductsRealtime";
import { mapProductFromDb } from "@/types/mapProductFromDb";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, isRTL, language } = useLanguage();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { buyNow } = useCart();

  const { products, loading, error } = useProductsRealtime();

  // Map ProductRow[] to Product[]
  const productsArray: Product[] = Array.isArray(products)
    ? products.map(mapProductFromDb)
    : [];
  const product = productsArray.find((p) => p.id === id);

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
          <p className="mb-4">
            {error instanceof Error ? error.message : t("errorLoadingData")}
          </p>
          <Button onClick={() => window.location.reload()}>{t("retry")}</Button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t("productNotFound")}</h1>
          <Button asChild>
            <Link to="/">{t("backToHome")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const relatedProducts = product
    ? productsArray
        .filter((p) => p.category === product.category && p.id !== product.id)
        .slice(0, 4)
    : [];

  const handleBuyNow = async () => {
    if (!product.inStock) {
      toast.error(t("productOutOfStock"));
      return;
    }

    try {
      await buyNow(product, 1);
      setTimeout(() => {
        navigate("/checkout");
      }, 200);
    } catch (error) {
      console.error("Error in buy now:", error);
      toast.error(t("errorBuyingNow"));
    }
  };

  return (
    <div
      className={`min-h-screen bg-gray-50 ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* <Header onSearchChange={setSearchQuery} onCartClick={() => setIsCartOpen(true)} onMenuClick={() => {}} /> */}

      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className={`mb-3 sm:mb-4 ${isRTL ? "text-right" : "text-left"}`}>
          <ProductBreadcrumb
            productName={getLocalizedName(product, language)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
          <ProductImageGallery
            product={{
              id: product.id,
              name: getLocalizedName(product, language),
              nameEn: product.nameEn,
              nameHe: product.nameHe,
              description: product.description,
              descriptionEn: product.descriptionEn,
              descriptionHe: product.descriptionHe,
              image: product.image,
              images: product.images,
              discount: product.discount,
              inStock: product.inStock,
              price: product.price,
              originalPrice: product.originalPrice,
              created_at: product.created_at,
              category: product.category,
              rating: product.rating,
              reviews: product.reviews,
            }}
          />
          <div
            className={`space-y-4 sm:space-y-6 flex flex-col justify-start ${isRTL ? "items-end" : "items-start"}`}
          >
            <div className="w-full">
              <ProductInfo product={product} />
            </div>
            <div className="w-full">
              <ProductActions product={product} onBuyNow={handleBuyNow} />
            </div>
          </div>
        </div>

        <div className="w-full">
          <RelatedProducts products={relatedProducts} />
        </div>
      </main>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default ProductDetails;
