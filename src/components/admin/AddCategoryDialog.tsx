import React, { useState } from "react";
import { isRTL, useLanguage } from "../../utils/languageContextUtils";
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
import { useInsertCategory } from "@/integrations/supabase/reactQueryHooks";
import { createCategorySchema, validateForm } from "@/lib/validation";
import type { Category } from "@/types";

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}

const AddCategoryDialog: React.FC<AddCategoryDialogProps> = ({
  open,
  onOpenChange,
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
  const insertCategoryMutation = useInsertCategory();

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
            title: "خطأ في التحقق",
            description: message,
            variant: "destructive",
          });
        });
        setIsSubmitting(false);
        return;
      }
      
      const data = await insertCategoryMutation.mutateAsync({
        name_ar: formData.name_ar,
        name_en: formData.name_en,
        name_he: formData.name_he,
        image: formData.image,
        active: formData.active,
        icon: "",
      });
      if (!data) throw new Error("لم يتم إضافة الفئة");
      toast({
        title: t("categoryAdded"),
        description: t("categoryAddedSuccessfully"),
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      setErrorMsg((error as Error).message);
      toast({ title: t("error"), description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (url: string | string[]) => {
    const imageUrl = Array.isArray(url) ? url[0] || "" : url;
    handleInputChange("image", imageUrl);
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
            {t("addCategory")}
          </DialogTitle>
        </DialogHeader>
        
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
                        <img
                          src={previewImage || formData.image}
                          alt="preview"
                          className="object-cover w-full h-full"
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

          {/* رسالة الخطأ */}
          {errorMsg && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm font-medium">{errorMsg}</p>
            </div>
          )}
          
          {/* Footer بالأزرار */}
          <div className="mt-6 pt-4 border-t bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="min-w-[100px]"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px] bg-purple-600 text-white font-bold text-base hover:bg-purple-700"
              >
                {isSubmitting ? t("adding") : t("addCategory")}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCategoryDialog;
