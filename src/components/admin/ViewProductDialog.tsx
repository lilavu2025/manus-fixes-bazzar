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
import { useProductOptions, useProductVariants } from "@/hooks/useVariantsAPI";

interface ViewProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: AdminProductForm;
  onRequestEdit?: () => void; // فتح نافذة التعديل من نافذة العرض
  onRequestVariants?: () => void; // فتح إدارة الفيرنتس من نافذة العرض
}

const ViewProductDialog: React.FC<ViewProductDialogProps> = ({
  open,
  onOpenChange,
  product,
  onRequestEdit,
  onRequestVariants,
}) => {
  const { t, language, isRTL } = useLanguage();
  const { categories } = useCategoriesRealtime();
  const { data: options = [] } = useProductOptions(product?.id || "");
  const { data: variants = [] } = useProductVariants(product?.id || "");

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

              {/* Compact Variants Summary */}
              {(product.has_variants || (variants && variants.length > 0)) && (
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border" dir={isRTL ? 'rtl' : 'ltr'}>
                  <h3 className="text-lg font-semibold mb-3">{t('variants')}</h3>
                  {variants && variants.length > 0 ? (
                    <>
                      {/* Metrics row */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge variant="secondary" className="px-2 py-1 text-xs">
                          {t('variants')}: {variants.length}
                        </Badge>
                        <Badge variant="outline" className="px-2 py-1 text-xs">
                          {t('stockQuantity')}: {variants.reduce((sum, v) => sum + (v.stock_quantity ?? 0), 0)}
                        </Badge>
                        {(() => {
                          const inStock = variants.filter(v => (v.stock_quantity ?? 0) > 0).length;
                          const outStock = variants.length - inStock;
                          return (
                            <>
                              <Badge variant="outline" className="px-2 py-1 text-xs text-green-700">
                                {t('inStock')}: {inStock}
                              </Badge>
                              <Badge variant="outline" className="px-2 py-1 text-xs text-red-700">
                                {t('outOfStock')}: {outStock}
                              </Badge>
                            </>
                          );
                        })()}
                      </div>

                      {/* Sample chips of variants (first 4) */}
                      <div className="flex flex-wrap gap-2">
                        {variants.slice(0, 4).map(v => {
                          const attrs = v.option_values || {} as Record<string, string>;
                          const label = Object.entries(attrs)
                            .map(([k, val]) => `${k}: ${val}`)
                            .join(' · ');
                          return (
                            <div key={v.id} className="text-xs bg-gray-50 dark:bg-gray-800 border rounded px-2 py-1">
                              <span className="font-medium">{label || '—'}</span>
                              <span className={isRTL ? 'mr-2' : 'ml-2'}>
                                • {t('stockQuantity')}: {v.stock_quantity ?? 0}
                              </span>
                            </div>
                          );
                        })}
                        {variants.length > 4 && (
                          <Badge variant="outline" className="text-xs px-2 py-1">+{variants.length - 4}</Badge>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500">{t('noVariantsYet') || 'لا توجد فيرنتس'}</div>
                  )}
                </div>
              )}

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

          {/* Variants (options and list) */}
          {(product.has_variants || options.length > 0 || variants.length > 0) && (
            <div className="mt-6 bg-white dark:bg-gray-900 rounded-lg p-4 border" dir={isRTL ? "rtl" : "ltr"}>
              <h3 className="text-lg font-semibold mb-4">{t("variants")}</h3>

              {options.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2">{t("options")}</h4>
                  <div className="flex flex-wrap gap-3">
                    {options
                      .sort((a, b) => (a.option_position ?? 0) - (b.option_position ?? 0))
                      .map((opt) => (
                        <div key={opt.id} className="bg-gray-50 dark:bg-gray-800 rounded-md p-2">
                          <div className="text-xs text-gray-600 dark:text-gray-300 mb-1 font-medium">
                            {opt.name}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {(opt.option_values || []).map((val) => (
                              <Badge key={val} variant="outline" className="text-xs px-2 py-0.5">
                                {val}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {variants.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        <th className="px-3 py-2 text-start border-b">{t("variants")}</th>
                        <th className="px-3 py-2 text-center border-b">SKU</th>
                        <th className="px-3 py-2 text-center border-b">{t("price")}</th>
                        <th className="px-3 py-2 text-center border-b">{t("wholesalePrice")}</th>
                        <th className="px-3 py-2 text-center border-b">{t("stockQuantity")}</th>
                        <th className="px-3 py-2 text-center border-b">{t("active")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v) => {
                        const attrs = v.option_values || {};
                        const attrEntries = Object.entries(attrs);
                        return (
                          <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-3 py-2 align-top border-b">
                              <div className="text-gray-900 dark:text-gray-100">
                                {attrEntries.length > 0 ? (
                                  attrEntries.map(([k, val]) => (
                                    <div key={k}>{k}: {String(val)}</div>
                                  ))
                                ) : (
                                  "-"
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center border-b">
                              <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{v.sku || "-"}</span>
                            </td>
                            <td className="px-3 py-2 text-center border-b">
                              {(v.price ?? 0).toFixed(2)} {t("currency")}
                            </td>
                            <td className="px-3 py-2 text-center border-b">
                              {(v.wholesale_price ?? 0).toFixed(2)} {t("currency")}
                            </td>
                            <td className="px-3 py-2 text-center border-b">
                              <Badge variant={v.stock_quantity > 0 ? "secondary" : "destructive"}>
                                {v.stock_quantity ?? 0}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-center border-b">
                              <Badge variant={v.active ? "default" : "destructive"}>
                                {v.active ? t("active") : t("inactive")}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-gray-500">{t("noVariantsYet") || "لا توجد فيرنتس"}</div>
              )}
            </div>
          )}

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

        <DialogFooter className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t flex flex-col sm:flex-row gap-2 sm:gap-3 justify-between">
          <div className="flex gap-2">
            {onRequestEdit && (
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onRequestEdit();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4"
              >
                {t("edit")}
              </Button>
            )}
            {onRequestVariants && (
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onRequestVariants();
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4"
              >
                {t("manageVariants")}
              </Button>
            )}
          </div>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
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
