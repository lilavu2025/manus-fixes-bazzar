// src/components/admin/MultiLanguageCategoryDialog.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/utils/languageContextUtils";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";
import MultiLanguageField from "@/components/ui/MultiLanguageField";
import { Language } from "@/types/language";
import { useInsertCategory } from "@/integrations/supabase/reactQueryHooks";
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/types/product";
import { createCategorySchema, validateForm } from "@/lib/validation";

interface CategoryFormData {
  name_ar: string;
  name_en: string;
  name_he: string;
  image: string;
  active: boolean;
}

interface MultiLanguageCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  category?: Category | null;
  mode: 'add' | 'edit';
}

const MultiLanguageCategoryDialog: React.FC<MultiLanguageCategoryDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  category,
  mode
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const insertCategoryMutation = useInsertCategory();
  
  const [formData, setFormData] = useState<CategoryFormData>(() => ({
    name_ar: category?.name || '',
    name_en: category?.nameEn || '',
    name_he: category?.nameHe || '',
    image: category?.image || '',
    active: category?.active ?? true,
  }));

  // تحديث البيانات عند تغيير الفئة
  useEffect(() => {
    if (category) {
      setFormData({
        name_ar: category.name || '',
        name_en: category.nameEn || '',
        name_he: category.nameHe || '',
        image: category.image || '',
        active: category.active ?? true,
      });
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // تحقق من صحة البيانات قبل الإرسال باستخدام الـ schema الديناميكي
      const dynamicCategorySchema = createCategorySchema();
      const validation = validateForm(dynamicCategorySchema, formData);
      
      if (!validation.success) {
        // عرض أخطاء التحقق
        Object.entries(validation.errors || {}).forEach(([field, message]) => {
          toast.error(message);
        });
        setLoading(false);
        return;
      }

      const categoryData = {
        name_ar: formData.name_ar,
        name_en: formData.name_en,
        name_he: formData.name_he,
        image: formData.image,
        active: formData.active,
        icon: "",
      };

      if (mode === 'edit' && category) {
        // تحديث الفئة
        const { error } = await supabase
          .from("categories")
          .update(categoryData)
          .eq("id", category.id);
        
        if (error) throw error;
        toast.success(t("categoryUpdatedSuccessfully"));
      } else {
        // إضافة فئة جديدة
        await insertCategoryMutation.mutateAsync(categoryData);
        toast.success(t("categoryAddedSuccessfully"));
      }

      onSuccess();
      onOpenChange(false);
      
      // إعادة تعيين النموذج إذا كان في وضع الإضافة
      if (mode === 'add') {
        setFormData({
          name_ar: '',
          name_en: '',
          name_he: '',
          image: '',
          active: true,
        });
      }
    } catch (error) {
      console.error("Category operation error:", error);
      toast.error(mode === 'edit' ? t("errorUpdatingCategory") : t("errorAddingCategory"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-full max-h-[95vh] overflow-y-auto p-0 sm:p-0">
        <DialogHeader className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b">
          <DialogTitle className="text-2xl font-bold mb-1 text-primary text-center">
            {mode === 'edit' ? t("editCategory") : t("addCategory")}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 bg-white dark:bg-gray-900">
          {/* أسماء الفئة متعددة اللغات */}
          <MultiLanguageField
            fieldName="category_name"
            label={t("categoryName") || "اسم الفئة"}
            values={{
              ar: formData.name_ar,
              en: formData.name_en,
              he: formData.name_he,
            }}
            onChange={(lang: Language, value: string) =>
              setFormData((prev) => ({
                ...prev,
                [`name_${lang}`]: value,
              }))
            }
            placeholder={{
              ar: "أدخل اسم الفئة بالعربية",
              en: "Enter category name in English",
              he: "הכנס שם קטגוריה בעברית",
            }}
          />

          {/* رفع الصورة */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("categoryImage") || "صورة الفئة"}
            </label>
            <ImageUpload
              value={formData.image}
              onChange={(imageUrl) => {
                const url = Array.isArray(imageUrl) ? imageUrl[0] || '' : imageUrl;
                setFormData(prev => ({ ...prev, image: url }));
              }}
              bucket="categories"
              label={t("categoryImage") || "صورة الفئة"}
            />
          </div>

          <DialogFooter className="flex flex-row gap-2 justify-end pt-4 border-t mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading} className="bg-primary text-white font-bold">
              {loading ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MultiLanguageCategoryDialog;
