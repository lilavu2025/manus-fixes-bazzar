import React from "react";
import { isRTL, useLanguage } from "../../utils/languageContextUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, Eye, MoreVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Product } from "@/types/product";
import { getDisplayPrice } from "@/utils/priceUtils";
import { useAuth } from "@/contexts/useAuth";

interface AdminCategory {
  id: string;
  name: string;
  nameEn?: string;
  nameHe?: string;
}

interface AdminProductsTableProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string, productName: string) => void;
  categories?: AdminCategory[]; // دعم جميع الحقول اللغوية
}

const AdminProductsTable: React.FC<AdminProductsTableProps> = ({
  products,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
  categories = [], // افتراضي مصفوفة فارغة
}) => {
  const { t, language } = useLanguage();
  const { profile } = useAuth();

  const [sortConfig, setSortConfig] = React.useState<{
    key: string;
    direction: "asc" | "desc" | "default";
  }>({
    key: "",
    direction: "default",
  });

  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  // دالة لجلب اسم المنتج حسب اللغة
  const getProductName = (product: Product) => {
    if (language === "ar") return product.name;
    if (language === "en") return product.nameEn || product.name;
    if (language === "he") return product.nameHe || product.name;
    return product.name;
  };

  // دالة لجلب اسم الفئة من id مع دعم التعدد اللغوي والفولباك للعربي
  const getCategoryName = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return categoryId;
    if (language === "ar") return cat.name;
    if (language === "en") return cat.nameEn || cat.name;
    if (language === "he") return cat.nameHe || cat.name;
    return cat.name;
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      let direction: "asc" | "desc" | "default" = "asc";
      if (prev.key === key && prev.direction === "asc") {
        direction = "desc";
      } else if (prev.key === key && prev.direction === "desc") {
        direction = "default";
      }
      return { key, direction };
    });
  };

  const sortedProducts = React.useMemo(() => {
    if (sortConfig.direction === "default") return products;
    const sorted = [...products].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key])
        return sortConfig.direction === "asc" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key])
        return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [products, sortConfig]);

  const toggleDropdown = (productId: string) => {
    setOpenDropdown((prev) => (prev === productId ? null : productId));
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("products")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader className="text-center">
            <TableRow>
              <TableHead
                className="text-center cursor-pointer"
                onClick={() => handleSort("image")}
              >
                {t("productImage")}
              </TableHead>
              <TableHead
                className="text-center cursor-pointer"
                onClick={() => handleSort("name")}
              >
                {t("productName")}
              </TableHead>
              <TableHead
                className="text-center cursor-pointer"
                onClick={() => handleSort("category")}
              >
                {t("category")}
              </TableHead>
              <TableHead
                className="text-center cursor-pointer"
                onClick={() => handleSort("price")}
              >
                {t("price")}
              </TableHead>
              <TableHead
                className="text-center cursor-pointer"
                onClick={() => handleSort("stock_quantity")}
              >
                {t("stockQuantity")}
              </TableHead>
              <TableHead
                className="text-center cursor-pointer"
                onClick={() => handleSort("sales_count")}
              >
                {t("salesCount")}
              </TableHead>
              <TableHead
                className="text-center cursor-pointer"
                onClick={() => handleSort("inStock")}
              >
                {t("inStock")}
              </TableHead>
              <TableHead
                className="text-center cursor-pointer"
                onClick={() => handleSort("active")}
              >
                {t("status")}
              </TableHead>
              <TableHead className="text-center">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="w-16 h-16 rounded-lg border shadow-sm bg-white mx-auto">
                    <div
                      className="w-full h-full bg-center bg-contain bg-no-repeat rounded-lg"
                      style={{ 
                        backgroundImage: `url(${product.image || "/placeholder.svg"})` 
                      }}
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium max-w-[200px]">
                  <div className="product-name">
                    {getProductName(product)}
                  </div>
                </TableCell>
                <TableCell>{getCategoryName(product.category)}</TableCell>
                <TableCell>
                  {getDisplayPrice(product, profile?.user_type)} {t("currency")}
                </TableCell>
                <TableCell>{product.stock_quantity || 0}</TableCell>
                <TableCell>{product.sales_count || 0}</TableCell>
                <TableCell>
                  <Badge variant={product.inStock ? "default" : "destructive"}>
                    {product.inStock ? t("inStock") : t("outOfStock")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={product.active ? "default" : "destructive"}>
                    {product.active ? t("active") : t("inactive")}
                  </Badge>
                </TableCell>
                <TableCell className="relative">
                  <div className="inline-block">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleDropdown(product.id)}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>

                    {openDropdown === product.id && (
                      <div
                        ref={dropdownRef}
                        className={`absolute top-1/2 -translate-y-1/2 ${
                          isRTL ? "left-0" : "right-0"
                        } w-20 bg-white border rounded-md shadow-xl z-50 animate-fade-in`}
                      >
                        <div className="py-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewProduct(product)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100"
                          >
                            <Eye className="h-4 w-4 mr-2" /> {t("view")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditProduct(product)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100"
                          >
                            <Edit className="h-4 w-4 mr-2" /> {t("edit")}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 hover:text-red-700"
                              >
                                <Trash className="h-4 w-4 mr-2" /> {t("delete")}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle
                                  className={isRTL ? "text-right" : "text-left"}
                                >
                                  {t("deleteProduct")}
                                </AlertDialogTitle>
                                <AlertDialogDescription
                                  className={isRTL ? "text-right" : "text-left"}
                                >
                                  {t("deleteProductConfirmation")} "{product.name}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="gap-2">
                                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    onDeleteProduct(product.id, product.name)
                                  }
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {t("delete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )}
                  </div>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AdminProductsTable;
