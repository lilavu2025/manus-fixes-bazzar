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
import { useInsertCategory } from "@/integrations/supabase/reactQueryHooks";
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
      <DialogContent className="max-w-xl w-full max-h-[95vh] overflow-y-auto p-0 sm:p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-2xl font-bold mb-1 text-primary text-center">
            {t("addCategory")}
          </DialogTitle>
          <p className={`text-gray-500 text-sm mb-0 ${isRTL ? "text-right" : "text-left"}`}>
            {t("fillCategoryDetails") || "يرجى تعبئة بيانات الفئة بشكل صحيح"}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 pt-2">
            <div>
              <Label htmlFor="name_ar">{t("categoryNameArabic")}</Label>
              <Input
                id="name_ar"
                value={formData.name_ar}
                onChange={(e) => handleInputChange("name_ar", e.target.value)}
                required
                placeholder={t("categoryNameArabic")}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="name_en">{t("categoryNameEnglish")}</Label>
              <Input
                id="name_en"
                value={formData.name_en}
                onChange={(e) => handleInputChange("name_en", e.target.value)}
                required
                placeholder={t("categoryNameEnglish")}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="name_he">{t("categoryNameHebrew")}</Label>
              <Input
                id="name_he"
                value={formData.name_he}
                onChange={(e) => handleInputChange("name_he", e.target.value)}
                required
                placeholder={t("categoryNameHebrew")}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 px-6 pt-2 items-center">
            <div className="flex-1 w-full">
              <ImageUpload
                value={formData.image}
                onChange={handleImageChange}
                bucket="category-images"
                placeholder="https://example.com/category-image.jpg"
              />
            </div>
            <div className="flex flex-col items-center justify-center w-full md:w-40 mt-2 md:mt-0">
              <span className="text-xs text-gray-500 mb-1">
                {t("preview") || "معاينة"}
              </span>
              <div className="w-24 h-24 rounded-lg border bg-gray-50 flex items-center justify-center overflow-hidden">
                {previewImage || formData.image ? (
                  <img
                    src={previewImage || formData.image}
                    alt="preview"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-gray-300">
                    {t("noImage") || "لا صورة"}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 pt-2 pb-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => handleInputChange("active", e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label
              htmlFor="active"
              className="text-sm font-medium cursor-pointer"
            >
              {t("active")}
            </Label>
          </div>
          {errorMsg && (
            <div className="px-6 pb-2 text-red-600 text-sm font-semibold">
              {errorMsg}
            </div>
          )}
          <DialogFooter className="px-6 pb-6 pt-2 flex-row-reverse gap-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? t("adding") : t("addCategory")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCategoryDialog;
