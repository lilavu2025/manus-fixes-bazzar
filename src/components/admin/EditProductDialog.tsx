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
import {
  Product,
  ProductFormData,
  Category,
  AdminProductForm,
} from "@/types/product";
import { mapProductToFormData } from "./productMappingUtils";
import { useProductsRealtime } from "@/hooks/useProductsRealtime";

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
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // تهيئة البيانات عند تحميل المنتج والتصنيفات
  useEffect(() => {
    if (product && categories.length > 0) {
      const imgs = Array.isArray(product.images)
        ? product.images
        : [product.image].filter(Boolean);
      const matched = categories.find(
        (c) => c.id === product.category_id || c.id === product.category,
      );
      setFormData({
        ...formData,
        name_ar: product.name_ar,
        name_en: product.name_en,
        name_he: product.name_he,
        description_ar: product.description_ar,
        description_en: product.description_en,
        description_he: product.description_he,
        price: product.price,
        original_price: product.original_price,
        wholesale_price: product.wholesale_price,
        image: product.image,
        images: imgs,
        category_id: matched?.id || "",
        in_stock: product.in_stock ?? true,
        discount: product.discount ?? 0,
        featured: product.featured ?? false,
        active: product.active ?? true,
        tags: product.tags || [],
        stock_quantity: product.stock_quantity || 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // التأكد من أن الصورة الرئيسية هي أول صورة في المصفوفة
      const imgs = formData.images.length
        ? formData.images
        : [formData.image].filter(Boolean);
      const main = imgs[0] || formData.image;
      const { data, error } = await supabase
        .from("products")
        .update({
          ...formData,
          images: imgs,
          image: main,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">{t("editProduct")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <ProductNameFields formData={formData} setFormData={setFormData} />
          <ProductDescriptionFields
            formData={formData}
            setFormData={setFormData}
          />
          <ImageUpload
            value={formData.images}
            onChange={(imgs) =>
              setFormData((prev) => ({
                ...prev,
                images: Array.isArray(imgs) ? imgs : [imgs],
                image: (Array.isArray(imgs) ? imgs[0] : imgs) || prev.image,
              }))
            }
            bucket="product-images"
            label={t("productImages")}
            multiple
            maxImages={5}
          />

          {/* حقل اختيار الفئة */}
          <div className="flex flex-col">
            <label className="mb-2 font-medium">{t("category")}</label>
            <select
              value={formData.category_id}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  category_id: e.target.value,
                }))
              }
              className="border p-2 rounded"
            >
              <option value="">{t("selectCategory")}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <ProductPricingFields formData={formData} setFormData={setFormData} />
          <ProductToggleFields formData={formData} setFormData={setFormData} />

          <DialogFooter className="flex flex-row gap-2 justify-end pt-4 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("updating") : t("updateProduct")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog;
