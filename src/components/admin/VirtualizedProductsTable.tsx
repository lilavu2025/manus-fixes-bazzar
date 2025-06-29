import React, { useMemo, useState } from "react";
import { isRTL, useLanguage } from "../../utils/languageContextUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, Eye } from "lucide-react";
import { Product } from "@/types/product";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface AdminCategory {
  id: string;
  name: string;
  nameEn?: string;
  nameHe?: string;
}

interface PaginatedProductsTableProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string, productName: string) => void;
  categories?: AdminCategory[];
}

const ITEMS_PER_PAGE = 20; // عرض 20 منتج في كل صفحة

const PaginatedProductsTable: React.FC<PaginatedProductsTableProps> = ({
  products,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
  categories = [],
}) => {
  const { t, language } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // دالة لجلب اسم المنتج حسب اللغة
  const getProductName = (product: Product) => {
    if (language === "ar") return product.name;
    if (language === "en") return product.nameEn || product.name;
    if (language === "he") return product.nameHe || product.name;
    return product.name;
  };

  // دالة لجلب اسم الفئة من id مع دعم التعدد اللغوي
  const getCategoryName = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return categoryId;
    if (language === "ar") return cat.name;
    if (language === "en") return cat.nameEn || cat.name;
    if (language === "he") return cat.nameHe || cat.name;
    return cat.name;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // حساب pagination
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = products.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-500">{t("noProducts")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{t("products")} ({products.length})</span>
          <span className="text-sm text-gray-500">
            صفحة {currentPage} من {totalPages}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Products Grid */}
        <div className="space-y-3 divide-y divide-gray-100">
          {currentProducts.map((product) => (
            <div
              key={product.id}
              className="flex flex-col sm:flex-row items-center sm:items-stretch bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all p-4 gap-4 sm:gap-6 relative overflow-hidden"
            >
              {/* Product Image */}
              <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center bg-gray-50 rounded-lg border">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={getProductName(product)}
                    className="w-full h-full object-cover rounded-lg"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-xs text-gray-400">{t("noImage")}</span>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-bold text-lg text-gray-800 truncate max-w-[180px]">{getProductName(product)}</span>
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">{getCategoryName(product.category || "")}</Badge>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">{formatPrice(product.price)}</Badge>
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">{t("salesCount")}: {product.sales_count ?? 0}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span>{t("stockQuantity")}: <span className="font-semibold text-gray-700">{product.stock_quantity ?? 0}</span></span>
                  <span>{t("status")}: <span className={product.active ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{product.active ? t("active") : t("inactive")}</span></span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-row gap-2 items-center mt-4 sm:mt-0 sm:ml-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => onViewProduct(product)}
                  aria-label={t("view")}
                >
                  <Eye className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-green-200 text-green-700 hover:bg-green-50"
                  onClick={() => onEditProduct(product)}
                  aria-label={t("edit")}
                >
                  <Edit className="h-5 w-5" />
                </Button>
                <AlertDialog open={deleteDialogOpen && productToDelete?.id === product.id} onOpenChange={(open) => {
                  setDeleteDialogOpen(open);
                  if (!open) setProductToDelete(null);
                }}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setProductToDelete(product);
                        setDeleteDialogOpen(true);
                      }}
                      aria-label={t("delete")}
                    >
                      <Trash className="h-5 w-5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-md mx-auto rounded-xl p-6">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-lg font-bold text-red-700 text-center">{t("deleteProduct")}</AlertDialogTitle>
                      <AlertDialogDescription className="text-center text-gray-600">
                        {t("deleteProductConfirmation")}<br />
                        <span className="font-bold text-gray-900">"{getProductName(product)}"</span>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex justify-center gap-4 mt-4">
                      <AlertDialogCancel className="rounded-lg px-4 py-2 bg-gray-100 text-gray-700 font-bold hover:bg-gray-200">{t("cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        className="rounded-lg px-4 py-2 bg-red-600 text-white font-bold hover:bg-red-700"
                        onClick={() => {
                          if (productToDelete) {
                            onDeleteProduct(productToDelete.id, getProductName(productToDelete));
                            setDeleteDialogOpen(false);
                            setProductToDelete(null);
                          }
                        }}
                      >
                        {t("delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-wrap justify-center items-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-lg"
            >
              {t("prev")}
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                if (pageNum < 1 || pageNum > totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(pageNum)}
                    className={`w-8 h-8 p-0 rounded-lg ${currentPage === pageNum ? 'bg-blue-600 text-white' : ''}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-lg"
            >
              {t("next")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaginatedProductsTable;
