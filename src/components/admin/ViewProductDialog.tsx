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
import { shouldShowLanguageField, getLanguageName } from "@/utils/fieldVisibilityUtils";
import { Language } from "@/types/language";

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
        className="max-w-4xl max-h-[95vh] overflow-y-auto p-0 sm:p-0"
        dir={isRTL ? "rtl" : "ltr"}
        style={{ direction: isRTL ? "rtl" : "ltr" }}
      >
        {/* Header */}
        <DialogHeader className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b">
          <DialogTitle className="text-2xl font-bold text-primary text-center">
            {t("viewProduct")}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-6">
          {/* Product Info Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Product Images */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-center">{t("productImages")}</h3>
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

            {/* Basic Info */}
            <div className="space-y-4">
              {/* Status Badges */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                <h3 className="text-lg font-semibold mb-3">{t("status")}</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={product.active ? "default" : "destructive"} className="px-3 py-1">
                    {product.active ? t("active") : t("inactive")}
                  </Badge>
                  <Badge variant={product.in_stock ? "default" : "destructive"} className="px-3 py-1">
                    {product.in_stock ? t("inStock") : t("outOfStock")}
                  </Badge>
                  {product.featured && (
                    <Badge variant="secondary" className="px-3 py-1">{t("featured")}</Badge>
                  )}
                  {typeof product.stock_quantity === "number" && (
                    <Badge variant="outline" className="px-3 py-1">
                      {t("stockQuantity")}: {product.stock_quantity}
                    </Badge>
                  )}
                </div>
                <div className="mt-3 text-sm text-gray-500">
                  ID: {product.id}
                </div>
              </div>

              {/* Category */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                <h3 className="text-lg font-semibold mb-3">{t("category")}</h3>
                <p className="text-gray-700 font-medium">{categoryName}</p>
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                  <h3 className="text-lg font-semibold mb-3">{t("tags")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="px-2 py-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Names */}
          <div className="mt-6 bg-white dark:bg-gray-900 rounded-lg p-4 border">
            <h3 className="text-lg font-semibold mb-4">{t("productNames")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shouldShowLanguageField('ar' as Language) && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="font-medium text-blue-600 mb-1">
                    {getLanguageName('ar' as Language, language as Language)}
                  </div>
                  <p className="text-gray-800 dark:text-gray-200">{product.name_ar || "غير محدد"}</p>
                </div>
              )}
              {shouldShowLanguageField('en' as Language) && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="font-medium text-blue-600 mb-1">
                    {getLanguageName('en' as Language, language as Language)}
                  </div>
                  <p className="text-gray-800 dark:text-gray-200">{product.name_en || "Not specified"}</p>
                </div>
              )}
              {shouldShowLanguageField('he' as Language) && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="font-medium text-blue-600 mb-1">
                    {getLanguageName('he' as Language, language as Language)}
                  </div>
                  <p className="text-gray-800 dark:text-gray-200">{product.name_he || "לא צוין"}</p>
                </div>
              )}
            </div>
          </div>

          {/* Descriptions */}
          <div className="mt-6 bg-white dark:bg-gray-900 rounded-lg p-4 border">
            <h3 className="text-lg font-semibold mb-4">{t("descriptions")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shouldShowLanguageField('ar' as Language) && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="font-medium text-blue-600 mb-2">
                    {getLanguageName('ar' as Language, language as Language)}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">
                    {product.description_ar || "لا يوجد وصف"}
                  </p>
                </div>
              )}
              {shouldShowLanguageField('en' as Language) && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="font-medium text-blue-600 mb-2">
                    {getLanguageName('en' as Language, language as Language)}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">
                    {product.description_en || "No description"}
                  </p>
                </div>
              )}
              {shouldShowLanguageField('he' as Language) && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="font-medium text-blue-600 mb-2">
                    {getLanguageName('he' as Language, language as Language)}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">
                    {product.description_he || "אין תיאור"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="mt-6 bg-white dark:bg-gray-900 rounded-lg p-4 border">
            <h3 className="text-lg font-semibold mb-4">{t("pricing")}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <div className="text-sm text-green-600 dark:text-green-400 font-medium">{t("price")}</div>
                <div className="text-lg font-bold text-green-700 dark:text-green-300">
                  {product.price || 0} {t("currency")}
                </div>
              </div>
              {product.original_price && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t("originalPrice")}</div>
                  <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                    {product.original_price} {t("currency")}
                  </div>
                </div>
              )}
              {product.wholesale_price && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">{t("wholesalePrice")}</div>
                  <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {product.wholesale_price} {t("currency")}
                  </div>
                </div>
              )}
              {typeof product.discount !== "undefined" && product.discount !== null && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                  <div className="text-sm text-red-600 dark:text-red-400 font-medium">{t("discount")}</div>
                  <div className="text-lg font-bold text-red-700 dark:text-red-300">
                    {product.discount}%
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Creation Date */}
          {product.created_at && (
            <div className="mt-6 bg-white dark:bg-gray-900 rounded-lg p-4 border">
              <h3 className="text-lg font-semibold mb-3">{t("createdAt") || "تاريخ الإضافة"}</h3>
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                {new Date(product.created_at).toLocaleString(
                  "en-US",
                  { 
                    calendar: 'gregory',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }
                )}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-medium px-8"
          >
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewProductDialog;
