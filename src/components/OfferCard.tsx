import React, { useState } from "react";
import { Percent, Calendar, ShoppingCart, Gift } from "lucide-react";
import LazyImage from "@/components/LazyImage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useLanguage } from "@/utils/languageContextUtils";
import { useCart } from "@/hooks/useCart";
import { useProductsRealtime } from "@/hooks/useProductsRealtime";
import type { Database } from "@/integrations/supabase/types";
import type { Product } from "@/types";
import { mapProductFromDb } from "@/types/mapProductFromDb";
import { toDisplayVariantText } from "@/utils/variantUtils";

interface OfferCardProps {
  offer: Database["public"]["Tables"]["offers"]["Row"];
  showFullTitle?: boolean;
  showDescriptionWithReadMore?: boolean;
  equalHeight?: boolean;
}

const OfferCard: React.FC<OfferCardProps> = ({
  offer,
  showFullTitle,
  showDescriptionWithReadMore,
  equalHeight,
}) => {
  const { t, language } = useLanguage();
  const { addToCart, getCartItem } = useCart();
  const { products: productsData } = useProductsRealtime();
  const [showDetails, setShowDetails] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // Helpers
  const renderVariantOptionNames = (productRow: any) => {
    const opts = Array.isArray(productRow?.options) ? productRow.options : [];
    if (!opts.length) return null;
    const names = opts
      .map((o: any) => toDisplayVariantText(o?.name, language as any))
      .filter((v: any) => !!v && String(v).trim().length > 0);
    if (!names.length) return null;
    return (
      <div className="text-xs text-gray-500 mt-1">
        {t("options") || "الخيارات"}: {names.join("، ")}
      </div>
    );
  };

  const chooseDefaultVariant = (productRow: any) => {
    const variants = Array.isArray(productRow?.variants) ? productRow.variants : [];
    if (!variants.length) return null;
    // Prefer active and in stock
    const byStock = variants.find((v: any) => (v?.active ?? true) && (v?.stock_quantity ?? 0) > 0) || variants[0];
    return {
      variantId: String(byStock.id),
      optionValues: byStock.option_values || {},
    } as { variantId: string; optionValues: Record<string, string> };
  };

  const handleGetOffer = async () => {
    try {
      const type = (offer as any).offer_type;
      if (type !== "buy_get") {
        // حالياً ندعم زر احصل على العرض لعروض اشتري واحصل فقط
        setShowDetails(false);
        return;
      }

      const buyQty: number = (offer as any).buy_quantity || 1;
      const linked = productsData?.find(p => p.id === (offer as any).linked_product_id);
      const target = productsData?.find(p => p.id === (offer as any).get_product_id);
      if (!linked) return;

      const linkedMapped: Product = mapProductFromDb(linked as any);
      if ((linked as any)?.has_variants) {
        const chosen = chooseDefaultVariant(linked);
        await addToCart(linkedMapped, buyQty, { variantId: chosen?.variantId, selectedVariant: chosen?.optionValues });
      } else {
        await addToCart(linkedMapped, buyQty);
      }

  // أضف المنتج المستهدف فقط إذا كان خصم (percentage/fixed). في حالة "مجاني" لا نضيفه حتى لا يتكرر كمدفوع ومجاني.
  const getType: string = (offer as any).get_discount_type || "free";
  if (target && getType !== "free") {
        const targetMapped: Product = mapProductFromDb(target as any);
        if ((target as any)?.has_variants) {
          const chosenT = chooseDefaultVariant(target);
          await addToCart(targetMapped, 1, { variantId: chosenT?.variantId, selectedVariant: chosenT?.optionValues });
        } else {
          await addToCart(targetMapped, 1);
        }
      }

      setIsCartOpen(true);
      setShowDetails(false);
    } catch (e) {
      console.error("Error applying offer to cart:", e);
    }
  };

  // دالة لاختيار النص حسب اللغة الحالية
  const getLocalizedText = (textAr: string, textEn: string, textHe: string) => {
    switch (language) {
      case 'en':
        return textEn || textAr || textHe || "";
      case 'he':
        return textHe || textEn || textAr || "";
      case 'ar':
      default:
        return textAr || textEn || textHe || "";
    }
  };

  // دالة لتنسيق اسم المنتج حسب اللغة
  const getProductDisplayName = (product: any) => {
    if (!product) return "";
    return getLocalizedText(product.name_ar, product.name_en, product.name_he);
  };

  // الحصول على معلومات المنتجات المرتبطة
  const linkedProduct = productsData?.find(p => p.id === (offer as any).linked_product_id);
  const getProduct = productsData?.find(p => p.id === (offer as any).get_product_id);

  // تحويل بيانات العرض إلى منتج متوافق مع السلة
  function offerToProduct(
    offer: Database["public"]["Tables"]["offers"]["Row"],
  ): Product {
    return {
      id: offer.id,
      name: getLocalizedText(offer.title_ar, offer.title_en, offer.title_he),
      nameEn: offer.title_en || "",
      nameHe: offer.title_he || "",
      description: getLocalizedText(offer.description_ar, offer.description_en, offer.description_he),
      descriptionEn: offer.description_en || "",
      descriptionHe: offer.description_he || "",
      price: offer.discount_type === "fixed" 
        ? (offer.discount_amount || 0) 
        : (offer.discount_percentage || 0),
      originalPrice: undefined,
      wholesalePrice: undefined,
      image: offer.image_url,
      images: offer.image_url ? [offer.image_url] : [],
      category: "",
      inStock: true,
      rating: 0,
      reviews: 0,
      discount: offer.discount_type === "percentage" 
        ? offer.discount_percentage 
        : offer.discount_amount,
      featured: false,
      tags: [],
    };
  }

  function handleViewOffer() {
    setShowDetails(true);
  }

  return (
    <>
      <div
        className={`bg-white rounded-xl shadow-md p-4 flex flex-col transition hover:shadow-lg group relative ${
          equalHeight ? "h-full" : ""
        }`}
      >
        <div 
          className="w-full h-40 bg-center bg-contain bg-no-repeat rounded mb-4 group-hover:scale-105 transition-transform duration-200"
          style={{ backgroundImage: `url(${offer.image_url})` }}
        />
        
        {/* المحتوى الذي يمكن أن يتمدد */}
        <div className="flex flex-col flex-grow text-center">
          <h3
            className="text-xl font-bold mb-2 w-full text-center"
          >
            {getLocalizedText(offer.title_ar, offer.title_en, offer.title_he)}
          </h3>
          <p
            className={`text-gray-600 mb-2 w-full ${
              showDescriptionWithReadMore ? "" : "line-clamp-2"
            }`}
          >
            {getLocalizedText(offer.description_ar, offer.description_en, offer.description_he)}
            {showDescriptionWithReadMore && getLocalizedText(offer.description_ar, offer.description_en, offer.description_he).length > 100 && (
              <span
                className="text-primary cursor-pointer ml-2"
                onClick={() => setShowMore(!showMore)}
              >
                {showMore ? t("showLess") : t("readMore")}
              </span>
            )}
          </p>
          <div className="flex items-center justify-center gap-2 mb-2">
            {(offer as any).offer_type === "buy_get" ? (
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-bold text-blue-600">
                    {t("buyGetOffer") || "اشتري واحصل"}
                  </span>
                </div>
                <div className="text-sm text-gray-700">
                  {t("buy") || "اشتري"} {(offer as any).buy_quantity || 1} {" "}
                  {linkedProduct ? getProductDisplayName(linkedProduct) : (t("product") || "منتج")}
                  {linkedProduct && renderVariantOptionNames(linkedProduct)}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Gift className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-bold text-green-600">
                    {(offer as any).get_discount_type === "free" 
                      ? (t("getFree") || "واحصل مجاناً على") 
                      : `${t("getDiscount") || "واحصل على خصم"} ${(offer as any).get_discount_value}${(offer as any).get_discount_type === "percentage" ? "%" : " " + (t("currency") || "شيكل")}`
                    }
                  </span>
                </div>
                <div className="text-sm text-gray-700">
                  {getProduct ? getProductDisplayName(getProduct) : (t("product") || "منتج")}
                  {getProduct && renderVariantOptionNames(getProduct)}
                </div>
              </div>
            ) : (
              <span className="text-lg font-bold text-primary">
                {t("discount")}: {offer.discount_type === "percentage" 
                  ? `${offer.discount_percentage}%` 
                  : `${offer.discount_amount} ${t("currency") || "شيكل"}`
                }
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 mb-4">
            {t("validUntil")}:{" "}
            {new Date(offer.end_date).toLocaleDateString("en-US", {
              calendar: "gregory",
            })}
          </div>
        </div>

        {/* الأزرار مثبتة في الأسفل */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              handleViewOffer();
            }}
            className="w-full bg-gray-100 text-gray-900 rounded-lg py-2 font-bold hover:bg-gray-200 transition text-center block"
          >
            {t("viewOffer")}
          </button>
          {(offer as any).offer_type === "buy_get" && (
            <button
              onClick={(e) => {
                e.preventDefault();
                handleGetOffer();
              }}
              className="w-full bg-primary text-white rounded-lg py-2 font-bold hover:bg-primary/90 transition text-center block"
            >
              {t("getOffer") || "احصل على العرض"}
            </button>
          )}
        </div>
      </div>

      {/* نافذة تفاصيل العرض */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-2 text-center">
              {getLocalizedText(offer.title_ar, offer.title_en, offer.title_he)}
            </DialogTitle>
            <DialogDescription className="text-center">
              {getLocalizedText(offer.description_ar, offer.description_en, offer.description_he)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* صورة العرض */}
            {offer.image_url && (
              <div 
                className="relative h-64 bg-center bg-contain bg-no-repeat rounded-lg"
                style={{ backgroundImage: `url(${offer.image_url})` }}
              />
            )}

            {/* تفاصيل العرض */}
            <div className="space-y-4">
              {(offer as any).offer_type === "buy_get" ? (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-blue-600" />
                      <span className="text-lg font-bold text-blue-600">
                        {t("buyGetOffer") || "اشتري واحصل"}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <div className="text-sm text-blue-800 font-semibold mb-1">
                          {t("buy") || "اشتري"}
                        </div>
                        <div className="text-lg font-bold text-blue-900">
                          {(offer as any).buy_quantity || 1} × {" "}
                          {linkedProduct ? getProductDisplayName(linkedProduct) : (t("product") || "منتج")}
                        </div>
                        {linkedProduct && renderVariantOptionNames(linkedProduct)}
                      </div>
                      
                      <div className="bg-green-100 p-3 rounded-lg">
                        <div className="text-sm text-green-800 font-semibold mb-1">
                          {(offer as any).get_discount_type === "free" 
                            ? (t("getFree") || "احصل مجاناً على") 
                            : `${t("getDiscount") || "احصل على خصم"} ${(offer as any).get_discount_value}${(offer as any).get_discount_type === "percentage" ? "%" : " " + (t("currency") || "شيكل")}`
                          }
                        </div>
                        <div className="text-lg font-bold text-green-900">
                          {getProduct ? getProductDisplayName(getProduct) : (t("product") || "منتج")}
                        </div>
                        {getProduct && renderVariantOptionNames(getProduct)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-bold text-primary">
                    {offer.discount_type === "percentage" 
                      ? `${offer.discount_percentage}% ${t("discount")}` 
                      : `${offer.discount_amount} ${t("currency") || "شيكل"} ${t("discount")}`
                    }
                  </span>
                </div>
              )}

              {/* تواريخ العرض */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                {offer.start_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {t("startDate")}:{" "}
                      {new Date(offer.start_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {offer.end_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {t("validUntil")}:{" "}
                      {new Date(offer.end_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* أزرار العمل */}
            <div className="flex gap-4 pt-4">
              {(offer as any).offer_type === "buy_get" && (
                <Button onClick={handleGetOffer} className="flex-1 bg-primary hover:bg-primary/90">
                  {t("getOffer") || "احصل على العرض"}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowDetails(false)}
                className="flex-1"
              >
                {t("close")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OfferCard;
