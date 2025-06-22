import React, { useState, useEffect } from "react";
import { useLanguage } from "../../utils/languageContextUtils";
import { useProductsRealtime } from "@/hooks/useProductsRealtime";
import { useCategories } from "@/hooks/useSupabaseData";
import { useDeleteProduct } from "@/integrations/supabase/reactQueryHooks";
import { toast } from "@/hooks/use-toast";
import AdminProductsHeader from "./AdminProductsHeader";
import AdminProductsEmptyState from "./AdminProductsEmptyState";
import AdminProductsTable from "./AdminProductsTable";
import AdminProductsDialogs from "./AdminProductsDialogs";
import AdminHeader from "./AdminHeader";
import {
  ProductWithOptionalFields,
  Product,
  AdminProductForm,
  Category,
  mapProductToFormData,
} from "../../types/productUtils";
import { mapCategoryToProductCategory } from "@/types/index";
import { BarChart3, Filter, CheckCircle, XCircle } from "lucide-react";
import { mapProductFromDb } from "@/types/mapProductFromDb";
import { Card, CardContent } from "@/components/ui/card";

const AdminProducts: React.FC = () => {
  const { t } = useLanguage();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<AdminProductForm | null>(null);
  const {
    products: productsRaw,
    loading: productsLoading,
    error: productsError,
    setProducts,
    refetch,
  } = useProductsRealtime();
  const products: ProductWithOptionalFields[] = Array.isArray(productsRaw)
    ? productsRaw.map(mapProductFromDb)
    : [];
  const { data: categoriesData } = useCategories();
  // Accept both Category[] types for now, but cast to any to avoid type error
  const categories: Category[] =
    Array.isArray(categoriesData) &&
    categoriesData.length &&
    typeof categoriesData[0] === "object" &&
    "id" in categoriesData[0]
      ? (categoriesData as Category[])
      : [];
  const productCategories = categories.map(mapCategoryToProductCategory);

  const deleteProductMutation = useDeleteProduct();
  const handleDeleteProduct = async (
    productId: string,
    productName: string,
  ) => {
    deleteProductMutation.mutate(productId);
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(mapProductToFormData(product));
    setShowViewDialog(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(mapProductToFormData(product));
    setShowEditDialog(true);
  };

  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStock, setFilterStock] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [searchName, setSearchName] = useState<string>(""); // إضافة حالة البحث بالاسم

  // إحصائيات سريعة
  const totalProducts = products.length;
  const inactiveProducts = products.filter((p) => p.active === false).length;
  const lowStockProducts = products.filter(
    (p) => p.stock_quantity && p.stock_quantity <= 5,
  ).length;

  // فلترة المنتجات
  const filteredProducts = products.filter((product) => {
    let pass = true;
    if (filterCategory !== "all" && product.category !== filterCategory)
      pass = false;
    if (filterStock === "low" && (product.stock_quantity ?? 0) > 5)
      pass = false;
    if (filterStock === "in" && !product.inStock) pass = false;
    if (filterStock === "out" && product.inStock) pass = false;
    if (filterActive === "active" && product.active === false) pass = false;
    if (filterActive === "inactive" && product.active !== false) pass = false;
    if (
      searchName.trim() &&
      !(
        product.name?.toLowerCase().includes(searchName.trim().toLowerCase()) ||
        product.nameEn?.toLowerCase().includes(searchName.trim().toLowerCase())
      )
    )
      pass = false;
    return pass;
  });

  // استقبال الفلتر من state عند الدخول من لوحة الأدمن
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.location.pathname === "/admin/products" &&
      window.history.state &&
      window.history.state.usr
    ) {
      // فلترة حسب الفئة
      if (window.history.state.usr.filterCategory) {
        const filterCategoryName = window.history.state.usr.filterCategory;
        const foundCat = productCategories.find((c) => c.name === filterCategoryName);
        if (foundCat) {
          setFilterCategory(foundCat.id);
        }
      }
      // فلترة حسب المنتج منخفض المخزون
      if (window.history.state.usr.filterProductId) {
        setFilterCategory("all");
        setFilterStock("low");
        // يمكن لاحقاً إضافة منطق لتحديد المنتج مباشرة إذا أردت
      }
    }
  }, [productCategories]);

  if (productsLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t("manageProducts")}</h1>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto animate-spin rounded-full border-primary"></div>
          <p className="mt-4 text-gray-600">{t("loadingProducts")}</p>
        </div>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t("manageProducts")}</h1>
        <div className="text-center py-12">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600 font-bold">
            {t("errorLoadingProducts") || "حدث خطأ أثناء جلب المنتجات"}
          </p>
          <p className="text-gray-500">{productsError.message}</p>
        </div>
      </div>
    );
  }

  // استدعاء refetch بعد نجاح التعديل
  const onSuccess = () => {
    refetch();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-2 sm:px-4 md:px-8 py-6">
      {/* شريط الإحصائيات */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-xl p-4 flex items-center gap-3 shadow-sm cursor-pointer hover:shadow-md transition"
          onClick={() => {
            setFilterCategory("all");
            setFilterStock("all");
            setFilterActive("all");
          }}
          title={t("showAllProducts") || "عرض كل المنتجات"}
        >
          <BarChart3 className="h-8 w-8 text-blue-500" />
          <div>
            <div className="text-lg font-bold">{totalProducts}</div>
            <div className="text-xs text-gray-600">{t("products")}</div>
          </div>
        </div>
        <div
          className="bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-xl p-4 flex items-center gap-3 shadow-sm cursor-pointer hover:shadow-md transition"
          onClick={() => {
            setFilterCategory("all");
            setFilterStock("all");
            setFilterActive("inactive");
          }}
          title="عرض المنتجات غير الفعالة"
        >
          <XCircle className="h-8 w-8 text-yellow-500" />
          <div>
            <div className="text-lg font-bold">{inactiveProducts}</div>
            <div className="text-xs text-gray-600">{t("inactive")}</div>
          </div>
        </div>
        <div
          className="bg-gradient-to-r from-red-100 to-red-50 rounded-xl p-4 flex items-center gap-3 shadow-sm cursor-pointer hover:shadow-md transition"
          onClick={() => {
            setFilterCategory("all");
            setFilterStock("low");
            setFilterActive("all");
          }}
          title="عرض المنتجات منخفضة المخزون"
        >
          <Filter className="h-8 w-8 text-red-500" />
          <div>
            <div className="text-lg font-bold">{lowStockProducts}</div>
            <div className="text-xs text-gray-600">{t("lowStock")} (&le;5)</div>
          </div>
        </div>
      </div>
      {/* شريط الفلاتر الموحد (تصميم متجاوب ومحسّن) */}
      <Card className="shadow-lg border-0 mt-4">
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col gap-3 lg:gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              {/* بحث بالاسم */}
              <div className="w-full sm:w-64 flex-shrink-0">
                <div className="relative">
                  <input
                    type="text"
                    className="border-2 border-gray-200 rounded-lg pl-10 pr-3 py-2 h-10 text-xs sm:text-sm w-full bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-300 transition-colors placeholder:text-gray-400"
                    placeholder={t("searchByNameProductPlaceholder") || "اكتب اسم المنتج..."}
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    maxLength={60}
                  />
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 text-base">🔍</span>
                </div>
              </div>
              {/* فلتر الفئة */}
              <div className="w-full sm:w-48 flex-shrink-0">
                <select
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 h-10 text-xs sm:text-sm w-full bg-blue-50 focus:border-blue-500"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">{t("allCategories")}</option>
                  {productCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* فلتر المخزون */}
              <div className="w-full sm:w-40 flex-shrink-0">
                <select
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 h-10 text-xs sm:text-sm w-full bg-green-50 focus:border-green-500"
                  value={filterStock}
                  onChange={(e) => setFilterStock(e.target.value)}
                >
                  <option value="all">{t("allStock")}</option>
                  <option value="low">{t("lowStock")}</option>
                  <option value="in">{t("inStock")}</option>
                  <option value="out">{t("outOfStock")}</option>
                </select>
              </div>
              {/* فلتر الحالة */}
              <div className="w-full sm:w-36 flex-shrink-0">
                <select
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 h-10 text-xs sm:text-sm w-full bg-yellow-50 focus:border-yellow-500"
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value)}
                >
                  <option value="all">{t("allStatus")}</option>
                  <option value="active">{t("active")}</option>
                  <option value="inactive">{t("inactive")}</option>
                </select>
              </div>
              {/* زر تصفير الفلاتر */}
              <div className="w-full sm:w-auto flex flex-row gap-2 mt-2 sm:mt-0">
                <button
                  type="button"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 font-bold shadow border border-red-200 hover:bg-red-100 transition-all duration-200 h-10 text-xs sm:text-sm"
                  onClick={() => {
                    setFilterCategory("all");
                    setFilterStock("all");
                    setFilterActive("all");
                    setSearchName("");
                  }}
                >
                  <XCircle className="h-4 w-4" />
                  <span>{t("resetFilters") || "مسح الفلاتر"}</span>
                </button>
                <button
                  type="button"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white font-bold shadow border border-blue-700 hover:bg-blue-700 transition-all duration-200 h-10 text-xs sm:text-sm"
                  onClick={() => {
                    // تصدير المنتجات إلى CSV
                    const csv = [
                      [
                        "ID",
                        "Name",
                        "NameEn",
                        "Category",
                        "Price",
                        "InStock",
                        "Quantity",
                        "Active",
                        "CreatedAt",
                      ],
                      ...filteredProducts.map((p) => [
                        p.id,
                        p.name,
                        p.nameEn,
                        productCategories.find((c) => c.id === p.category)?.name || "",
                        p.price,
                        p.inStock ? "Yes" : "No",
                        p.stock_quantity ?? "",
                        p.active === false ? "Inactive" : "Active",
                        p.created_at ? new Date(p.created_at).toISOString() : "",
                      ]),
                    ]
                      .map((row) => row.join(","))
                      .join("\n");
                    const BOM = "\uFEFF";
                    const blob = new Blob([BOM + csv], {
                      type: "text/csv;charset=utf-8;",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "products.csv";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>{t("exportExcel") || "تصدير Excel"}</span>
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <AdminHeader
        title={t("products") || "المنتجات"}
        count={filteredProducts.length}
        addLabel={t("addProduct") || "إضافة منتج"}
        onAdd={() => setShowAddDialog(true)}
      />
      {filteredProducts.length === 0 ? (
        <AdminProductsEmptyState onAddProduct={() => setShowAddDialog(true)} />
      ) : (
        <div className="overflow-x-auto rounded-xl shadow-lg bg-white mt-4">
          <AdminProductsTable
            products={filteredProducts}
            onViewProduct={handleViewProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            categories={productCategories}
          />
        </div>
      )}

      <AdminProductsDialogs
        showAddDialog={showAddDialog}
        setShowAddDialog={setShowAddDialog}
        showEditDialog={showEditDialog}
        setShowEditDialog={setShowEditDialog}
        showViewDialog={showViewDialog}
        setShowViewDialog={setShowViewDialog}
        selectedProduct={selectedProduct}
        categories={productCategories}
        onSuccess={onSuccess} // تحديث المنتجات من السيرفر بعد التعديل
        setProducts={setProducts}
      />
    </div>
  );
};

export default AdminProducts;
