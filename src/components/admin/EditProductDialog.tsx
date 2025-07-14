import React, { useState, useEffect } from "react";
import { useLanguage } from "@/utils/languageContextUtils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import ImageUpload from "@/components/ImageUpload";
import ProductNameFields from "./ProductNameFields";
import ProductDescriptionFields from "./ProductDescriptionFields";
import ProductPricingFields from "./ProductPricingFields";
import ProductToggleFields from "./ProductToggleFields";
import MultiLanguageField from "@/components/ui/MultiLanguageField";
import {
  Product,
  ProductFormData,
  Category,
  AdminProductForm,
} from "@/types/product";
import { mapProductToFormData } from "./productMappingUtils";
import { useProductsRealtime } from "@/hooks/useProductsRealtime";
import { createProductSchema, validateForm } from "@/lib/validation";

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: AdminProductForm;
  categories: Category[];
  onSuccess: () => void;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const EditProductDialog: React.FC<EditProductDialogProps> = ({
  open,
  onOpenChange,
  product,
  categories,
  onSuccess,
  setProducts,
}) => {
  const { isRTL, t, language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name_ar: "",
    name_en: "",
    name_he: "",
    description_ar: "",
    description_en: "",
    description_he: "",
    price: 0,
    original_price: 0,
    wholesale_price: 0,
    image: "",
    images: [],
    category_id: "",
    in_stock: true,
    discount: 0,
    featured: false,
    active: true,
    tags: [],
    stock_quantity: 0,
  });
  const { refetch } = useProductsRealtime();

  // تهيئة البيانات فقط عند فتح الديالوج لأول مرة أو تغيير المنتج
  useEffect(() => {
    if (product && categories.length > 0 && (!isInitialized || !open)) {
      // فصل الصورة الرئيسية عن الصور الإضافية
      const allImages = Array.isArray(product.images)
        ? product.images
        : [product.image].filter(Boolean);
      
      const mainImage = product.image || (allImages.length > 0 ? allImages[0] : "");
      const additionalImages = allImages.filter(img => img !== mainImage);
      
      const matched = categories.find(
        (c) => c.id === product.category_id || c.id === product.category,
      );
      setFormData({
        name_ar: product.name_ar || "",
        name_en: product.name_en || "",
        name_he: product.name_he || "",
        description_ar: product.description_ar || "",
        description_en: product.description_en || "",
        description_he: product.description_he || "",
        price: product.price || 0,
        original_price: product.original_price || 0,
        wholesale_price: product.wholesale_price || 0,
        image: mainImage,
        images: additionalImages,
        category_id: matched?.id || "",
        in_stock: product.in_stock ?? true,
        discount: product.discount ?? 0,
        featured: product.featured ?? false,
        active: product.active ?? true,
        tags: product.tags || [],
        stock_quantity: product.stock_quantity || 0,
      });
      setIsInitialized(true);
    }
  }, [product?.id, categories.length, open]);

  // إعادة تعيين حالة التهيئة عند إغلاق الديالوج
  useEffect(() => {
    if (!open) {
      setIsInitialized(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // تحقق من صحة البيانات قبل الإرسال باستخدام الـ schema الديناميكي
      const dynamicProductSchema = createProductSchema();
      const validation = validateForm(dynamicProductSchema, formData);
      
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
      
      // دمج الصورة الرئيسية مع الصور الإضافية (الصورة الرئيسية تكون الأولى)
      const allImages = [];
      if (formData.image) {
        allImages.push(formData.image);
      }
      // إضافة الصور الإضافية (تجنب التكرار)
      if (formData.images && formData.images.length > 0) {
        formData.images.forEach(img => {
          if (img && img !== formData.image) {
            allImages.push(img);
          }
        });
      }
      
      const { data, error } = await supabase
        .from("products")
        .update({
          ...formData,
          images: allImages,
          image: formData.image || (allImages.length > 0 ? allImages[0] : ""),
          category_id: formData.category_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id)
        .select();
      if (error) throw error;
      toast({
        title: t("productUpdated"),
        description: t("productUpdatedSuccessfully"),
      });
      onOpenChange(false);
      // تحديث الواجهة مباشرة
      if (data && data[0]) {
        // تحويل بيانات supabase إلى شكل Product المستخدم في الجدول
        const p = data[0];
        const mapped = {
          id: p.id,
          name: p.name_ar || p.name_en || p.name_he || "",
          nameEn: p.name_en || "",
          nameHe: p.name_he || "",
          description: p.description_ar || p.description_en || p.description_he || "",
          descriptionEn: p.description_en || "",
          descriptionHe: p.description_he || "",
          price: Number(p.price),
          originalPrice: p.original_price ?? undefined,
          wholesalePrice: p.wholesale_price ?? undefined,
          image: p.image,
          images: p.images ?? [],
          category: p.category_id,
          category_id: p.category_id,
          inStock: p.in_stock ?? false,
          rating: Number(p.rating) || 0,
          reviews: p.reviews_count || 0,
          discount: p.discount ?? undefined,
          featured: p.featured ?? false,
          tags: p.tags ?? [],
          stock_quantity: p.stock_quantity ?? 0,
          active: p.active ?? true,
          created_at: p.created_at,
        };
        setProducts((prev) =>
          prev.map((prod) => (prod.id === product.id ? mapped : prod)),
        );
      }
      onSuccess(); // تحديث المنتجات من السيرفر بعد التعديل
    } catch (err) {
      console.error(err);
      toast({ title: t("error"), description: t("errorUpdatingProduct") });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-w-5xl max-h-[95vh] overflow-y-auto ${isRTL ? "text-right" : "text-left"} p-0`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b">
          <DialogTitle className="text-2xl font-bold text-primary text-center">
            {t("editProduct")}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* القسم الأيسر - المعلومات الأساسية */}
            <div className="space-y-6">
              
              {/* بيانات المنتج الأساسية */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                <h3 className="text-lg font-semibold mb-4 text-primary border-b pb-2">
                  {t("productInfo") || "بيانات المنتج"}
                </h3>
                <div className="space-y-4">
                  <MultiLanguageField
                    fieldName="name"
                    label={t("productName") || "اسم المنتج"}
                    values={{
                      ar: formData.name_ar,
                      en: formData.name_en,
                      he: formData.name_he,
                    }}
                    onChange={(lang, value) =>
                      setFormData((prev) => ({
                        ...prev,
                        [`name_${lang}`]: value,
                      }))
                    }
                    placeholder={{
                      ar: "أدخل اسم المنتج بالعربية",
                      en: "Enter product name in English",
                      he: "הכנס שם מוצר בעברית",
                    }}
                  />
                </div>
              </div>

              {/* الأوصاف */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                <h3 className="text-lg font-semibold mb-4 text-primary border-b pb-2">
                  {t("descriptions") || "الأوصاف"}
                </h3>
                <MultiLanguageField
                  fieldName="description"
                  label={t("productDescription") || "وصف المنتج"}
                  values={{
                    ar: formData.description_ar,
                    en: formData.description_en,
                    he: formData.description_he,
                  }}
                  onChange={(lang, value) =>
                    setFormData((prev) => ({
                      ...prev,
                      [`description_${lang}`]: value,
                    }))
                  }
                  placeholder={{
                    ar: "أدخل وصف المنتج بالعربية",
                    en: "Enter product description in English", 
                    he: "הכנס תיאור מוצר בעברית",
                  }}
                  type="textarea"
                  required={false}
                />
              </div>

              {/* الفئة والعلامات */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                <h3 className="text-lg font-semibold mb-4 text-primary border-b pb-2">
                  {t("categoryAndTags") || "الفئة والعلامات"}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block font-medium">
                      {t("category")} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category_id: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                      required
                    >
                      <option value="">{t("selectCategory")}</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {(language === 'en' && cat.nameEn) ? cat.nameEn : (language === 'he' && cat.nameHe) ? cat.nameHe : cat.name || cat.nameEn || cat.nameHe || ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="mb-2 block font-medium">
                      {t("tags")} ({t("optional")})
                    </label>
                    <input
                      type="text"
                      value={formData.tags?.join(", ") || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tags: e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean),
                        }))
                      }
                      placeholder={t("tagsPlaceholder") || "علامة1, علامة2, علامة3"}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* القسم الأيمن - الأسعار والإعدادات */}
            <div className="space-y-6">
              
              {/* الأسعار */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                <h3 className="text-lg font-semibold mb-4 text-primary border-b pb-2">
                  {t("prices") || "الأسعار"}
                </h3>
                <ProductPricingFields formData={formData} setFormData={setFormData} />
              </div>

              {/* صور المنتج */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                <h3 className="text-lg font-semibold mb-4 text-primary border-b pb-2">
                  {t("productImages") || "صور المنتج"}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block font-medium">
                      {t("mainImage")} <span className="text-red-500">*</span>
                    </label>
                    <ImageUpload
                      value={formData.image}
                      onChange={(url) => {
                        const imageUrl = Array.isArray(url) ? url[0] || '' : url;
                        setFormData(prev => ({ 
                          ...prev, 
                          image: imageUrl,
                          // إزالة الصورة الجديدة من الصور الإضافية إذا كانت موجودة
                          images: prev.images?.filter(img => img !== imageUrl) || []
                        }));
                      }}
                      bucket="product-images"
                      label={t("uploadMainImage") || "رفع الصورة الرئيسية"}
                    />
                  </div>
                  
                  <div>
                    <label className="mb-2 block font-medium">
                      {t("additionalImages")} ({t("optional")})
                    </label>
                    <ImageUpload
                      value={formData.images || []}
                      onChange={(urls) => {
                        const imageUrls = Array.isArray(urls) ? urls : [urls].filter(Boolean);
                        // إزالة الصورة الرئيسية من الصور الإضافية لتجنب التكرار
                        const filteredUrls = imageUrls.filter(url => url !== formData.image);
                        setFormData(prev => ({ ...prev, images: filteredUrls }));
                      }}
                      bucket="product-images"
                      multiple
                      maxImages={5}
                      label={t("uploadAdditionalImages") || "رفع صور إضافية"}
                    />
                  </div>
                </div>
              </div>

              {/* المخزون والحالة */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                <h3 className="text-lg font-semibold mb-4 text-primary border-b pb-2">
                  {t("stockAndStatus") || "المخزون والحالة"}
                </h3>
                <ProductToggleFields formData={formData} setFormData={setFormData} />
              </div>
            </div>
          </div>
          
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
                className="min-w-[120px] bg-blue-600 text-white font-bold text-base hover:bg-blue-700"
              >
                {isSubmitting ? t("updating") : t("updateProduct")}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog;
