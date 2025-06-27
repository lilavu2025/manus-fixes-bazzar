import React, { useState } from "react";
import { isRTL, useLanguage } from "../../utils/languageContextUtils";
import { useCategoriesRealtime } from "@/hooks/useCategoriesRealtime";
import { useDeleteCategory } from "@/integrations/supabase/reactQueryHooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash,
  Eye,
  FolderOpen,
  XCircle,
  BarChart3,
} from "lucide-react";
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
import { toast } from "@/hooks/use-toast";
import AddCategoryDialog from "./AddCategoryDialog";
import EditCategoryDialog from "./EditCategoryDialog";
import ViewCategoryDialog from "./ViewCategoryDialog";
import { Category } from "@/types/product";
import { mapCategoryToProductCategory } from "@/types/index";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import OptimizedSearch from "@/components/OptimizedSearch";
import { useCategoriesWithProductCountQuery } from "@/integrations/supabase/reactQueryHooks"; // تأكد من استيراد الاستعلام الصحيح
import AdminHeader from "./AdminHeader";
import { ClearableInput } from "@/components/ui/ClearableInput";

const AdminCategories: React.FC = () => {
  const { t, language } = useLanguage();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  // استخدم الهوك بدون أي باراميتر
  const { categories, loading, error, refetch, setCategories } =
    useCategoriesRealtime();
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [sortBy, setSortBy] = useState<"name" | "count">("name");
  const [categoriesOrder, setCategoriesOrder] = useState(
    categories.map((c) => c.id),
  );
  const deleteCategoryMutation = useDeleteCategory();

  // إحصائيات
  const totalCategories = categories.length;
  const activeCategories = categories.length; // جميع الفئات نشطة افتراضياً
  const inactiveCategories = 0; // لا يوجد فئات غير نشطة
  const totalProducts = categories.reduce((acc, c) => acc + (c.count || 0), 0);

  // فلترة وبحث
  const filteredCategories = categories
    .filter((c) => {
      // فلترة حسب البحث
      const name = typeof c.name === "string" ? c.name : "";
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
      // فلترة حسب الحالة
      const matchesActive =
        filterActive === "all" ||
        (filterActive === "active" && c.active === true) ||
        (filterActive === "inactive" && c.active === false);
      return matchesSearch && matchesActive;
    })
    .sort((a, b) =>
      sortBy === "name"
        ? (a.name || "").localeCompare(b.name || "")
        : (b.count || 0) - (a.count || 0),
    );

  // ترتيب حسب السحب أو حسب الفرز
  let orderedCategories: typeof filteredCategories;
  if (sortBy === "count") {
    // عند الفرز بعدد المنتجات، تجاهل ترتيب السحب
    orderedCategories = filteredCategories;
  } else {
    // عند الفرز بالاسم، استخدم ترتيب السحب
    orderedCategories = categoriesOrder
      .map((id) => filteredCategories.find((c) => c.id === id))
      .filter(Boolean) as typeof filteredCategories;
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const newOrder = Array.from(categoriesOrder);
    const [removed] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, removed);
    setCategoriesOrder(newOrder);
    // تم حذف تحديث sort_order لأنه غير موجود في قاعدة البيانات
    // إذا أضفت الحقل لاحقًا يمكنك إعادة الكود التالي:
    // await Promise.all(newOrder.map((id, idx) =>
    //   supabase.from('categories').update({ sort_order: idx }).eq('id', id)
    // ));
  };

  const handleDeleteCategory = async (
    categoryId: string,
    categoryName: string,
  ) => {
    try {
      const ok = await deleteCategoryMutation.mutateAsync(categoryId);
      if (!ok) throw new Error("Delete failed");
      toast({
        title: t("categoryDeleted"),
        description: `${t("categoryDeletedSuccessfully")} ${categoryName}`,
      });
      refetch();
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Error deleting category:", err);
      toast({
        title: t("error"),
        description: t("errorDeletingCategory"),
      });
    }
  };

  // عند تمرير category لأي مكون يتوقع النوع من types/product.ts
  const handleViewCategory = (category: Category) => {
    setSelectedCategory(mapCategoryToProductCategory(category));
    setShowViewDialog(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(mapCategoryToProductCategory(category));
    setShowEditDialog(true);
  };

  // مزامنة ترتيب الفئات مع البيانات الفعلية
  React.useEffect(() => {
    // Only reset order if categories changed (e.g. after fetch or add/delete)
    if (
      categories.length > 0 &&
      (categoriesOrder.length === 0 ||
        categoriesOrder.length !== categories.length ||
        !categories.every((c, i) => categoriesOrder[i] === c.id))
    ) {
      setCategoriesOrder(categories.map((c) => c.id));
    }
  }, [categories, categoriesOrder]);

  const [sortConfig, setSortConfig] = React.useState<{
    key: string;
    direction: "asc" | "desc" | "default";
  }>({
    key: "",
    direction: "default",
  });

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

  const sortedCategories = React.useMemo(() => {
    if (sortConfig.direction === "default") return orderedCategories;
    const sorted = [...orderedCategories].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key])
        return sortConfig.direction === "asc" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key])
        return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [orderedCategories, sortConfig]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t("manageCategories")}</h1>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto animate-spin rounded-full border-primary"></div>
          <p className="mt-4 text-gray-600">{t("loadingCategories")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 md:px-8 py-6">
      {/* شريط الإحصائيات */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-2">
        <div
          className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-xl p-4 flex flex-col items-center shadow-sm cursor-pointer hover:shadow-md transition"
          onClick={() => {
            setFilterActive("all");
          }}
        >
          <div className="text-lg font-bold">{totalCategories}</div>
          <div className="text-xs text-gray-600">{t("categories")}</div>
        </div>
        <div
          className="bg-gradient-to-r from-green-100 to-green-50 rounded-xl p-4 flex flex-col items-center shadow-sm cursor-pointer hover:shadow-md transition"
          onClick={() => {
            setFilterActive("active");
          }}
        >
          <div className="text-lg font-bold">{activeCategories}</div>
          <div className="text-xs text-gray-600">{t("active")}</div>
        </div>
        <div
          className="bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-xl p-4 flex flex-col items-center shadow-sm cursor-pointer hover:shadow-md transition"
          onClick={() => {
            setFilterActive("inactive");
          }}
        >
          <div className="text-lg font-bold">{inactiveCategories}</div>
          <div className="text-xs text-gray-600">{t("inactive")}</div>
        </div>
        <div className="bg-gradient-to-r from-purple-100 to-purple-50 rounded-xl p-4 flex flex-col items-center shadow-sm cursor-pointer hover:shadow-md transition">
          <div className="text-lg font-bold">{totalProducts}</div>
          <div className="text-xs text-gray-600">{t("products")}</div>
        </div>
      </div>
      {/* شريط الفلاتر الموحد (تصميم متجاوب ومحسّن) */}
      <Card className="shadow-lg border-0 mt-1">
        <CardContent className="p-2 sm:p-3 lg:p-4">
          <div className="flex flex-col gap-2 lg:gap-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
              {/* بحث الفئات */}
              <div className="w-full sm:w-64 flex-shrink-0">
                <div className="relative">
                  <ClearableInput
                    type="text"
                    className={`border-2 border-gray-200 rounded-lg py-2 h-10 text-xs sm:text-sm w-full bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-300 transition-colors placeholder:text-gray-400 ${
                      language === "ar" ? "pr-8 pl-3" : "pl-8 pr-3"
                    }`}
                    placeholder={t("searchCategories") || "بحث الفئات..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onClear={() => setSearch("")}
                    maxLength={60}
                  />
                </div>
              </div>
              {/* فلتر الحالة */}
              <div className="w-full sm:w-40 flex-shrink-0">
                <select
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 h-10 text-xs sm:text-sm w-full bg-yellow-50 focus:border-yellow-500"
                  value={filterActive}
                  onChange={(e) =>
                    setFilterActive(e.target.value as "all" | "active" | "inactive")
                  }
                >
                  <option value="all">{t("allStatus")}</option>
                  <option value="active">{t("active")}</option>
                  <option value="inactive">{t("inactive")}</option>
                </select>
              </div>
              {/* فرز حسب */}
              <div className="w-full sm:w-40 flex-shrink-0">
                <select
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 h-10 text-xs sm:text-sm w-full bg-blue-50 focus:border-blue-500"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "name" | "count")}
                >
                  <option value="name">{t("sortByName")}</option>
                  <option value="count">{t("sortByProductCount")}</option>
                </select>
              </div>
              {/* زر تصفير الفلاتر */}
              <div className="w-full sm:w-auto flex flex-row gap-2 mt-2 sm:mt-0">
                <button
                  type="button"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 font-bold shadow border border-red-200 hover:bg-red-100 transition-all duration-200 h-10 text-xs sm:text-sm"
                  onClick={() => {
                    setSearch("");
                    setFilterActive("all");
                    setSortBy("name");
                  }}
                >
                  <XCircle className="h-4 w-4" />
                  <span>{t("resetFilters") || "مسح الفلاتر"}</span>
                </button>
                <button
                  type="button"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white font-bold shadow border border-blue-700 hover:bg-blue-700 transition-all duration-200 h-10 text-xs sm:text-sm"
                  onClick={() => {
                    // تصدير CSV
                    const csv = [
                      ["ID", "Name", "ProductCount"],
                      ...orderedCategories.map((c) => [c.id, c.name, c.count]),
                    ]
                      .map((row) => row.join(","))
                      .join("\n");
                    const BOM = "\uFEFF"; // UTF-8 BOM
                    const blob = new Blob([BOM + csv], {
                      type: "text/csv;charset=utf-8;",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "categories.csv";
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
        title={t("categories") || "التصنيفات"}
        count={filteredCategories.length}
        addLabel={t("addCategory") || "إضافة تصنيف"}
        onAdd={() => setShowAddDialog(true)}
      />

      {categories.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("noCategories")}
              </h3>
              <p className="text-gray-500 mb-6">{t("addYourFirstCategory")}</p>
              <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                {t("addCategory")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("categories")}</CardTitle>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="categories-table">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    <Table>
                      <TableHeader className="text-center">
                        <TableRow>
                          <TableHead className="text-center">#</TableHead>
                          <TableHead className="text-center">
                            {t("categoryImage")}
                          </TableHead>
                          <TableHead
                            className="text-center cursor-pointer"
                            onClick={() => handleSort("name")}
                          >
                            {t("categoryName")}
                          </TableHead>
                          <TableHead
                            className="text-center cursor-pointer"
                            onClick={() => handleSort("count")}
                          >
                            {t("productCount")}
                          </TableHead>
                          <TableHead
                            className="text-center cursor-pointer"
                            onClick={() => handleSort("active")}
                          >
                            {t("status")}
                          </TableHead>
                          <TableHead className="text-center">
                            {t("actions")}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedCategories.map((category, idx) => (
                          <Draggable
                            key={category.id}
                            draggableId={category.id}
                            index={idx}
                          >
                            {(provided, snapshot) => (
                              <TableRow
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={
                                  snapshot.isDragging ? "bg-blue-50" : ""
                                }
                              >
                                <TableCell className="text-center font-bold">
                                  {idx + 1}
                                </TableCell>
                                <TableCell>
                                  <img
                                    src={category.image}
                                    alt={category.name}
                                    className="w-12 h-12 object-cover rounded-lg mx-auto border"
                                  />
                                </TableCell>
                                <TableCell className="font-medium">
                                  {(() => {
                                    if (
                                      typeof category.name === "string" &&
                                      category.name
                                    ) {
                                      // دعم البنية القديمة
                                      if (
                                        t &&
                                        typeof t === "function" &&
                                        t("lang") === "ar"
                                      )
                                        return category.name;
                                      if (
                                        t &&
                                        typeof t === "function" &&
                                        t("lang") === "en" &&
                                        category.nameEn
                                      )
                                        return category.nameEn;
                                      if (
                                        t &&
                                        typeof t === "function" &&
                                        t("lang") === "he" &&
                                        category.nameHe
                                      )
                                        return category.nameHe;
                                    }
                                    // دعم البنية الجديدة
                                    if (typeof category === "object") {
                                      if (language === "ar" && category.name)
                                        return category.name;
                                      if (language === "en" && category.nameEn)
                                        return category.nameEn;
                                      if (language === "he" && category.nameHe)
                                        return category.nameHe;
                                    }
                                    // fallback
                                    return (
                                      category.name ||
                                      category.nameEn ||
                                      category.nameHe ||
                                      ""
                                    );
                                  })()}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {category.count}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      category.active
                                        ? "default"
                                        : "destructive"
                                    }
                                  >
                                    {category.active
                                      ? t("active")
                                      : t("inactive")}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center gap-2 justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      title={t("view")}
                                      onClick={() =>
                                        handleViewCategory(
                                          mapCategoryToProductCategory(
                                            category,
                                          ),
                                        )
                                      }
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      title={t("edit")}
                                      onClick={() =>
                                        handleEditCategory(
                                          mapCategoryToProductCategory(
                                            category,
                                          ),
                                        )
                                      }
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          title={t("delete")}
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <Trash className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle className={` ${isRTL ? "text-right" : "text-left"}`}>
                                            {t("deleteCategory")}
                                          </AlertDialogTitle>
                                          <AlertDialogDescription className={` ${isRTL ? "text-right" : "text-left"}`}>
                                            {t("deleteCategoryConfirmation")} "
                                            {(() => {
                                              if (
                                                language === "ar" &&
                                                category.name
                                              )
                                                return category.name;
                                              if (
                                                language === "en" &&
                                                category.nameEn
                                              )
                                                return category.nameEn;
                                              if (
                                                language === "he" &&
                                                category.nameHe
                                              )
                                                return category.nameHe;
                                              return (
                                                category.name ||
                                                category.nameEn ||
                                                category.nameHe ||
                                                ""
                                              );
                                            })()}
                                            "?
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="gap-2">
                                          <AlertDialogCancel>
                                            {t("cancel")}
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              handleDeleteCategory(
                                                category.id,
                                                (() => {
                                                  if (
                                                    language === "ar" &&
                                                    category.name
                                                  )
                                                    return category.name;
                                                  if (
                                                    language === "en" &&
                                                    category.nameEn
                                                  )
                                                    return category.nameEn;
                                                  if (
                                                    language === "he" &&
                                                    category.nameHe
                                                  )
                                                    return category.nameHe;
                                                  return (
                                                    category.name ||
                                                    category.nameEn ||
                                                    category.nameHe ||
                                                    ""
                                                  );
                                                })(),
                                              )
                                            }
                                            className="bg-red-600 hover:bg-red-700"
                                          >
                                            {t("delete")}
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </CardContent>
        </Card>
      )}

      {/* الحوارات */}
      <AddCategoryDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => refetch()}
        setCategories={setCategories}
      />

      {selectedCategory && (
        <>
          <EditCategoryDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            category={selectedCategory}
            onSuccess={refetch} // تحديث البيانات من السيرفر بعد التعديل
            setCategories={setCategories}
          />
          <ViewCategoryDialog
            open={showViewDialog}
            onOpenChange={setShowViewDialog}
            category={selectedCategory}
          />
        </>
      )}
    </div>
  );
};

export default AdminCategories;
