import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "../../utils/languageContextUtils";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";
import ProductCategoryField from "./ProductCategoryField";
import { ProductFormData, Category } from "@/types/product";
import type { Product } from "@/types/product";
import pako from "pako";
import { useInsertProduct } from "@/integrations/supabase/reactQueryHooks";
import { createProductSchema, validateForm } from "@/lib/validation";
import MultiLanguageField from "@/components/ui/MultiLanguageField";
import { Language } from "@/types/language";

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSuccess: () => void;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const AddProductDialog: React.FC<AddProductDialogProps> = ({
  open,
  onOpenChange,
  categories,
  onSuccess,
  setProducts,
}) => {
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
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
    category_id: "",
    image: "",
    images: [],
    in_stock: true,
    stock_quantity: 0,
    featured: false,
    active: true,
    discount: 0,
    tags: [],
  });

  const insertProductMutation = useInsertProduct();

  const compressText = (text: string): string => {
    if (!text || text.length < 100) return text;
    try {
      const compressed = pako.gzip(text);
      // Uint8Array to base64
      return btoa(String.fromCharCode(...compressed));
    } catch {
      return text;
    }
  };

  const decompressText = (compressed: string): string => {
    try {
      // base64 to Uint8Array
      const binaryString = atob(compressed);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return pako.ungzip(bytes, { to: "string" });
    } catch {
      return compressed;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // تحقق من صحة البيانات قبل الإرسال باستخدام الـ schema الديناميكي
    const dynamicProductSchema = createProductSchema();
    const validation = validateForm(dynamicProductSchema, formData);
    if (!validation.success) {
      // عرض جميع رسائل الأخطاء بشكل واضح
      Object.values(validation.errors || {}).forEach((msg) => {
        toast.error(msg);
      });
      setLoading(false);
      return;
    }
    try {
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
      
      const productData = {
        ...formData,
        description_ar: compressText(formData.description_ar),
        description_en: compressText(formData.description_en),
        description_he: compressText(formData.description_he),
        price: formData.price,
        original_price: formData.original_price || null,
        wholesale_price: formData.wholesale_price || null,
        category_id: formData.category_id,
        image: formData.image || (allImages.length > 0 ? allImages[0] : ""),
        images: allImages,
        in_stock: formData.in_stock,
        stock_quantity: formData.stock_quantity,
        featured: formData.featured,
        active: formData.active,
        discount: formData.discount || null,
      };
      const data = await insertProductMutation.mutateAsync(productData);
      if (!data) throw new Error("لم يتم إضافة المنتج");
      toast.success(t("productAdded"));
      if (data)
        setProducts((prev) => [
          ...prev,
          {
            ...data,
            name: data.name_ar,
            nameEn: data.name_en,
            nameHe: data.name_he,
            description: data.description_ar,
            descriptionEn: data.description_en,
            descriptionHe: data.description_he,
            price: data.price,
            originalPrice: data.original_price,
            wholesalePrice: data.wholesale_price,
            image: data.image,
            images: data.images,
            category: data.category_id,
            inStock: data.in_stock,
            rating: 0,
            reviews: 0,
            discount: data.discount,
            featured: data.featured,
            tags: data.tags,
            stock_quantity: data.stock_quantity,
            active: data.active,
            created_at: data.created_at,
          },
        ]);
      onSuccess();
      onOpenChange(false);
      setFormData({
        name_ar: "",
        name_en: "",
        name_he: "",
        description_ar: "",
        description_en: "",
        description_he: "",
        price: 0,
        original_price: 0,
        wholesale_price: 0,
        category_id: "",
        image: "",
        images: [],
        in_stock: true,
        stock_quantity: 0,
        featured: false,
        active: true,
        discount: 0,
        tags: [],
      });
    } catch (error) {
      // عرض رسالة الخطأ بشكل واضح
      toast.error((error as Error).message || "حدث خطأ غير متوقع عند إضافة المنتج");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-w-5xl max-h-[95vh] overflow-y-auto ${isRTL ? "text-right" : "text-left"} p-0`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b">
          <DialogTitle className="text-2xl font-bold text-primary text-center">
            {t("addProduct")}
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
                    onChange={(lang: Language, value: string) =>
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
                  onChange={(lang: Language, value: string) =>
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
                    <Label htmlFor="category" className="mb-2 block">
                      {t("category")} <span className="text-red-500">*</span>
                    </Label>
                    <ProductCategoryField
                      formData={formData}
                      setFormData={setFormData}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tags" className="mb-2 block">
                      {t("tags")} ({t("optional")})
                    </Label>
                    <Input
                      id="tags"
                      value={formData.tags?.join(", ") || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tags: e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean),
                        }))
                      }
                      placeholder={t("tagsPlaceholder") || "علامة1, علامة2, علامة3"}
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
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Label htmlFor="price" className="mb-2 block text-green-700 dark:text-green-300 font-medium">
                      {t("price")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price: parseFloat(e.target.value) || 0,
                        }))
                      }
                      required
                      className="border-green-200 focus:border-green-400"
                    />
                  </div>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Label htmlFor="original_price" className="mb-2 block font-medium">
                      {t("originalPrice") || "السعر الأصلي"} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="original_price"
                      type="number"
                      step="0.01"
                      value={formData.original_price}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          original_price: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Label htmlFor="wholesale_price" className="mb-2 block text-blue-700 dark:text-blue-300 font-medium">
                      {t("wholesalePrice") || "سعر الجملة"} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="wholesale_price"
                      type="number"
                      step="0.01"
                      value={formData.wholesale_price}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          wholesale_price: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="border-blue-200 focus:border-blue-400"
                    />
                  </div>
                </div>
              </div>

              {/* صور المنتج */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                <h3 className="text-lg font-semibold mb-4 text-primary border-b pb-2">
                  {t("productImages") || "صور المنتج"}
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">
                      {t("mainImage")}
                    </Label>
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
                    <Label className="mb-2 block">
                      {t("additionalImages")} ({t("optional")})
                    </Label>
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
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <Label htmlFor="stock_quantity" className="mb-2 block text-yellow-700 dark:text-yellow-300 font-medium">
                      {t("stockQuantity")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      min="0"
                      value={formData.stock_quantity}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          stock_quantity: parseInt(e.target.value) || 0,
                        }))
                      }
                      required
                      className="border-yellow-200 focus:border-yellow-400"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Switch
                        id="in_stock"
                        checked={formData.in_stock}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, in_stock: checked }))
                        }
                      />
                      <Label htmlFor="in_stock" className="font-medium">{t("inStock")}</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 rtl:space-x-reverse p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Switch
                        id="featured"
                        checked={formData.featured}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, featured: checked }))
                        }
                      />
                      <Label htmlFor="featured" className="font-medium">{t("featured")}</Label>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 rtl:space-x-reverse p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, active: checked }))
                      }
                    />
                    <Label htmlFor="active" className="font-medium text-green-700 dark:text-green-300">{t("active")}</Label>
                  </div>
                </div>
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
                disabled={loading}
                className="min-w-[120px] bg-primary text-white font-bold text-base hover:bg-primary/90"
              >
                {loading ? t("loading") : t("add")}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;
