import React, { useState, useEffect } from "react";
import { isRTL, useLanguage } from "../../utils/languageContextUtils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import ImageUpload from "@/components/ImageUpload";
import MultiLanguageField from "@/components/ui/MultiLanguageField";
import type { Category } from "@/types";
import { mapDbCategoryToCategory } from "./categoryMappingUtils";
import { useCategoriesRealtime } from "@/hooks/useCategoriesRealtime";
import { createCategorySchema, validateForm } from "@/lib/validation";

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category;
  onSuccess: () => void;
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}

const EditCategoryDialog: React.FC<EditCategoryDialogProps> = ({
  open,
  onOpenChange,
  category,
  onSuccess,
  setCategories,
}) => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    name_he: "",
    image: "",
    active: true,
  });
  const [previewImage, setPreviewImage] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { refetch } = useCategoriesRealtime();

  useEffect(() => {
    if (category) {
      setFormData({
        name_ar: category.name || "",
        name_en: category.nameEn || "",
        name_he: category.nameHe || "",
        image: category.image || "",
        active: typeof category.active === "boolean" ? category.active : true,
      });
      setPreviewImage(category.image || "");
    }
  }, [category]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // تحقق من صحة البيانات قبل الإرسال باستخدام الـ schema الديناميكي
      const dynamicCategorySchema = createCategorySchema();
      const validation = validateForm(dynamicCategorySchema, formData);
      
      if (!validation.success) {
        // عرض أخطاء التحقق
        Object.entries(validation.errors || {}).forEach(([field, message]) => {
          toast({
            title: t("validationError") || "خطأ في التحقق",
            description: message,
            variant: "destructive",
          });
        });
        setIsSubmitting(false);
        return;
      }
      
      const { data, error } = await supabase
        .from("categories")
        .update({
          name_ar: formData.name_ar,
          name_en: formData.name_en,
          name_he: formData.name_he,
          image: formData.image,
          active: formData.active,
        })
        .eq("id", category.id)
        .select();

      if (error) throw error;

      toast({
        title: t("categoryUpdated"),
        description: t("categoryUpdatedSuccessfully"),
      });

      onOpenChange(false);
      // تحديث الواجهة مباشرة
      if (data && data[0]) {
        const mappedCategory = mapDbCategoryToCategory(data[0]);
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === category.id
              ? { ...mappedCategory, count: cat.count }
              : cat,
          ),
        );
        // تحديث الفئات من السيرفر مباشرة
        refetch();
      }
      onSuccess();
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: t("error"),
        description: t("errorUpdatingCategory"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (url: string | string[]) => {
    const imageUrl = Array.isArray(url) ? url[0] || "" : url;
    setFormData(prev => ({ ...prev, image: imageUrl }));
    setPreviewImage(imageUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-w-4xl max-h-[95vh] overflow-y-auto ${isRTL ? "text-right" : "text-left"} p-0`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b">
          <DialogTitle className="text-2xl font-bold text-primary text-center">
            {t("editCategory")}
          </DialogTitle>
        </DialogHeader>
        
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{errorMsg}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* القسم الأيسر - معلومات الفئة */}
            <div className="space-y-6">
              
              {/* أسماء الفئة */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                <h3 className="text-lg font-semibold mb-4 text-primary border-b pb-2">
                  {t("categoryInfo") || "معلومات الفئة"}
                </h3>
                <MultiLanguageField
                  fieldName="categoryName"
                  label={t("categoryName")}
                  values={{
                    ar: formData.name_ar,
                    en: formData.name_en,
                    he: formData.name_he,
                  }}
                  onChange={(lang, value) => 
                    handleInputChange(`name_${lang}`, value)
                  }
                  placeholder={{
                    ar: "أدخل اسم الفئة بالعربية",
                    en: "Enter category name in English",
                    he: "הכנס שם קטגוריה בעברית"
                  }}
                />
              </div>

              {/* الحالة */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                <h3 className="text-lg font-semibold mb-4 text-primary border-b pb-2">
                  {t("status") || "الحالة"}
                </h3>
                <div className="flex items-center space-x-2 rtl:space-x-reverse p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => handleInputChange("active", e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <Label
                    htmlFor="active"
                    className="text-sm font-medium cursor-pointer text-green-700 dark:text-green-300"
                  >
                    {t("active")}
                  </Label>
                </div>
              </div>
            </div>

            {/* القسم الأيمن - الصورة */}
            <div className="space-y-6">
              
              {/* صورة الفئة */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                <h3 className="text-lg font-semibold mb-4 text-primary border-b pb-2">
                  {t("categoryImage")}
                </h3>
                <div className="space-y-4">
                  <ImageUpload
                    value={formData.image}
                    onChange={handleImageChange}
                    bucket="category-images"
                    label={t("uploadCategoryImage") || "رفع صورة الفئة"}
                    placeholder="https://example.com/category-image.jpg"
                  />
                  
                  {/* معاينة الصورة */}
                  <div className="mt-4">
                    <Label className="mb-2 block font-medium">
                      {t("preview") || "معاينة"}
                    </Label>
                    <div className="w-full h-48 rounded-lg border bg-gray-50 flex items-center justify-center overflow-hidden">
                      {previewImage || formData.image ? (
                        <div
                          className="w-full h-full bg-center bg-contain bg-no-repeat"
                          style={{ backgroundImage: `url(${previewImage || formData.image})` }}
                        />
                      ) : (
                        <span className="text-gray-400 text-lg">
                          {t("noImage") || "لا توجد صورة"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-row gap-2 justify-end pt-6 border-t mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
            >
              {isSubmitting ? t("updating") : t("updateCategory")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryDialog;
