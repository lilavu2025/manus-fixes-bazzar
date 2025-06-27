import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/utils/languageContextUtils";
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
import { ClearableInput } from "@/components/ui/ClearableInput"; // استيراد المكون الجديد
import { fetchTopOrderedProducts } from "@/integrations/supabase/dataSenders";

const AdminProducts: React.FC = () => {
  const { isRTL, t, language } = useLanguage();
  const location = useLocation();
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
    deleteProductMutation.mutate(productId, {
      onSuccess: () => {
        setProducts((prev: Product[]) => prev.filter((p) => p.id !== productId));
        toast({ title: t("productDeleted") });
      },
      onError: () => {
        toast({ title: t("errorDeletingProduct") });
      },
    });
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
  const [showTopOrdered, setShowTopOrdered] = useState(false);
  const [topOrderedProducts, setTopOrderedProducts] = useState<ProductWithOptionalFields[]>([]);
  const [filterAppliedFromDashboard, setFilterAppliedFromDashboard] = useState<string>("");
  const [hasAppliedLocationFilters, setHasAppliedLocationFilters] = useState(false);

  // إحصائيات سريعة
  const totalProducts = products.length;
  const inactiveProducts = products.filter((p) => p.active === false).length;
  const lowStockProducts = products.filter(
    (p) => p.stock_quantity && p.stock_quantity > 0 && p.stock_quantity <= 10,
  ).length;

  // فلترة المنتجات
  const filteredProducts = products.filter((product) => {
    let pass = true;
    if (filterCategory !== "all" && product.category !== filterCategory)
      pass = false;
    if (filterStock === "low" && !((product.stock_quantity ?? 0) > 0 && (product.stock_quantity ?? 0) <= 10))
      pass = false;
    if (filterStock === "in" && (product.stock_quantity ?? 0) <= 0) pass = false;
    if (filterStock === "out" && (product.stock_quantity ?? 0) > 0) pass = false;
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

  // استقبال الفلاتر من التنقل من لوحة التحكم
  useEffect(() => {
    // تطبيق الفلاتر فقط مرة واحدة عند دخول الصفحة وتوفر location.state
    if (!location.state || hasAppliedLocationFilters || !productCategories.length) return;
    
    // فلترة حسب الفئة
    if (location.state.filterCategory) {
      const filterCategoryName = location.state.filterCategory;
      const foundCat = productCategories.find((c) => c.name === filterCategoryName);
      if (foundCat) {
        setFilterCategory(foundCat.id);
        setFilterAppliedFromDashboard(`تم الفلترة حسب الفئة: ${filterCategoryName}`);
        setHasAppliedLocationFilters(true);
      }
    }
    
    // فلترة المنتجات منخفضة المخزون
    else if (location.state.filterLowStock) {
      setFilterCategory("all");
      setFilterStock("low");
      setFilterAppliedFromDashboard("تم الفلترة: المنتجات منخفضة المخزون (1-10 قطع)");
      setHasAppliedLocationFilters(true);
    }
    
    // فلترة المنتجات المنتهية من المخزون
    else if (location.state.filterOutOfStock) {
      setFilterCategory("all");
      setFilterStock("out");
      setFilterAppliedFromDashboard("تم الفلترة: المنتجات المنتهية من المخزون (0 قطع)");
      setHasAppliedLocationFilters(true);
    }
    
    // البحث عن منتج محدد بالـ ID
    else if (location.state.filterProductId && products.length > 0) {
      const productId = location.state.filterProductId;
      const foundProduct = products.find(p => p.id === productId);
      if (foundProduct) {
        setSearchName(foundProduct.name || "");
        setFilterAppliedFromDashboard(`تم البحث عن المنتج: ${foundProduct.name}`);
        setHasAppliedLocationFilters(true);
      }
    }
  }, []); // إزالة جميع dependencies ليتم تشغيله مرة واحدة فقط

  // useEffect منفصل للتحقق من وجود location.state جديد عند تغيير المسار
  useEffect(() => {
    // إعادة تعيين الحالة إذا كان هناك location.state جديد
    if (location.state && !hasAppliedLocationFilters) {
      // تشغيل العملية بعد تحميل البيانات
      const timer = setTimeout(() => {
        if (location.state && !hasAppliedLocationFilters) {
          // فلترة حسب الفئة
          if (location.state.filterCategory && productCategories.length > 0) {
            const filterCategoryName = location.state.filterCategory;
            const foundCat = productCategories.find((c) => c.name === filterCategoryName);
            if (foundCat) {
              setFilterCategory(foundCat.id);
              setFilterAppliedFromDashboard(`تم الفلترة حسب الفئة: ${filterCategoryName}`);
              setHasAppliedLocationFilters(true);
            }
          }
          
          // فلترة المنتجات منخفضة المخزون
          else if (location.state.filterLowStock) {
            setFilterCategory("all");
            setFilterStock("low");
            setFilterAppliedFromDashboard("تم الفلترة: المنتجات منخفضة المخزون (1-10 قطع)");
            setHasAppliedLocationFilters(true);
          }
          
          // فلترة المنتجات المنتهية من المخزون
          else if (location.state.filterOutOfStock) {
            setFilterCategory("all");
            setFilterStock("out");
            setFilterAppliedFromDashboard("تم الفلترة: المنتجات المنتهية من المخزون (0 قطع)");
            setHasAppliedLocationFilters(true);
          }
          
          // البحث عن منتج محدد بالـ ID
          else if (location.state.filterProductId && products.length > 0) {
            const productId = location.state.filterProductId;
            const foundProduct = products.find(p => p.id === productId);
            if (foundProduct) {
              setSearchName(foundProduct.name || "");
              setFilterAppliedFromDashboard(`تم البحث عن المنتج: ${foundProduct.name}`);
              setHasAppliedLocationFilters(true);
            }
          }
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname]); // فقط عند تغيير المسار

  // مسح الرسالة بعد 8 ثوان
  useEffect(() => {
    if (filterAppliedFromDashboard) {
      const timer = setTimeout(() => setFilterAppliedFromDashboard(""), 8000);
      return () => clearTimeout(timer);
    }
  }, [filterAppliedFromDashboard]);

  useEffect(() => {
    if (showTopOrdered) {
      fetchTopOrderedProducts().then((data) => {
        setTopOrderedProducts(Array.isArray(data) ? data.map(mapProductFromDb) : []);
      });
    }
  }, [showTopOrdered]);

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
            setSearchName("");
            setFilterAppliedFromDashboard("");
            setHasAppliedLocationFilters(false);
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
            setSearchName("");
            setFilterAppliedFromDashboard("");
            setHasAppliedLocationFilters(false);
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
            setSearchName("");
            setFilterAppliedFromDashboard("");
            setHasAppliedLocationFilters(false);
          }}
          title="عرض المنتجات منخفضة المخزون"
        >
          <Filter className="h-8 w-8 text-red-500" />
          <div>
            <div className="text-lg font-bold">{lowStockProducts}</div>
            <div className="text-xs text-gray-600">{t("lowStock")} (&le;10)</div>
          </div>
        </div>
      </div>
      {/* شريط الفلاتر الموحد (تصميم متجاوب ومحسّن) */}
      <Card className="shadow-lg border-0 mt-1">
        <CardContent className="p-2 sm:p-3 lg:p-4">
          <div className="flex flex-col gap-2 lg:gap-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
              {/* بحث بالاسم */}
              <div className="w-full sm:w-64 flex-shrink-0">
                <div className="relative">
                  <ClearableInput
                    type="text"
                    className={`border-2 border-gray-200 rounded-lg py-2 h-10 text-xs sm:text-sm w-full bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-300 transition-colors placeholder:text-gray-400 ${isRTL ? 'pr-8 pl-3' : 'pl-8 pr-3'}`}
                    placeholder={t("searchByNameProductPlaceholder") || "اكتب اسم المنتج..."}
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    onClear={() => setSearchName("")}
                    maxLength={60}
                  />
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
                      {(language === 'en' && cat.nameEn) ? cat.nameEn : (language === 'he' && cat.nameHe) ? cat.nameHe : cat.name /* fallback للعربي */ || cat.nameEn || cat.nameHe || ''}
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
                    setFilterAppliedFromDashboard("");
                    setHasAppliedLocationFilters(false); // إعادة تعيين حالة التطبيق
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
      <AdminProductsHeader productCount={filteredProducts.length} onAddProduct={() => setShowAddDialog(true)} />
      
      {/* رسالة الفلتر المطبق من لوحة التحكم */}
      {filterAppliedFromDashboard && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg text-blue-800 text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          <span>{filterAppliedFromDashboard}</span>
          <button 
            onClick={() => {
              // مسح جميع الفلاتر
              setFilterCategory("all");
              setFilterStock("all");
              setFilterActive("all");
              setSearchName("");
              setFilterAppliedFromDashboard("");
              setHasAppliedLocationFilters(false); // إعادة تعيين حالة التطبيق
            }}
            className="ml-auto bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
          >
            مسح الفلاتر
          </button>
          <button 
            onClick={() => setFilterAppliedFromDashboard("")}
            className="text-blue-600 hover:text-blue-800"
          >
            ✕
          </button>
        </div>
      )}
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          className={`px-3 py-1 rounded border ${showTopOrdered ? 'bg-orange-100 border-orange-400 text-orange-700' : 'bg-white border-gray-300 text-gray-700'}`}
          onClick={() => setShowTopOrdered((prev) => !prev)}
        >
          {showTopOrdered ? t('showAll') : t('showTopSellingProducts')}
        </button>
      </div>
      {/* جدول المنتجات */}
      {showTopOrdered ? (
        <AdminProductsTable
          products={topOrderedProducts}
          onViewProduct={handleViewProduct}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
          categories={productCategories}
        />
      ) : (
        <AdminProductsTable
          products={filteredProducts}
          onViewProduct={handleViewProduct}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
          categories={productCategories}
        />
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
