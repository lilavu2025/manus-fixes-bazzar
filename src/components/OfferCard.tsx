import React, { useState } from "react";
import { Percent, Calendar } from "lucide-react";
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
import type { Database } from "@/integrations/supabase/types";
import type { Product } from "@/types";

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
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const [showDetails, setShowDetails] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // تحويل بيانات العرض إلى منتج متوافق مع السلة
  function offerToProduct(
    offer: Database["public"]["Tables"]["offers"]["Row"],
  ): Product {
    return {
      id: offer.id,
      name: offer.title_ar || offer.title_en || "",
      nameEn: offer.title_en || "",
      nameHe: offer.title_he || "",
      description: offer.description_ar || "",
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
        className={`bg-white rounded-xl shadow-md p-4 flex flex-col items-center transition hover:shadow-lg group relative ${
          equalHeight ? "h-full" : ""
        }`}
      >
        <div 
          className="w-full h-40 bg-center bg-contain bg-no-repeat rounded mb-4 group-hover:scale-105 transition-transform duration-200"
          style={{ backgroundImage: `url(${offer.image_url})` }}
        />
        <h3
          className={`text-xl font-bold mb-2 text-center w-full ${
            showFullTitle ? "" : "truncate"
          }`}
        >
          {offer.title_ar || offer.title_en}
        </h3>
        <p
          className={`text-gray-600 mb-2 text-center w-full ${
            showDescriptionWithReadMore ? "" : "line-clamp-2"
          }`}
        >
          {offer.description_ar || offer.description_en}
          {showDescriptionWithReadMore && offer.description_ar?.length > 100 && (
            <span
              className="text-primary cursor-pointer ml-2"
              onClick={() => setShowMore(!showMore)}
            >
              {showMore ? t("showLess") : t("readMore")}
            </span>
          )}
        </p>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg font-bold text-primary">
            {t("discount")}: {offer.discount_type === "percentage" 
              ? `${offer.discount_percentage}%` 
              : `${offer.discount_amount} ${t("currency") || "شيكل"}`
            }
          </span>
        </div>
        <div className="text-sm text-gray-500 mb-4">
          {t("validUntil")}:{" "}
          {new Date(offer.end_date).toLocaleDateString("en-US", {
            calendar: "gregory",
          })}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            handleViewOffer();
          }}
          className="mt-auto w-full bg-primary text-white rounded-lg py-2 font-bold hover:bg-primary/90 transition text-center block"
        >
          {t("viewOffer")}
        </button>
      </div>

      {/* نافذة تفاصيل العرض */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-2 text-center">
              {offer.title_ar || offer.title_en}
            </DialogTitle>
            <DialogDescription className="text-center">
              {offer.description_ar || offer.description_en}
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
              <div className="flex items-center justify-center gap-2">
                <Percent className="h-6 w-6 text-primary" />
                <span className="text-2xl font-bold text-primary">
                  {offer.discount_type === "percentage" 
                    ? `${offer.discount_percentage}% ${t("discount")}` 
                    : `${offer.discount_amount} ${t("currency") || "شيكل"} ${t("discount")}`
                  }
                </span>
              </div>

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
              {/* <Button
                onClick={() => {
                  handleBuyNow();
                  setShowDetails(false);
                }}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {t("addToCart")}
              </Button> */}
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
