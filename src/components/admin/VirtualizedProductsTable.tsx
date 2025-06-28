import React, { useMemo, useState } from "react";
import { useLanguage } from "../../utils/languageContextUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, Eye } from "lucide-react";
import { Product } from "@/types/product";

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
        <div className="space-y-2">
          {currentProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-center border border-gray-200 rounded-lg hover:bg-gray-50 p-3"
            >
              {/* Product Image */}
              <div className="w-16 h-16 flex-shrink-0">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={getProductName(product)}
                    className="w-full h-full object-cover rounded-md"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                    <span className="text-xs text-gray-500">لا توجد صورة</span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0 px-4">
                <p className="font-medium text-gray-900 truncate">
                  {getProductName(product)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {getCategoryName(product.category || "")}
                  </Badge>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                </div>
              </div>

              {/* Stock & Status */}
              <div className="flex items-center gap-3">                  <Badge
                    variant={
                      (product.stock_quantity ?? 0) <= 0
                        ? "destructive"
                        : (product.stock_quantity ?? 0) <= 10
                        ? "secondary"
                        : "default"
                    }
                    className="text-xs"
                  >
                    المخزون: {product.stock_quantity ?? 0}
                  </Badge>
                <Badge variant={product.active ? "default" : "secondary"} className="text-xs">
                  {product.active ? t("active") : t("inactive")}
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex gap-1 ml-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewProduct(product)}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditProduct(product)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteProduct(product.id, getProductName(product))}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              السابق
            </Button>
            
            {/* Page Numbers */}
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
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(pageNum)}
                    className="w-8 h-8 p-0"
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
            >
              التالي
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaginatedProductsTable;
