import React, { useState, useEffect } from "react";
import { useLanguage } from "../../utils/languageContextUtils";
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
import type { Category } from "@/types";
import { mapDbCategoryToCategory } from "./categoryMappingUtils";
import { useCategoriesRealtime } from "@/hooks/useCategoriesRealtime";

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
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
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
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (url: string | string[]) => {
    const imageUrl = Array.isArray(url) ? url[0] || "" : url;
    setFormData({ ...formData, image: imageUrl });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full p-0 overflow-hidden rounded-2xl shadow-xl">
        <DialogHeader className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b">
          <DialogTitle className="text-2xl font-bold mb-1 text-primary text-center">
            {t("editCategory")}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-6 px-6 py-6 bg-white dark:bg-gray-900"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name_ar">{t("categoryNameArabic")}</Label>
              <Input
                id="name_ar"
                value={formData.name_ar}
                onChange={(e) =>
                  setFormData({ ...formData, name_ar: e.target.value })
                }
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="name_en">{t("categoryNameEnglish")}</Label>
              <Input
                id="name_en"
                value={formData.name_en}
                onChange={(e) =>
                  setFormData({ ...formData, name_en: e.target.value })
                }
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="name_he">{t("categoryNameHebrew")}</Label>
              <Input
                id="name_he"
                value={formData.name_he}
                onChange={(e) =>
                  setFormData({ ...formData, name_he: e.target.value })
                }
                required
                className="mt-1"
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <Label>{t("categoryImage")}</Label>
              <div className="w-24 h-24 rounded-lg overflow-hidden border bg-gray-50 flex items-center justify-center">
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt="preview"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-gray-400 text-xs">{t("noImage")}</span>
                )}
              </div>
              <ImageUpload
                value={formData.image}
                onChange={handleImageChange}
                bucket="category-images"
                label={t("uploadImage")}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) =>
                setFormData({ ...formData, active: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label
              htmlFor="active"
              className="text-sm font-medium cursor-pointer"
            >
              {t("active")}
            </Label>
          </div>
          <DialogFooter className="flex flex-row gap-2 justify-end pt-4 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-white font-bold"
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
