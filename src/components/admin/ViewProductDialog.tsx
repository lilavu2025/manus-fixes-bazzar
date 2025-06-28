import React from "react";
import { useLanguage } from "../../utils/languageContextUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AdminProductForm } from "@/types/product";
import { useCategoriesRealtime } from "@/hooks/useCategoriesRealtime";
import ProductImageGallery from "@/components/ProductImageGallery";
import { getDisplayPrice } from "@/utils/priceUtils";
import { useAuth } from "@/contexts/useAuth";

interface ViewProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: AdminProductForm;
}

const ViewProductDialog: React.FC<ViewProductDialogProps> = ({
  open,
  onOpenChange,
  product,
}) => {
  const { t, language, isRTL } = useLanguage();
  const { profile } = useAuth();
  const { categories } = useCategoriesRealtime();

  if (!product) return null;

  // Get the category name based on the current language
  let categoryName = product.category;
  const foundCategory = categories.find(
    (cat) => cat.id === product.category_id || cat.id === product.category,
  );
  if (foundCategory) {
    if (language === "ar") categoryName = foundCategory.name;
    else if (language === "en") categoryName = foundCategory.nameEn;
    else if (language === "he")
      categoryName = foundCategory.nameHe || foundCategory.name;
    else categoryName = foundCategory.name;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[95vh] overflow-y-auto p-0 sm:p-0 rounded-2xl"
        dir={isRTL ? "rtl" : "ltr"}
        style={{ direction: isRTL ? "rtl" : "ltr" }}
      >
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle className="text-2xl font-bold mb-1 text-primary text-center">
            {t("viewProduct")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col-reverse md:flex-row gap-6 md:gap-8 px-4 sm:px-6 pb-6">
          {/* معلومات المنتج */}
          <div className="flex-1 w-full space-y-6 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-4 md:pt-0 md:pl-8">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <span className="text-xs text-gray-400">ID: {product.id}</span>
                <Badge variant={product.active ? "default" : "destructive"}>
                  {product.active ? t("active") : t("inactive")}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant={product.in_stock ? "default" : "destructive"}>
                  {product.in_stock ? t("inStock") : t("outOfStock")}
                </Badge>
                {product.featured && (
                  <Badge variant="secondary">{t("featured")}</Badge>
                )}
                {typeof product.stock_quantity === "number" && (
                  <Badge variant="outline">
                    {t("stockQuantity")}: {product.stock_quantity}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  {t("productNames")}
                </h3>
                <p>
                  <strong>{t("arabic")}:</strong> {product.name_ar}
                </p>
                <p>
                  <strong>{t("english")}:</strong> {product.name_en}
                </p>
                <p>
                  <strong>{t("hebrew")}:</strong> {product.name_he}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">{t("category")}</h3>
                <p className={language === "he" ? "text-right" : "text-left"}>
                  {categoryName}
                </p>
              </div>
            </div>

            {product.tags && product.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-1">{t("tags")}</h3>
                <div className="flex flex-wrap gap-2 overflow-x-auto max-w-full pb-1">
                  {product.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
              <h3 className="text-lg font-semibold mb-2">
                {t("descriptions")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <strong>{t("arabic")}:</strong>
                  <p className="text-gray-600 whitespace-pre-line break-words">
                    {product.description_ar}
                  </p>
                </div>
                <div>
                  <strong>{t("english")}:</strong>
                  <p className="text-gray-600 whitespace-pre-line break-words">
                    {product.description_en}
                  </p>
                </div>
                <div>
                  <strong>{t("hebrew")}:</strong>
                  <p className="text-gray-600 whitespace-pre-line break-words">
                    {product.description_he}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
              <h3 className="text-lg font-semibold mb-2">{t("pricing")}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <strong>{t("price")}:</strong>
                  <p>
                    {getDisplayPrice(
                      {
                        ...product,
                        price: product.price,
                        name: product.name_ar || product.name_en || "",
                        nameEn: product.name_en || "",
                        nameHe: product.name_he || "",
                        description: product.description_ar || "",
                        descriptionEn: product.description_en || "",
                        descriptionHe: product.description_he || "",
                        image: product.image,
                        images: product.images,
                        category: product.category_id || product.category,
                        inStock: product.in_stock,
                        rating: 0,
                        reviews: 0,
                        discount: product.discount,
                        featured: product.featured,
                        tags: product.tags,
                        stock_quantity: product.stock_quantity,
                        active: product.active,
                        created_at: product.created_at,
                      },
                      profile?.user_type,
                    )}{" "}
                    {t("currency")}
                  </p>
                </div>
                {product.original_price && (
                  <div>
                    <strong>{t("originalPrice")}:</strong>
                    <p>
                      {product.original_price} {t("currency")}
                    </p>
                  </div>
                )}
                {product.wholesale_price && (
                  <div>
                    <strong>{t("wholesalePrice")}:</strong>
                    <p>
                      {product.wholesale_price} {t("currency")}
                    </p>
                  </div>
                )}
                {typeof product.discount !== "undefined" &&
                  product.discount !== null && (
                    <div>
                      <strong>{t("discount")}:</strong>
                      <p>{product.discount}%</p>
                    </div>
                  )}
              </div>
            </div>

            {product.created_at && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
                <h3 className="text-lg font-semibold mb-1">
                  {t("createdAt") || "تاريخ الإضافة"}
                </h3>
                <p className="text-gray-700">
                  {new Date(product.created_at).toLocaleString(
                    "en-US",
                    { 
                      calendar: 'gregory',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }
                  )}
                </p>
              </div>
            )}
          </div>

          {/* معرض صور احترافية */}
          <div className="w-full md:w-1/2 flex flex-col items-center md:items-start">
            <ProductImageGallery
              product={{
                id: product.id || '',
                name: product.name_ar || product.name_en || "",
                nameEn: product.name_en || "",
                nameHe: product.name_he || "",
                description: product.description_ar || "",
                descriptionEn: product.description_en || "",
                descriptionHe: product.description_he || "",
                price: product.price || 0,
                originalPrice: product.original_price,
                wholesalePrice: product.wholesale_price,
                image: product.image || '',
                images: product.images || [],
                category: product.category_id || product.category || '',
                inStock: product.in_stock || false,
                rating: 0,
                reviews: 0,
                discount: product.discount,
                featured: product.featured || false,
                tags: product.tags,
                active: product.active,
                created_at: product.created_at,
              }}
            />
          </div>
        </div>

        <DialogFooter className="px-4 sm:px-6 pb-4 sm:pb-6 sticky bottom-0 bg-white dark:bg-gray-900 z-10">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewProductDialog;
