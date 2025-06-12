import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '../../utils/languageContextUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';
import ProductCategoryField from './ProductCategoryField';
import { ProductFormData, Category } from '@/types/product';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSuccess: () => void;
}

const AddProductDialog: React.FC<AddProductDialogProps> = ({
  open,
  onOpenChange,
  categories,
  onSuccess,
}) => {
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name_ar: '',
    name_en: '',
    name_he: '',
    description_ar: '',
    description_en: '',
    description_he: '',
    price: 0,
    original_price: 0,
    wholesale_price: 0,
    category_id: '',
    image: '',
    images: [],
    in_stock: true,
    stock_quantity: 0,
    featured: false,
    active: true,
    discount: 0,
    tags: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        name_ar: formData.name_ar,
        name_en: formData.name_en,
        name_he: formData.name_he,
        description_ar: formData.description_ar,
        description_en: formData.description_en,
        description_he: formData.description_he,
        price: formData.price,
        original_price: formData.original_price || null,
        wholesale_price: formData.wholesale_price || null,
        category_id: formData.category_id,
        image: formData.image || (formData.images.length > 0 ? formData.images[0] : ''),
        images: formData.images,
        in_stock: formData.in_stock,
        stock_quantity: formData.stock_quantity,
        featured: formData.featured,
        active: formData.active,
        discount: formData.discount || null,
      };

      const { error } = await supabase
        .from('products')
        .insert([productData]);

      if (error) throw error;

      toast.success(t('productAdded'));
      onSuccess();
      onOpenChange(false);
      setFormData({
        name_ar: '',
        name_en: '',
        name_he: '',
        description_ar: '',
        description_en: '',
        description_he: '',
        price: 0,
        original_price: 0,
        wholesale_price: 0,
        category_id: '',
        image: '',
        images: [],
        in_stock: true,
        stock_quantity: 0,
        featured: false,
        active: true,
        discount: 0,
        tags: [],
      });
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error adding product:', err);
      toast.error(err.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-3xl max-h-[95vh] overflow-y-auto ${isRTL ? 'text-right' : 'text-left'} p-0`} dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader className="px-6 pt-6 pb-2 border-b">
          <DialogTitle className="text-2xl font-bold">{t('addProduct')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-8 px-6 py-6">
          {/* بيانات المنتج */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">{t('productInfo') || 'بيانات المنتج'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name_ar">اسم المنتج (عربي) <span className="text-red-500">*</span></Label>
                <Input id="name_ar" value={formData.name_ar} onChange={e => setFormData(prev => ({ ...prev, name_ar: e.target.value }))} required />
              </div>
              <div>
                <Label htmlFor="name_en">Product Name (English) <span className="text-red-500">*</span></Label>
                <Input id="name_en" value={formData.name_en} onChange={e => setFormData(prev => ({ ...prev, name_en: e.target.value }))} required />
              </div>
              <div>
                <Label htmlFor="name_he">שם המוצר (עברית) <span className="text-red-500">*</span></Label>
                <Input id="name_he" value={formData.name_he} onChange={e => setFormData(prev => ({ ...prev, name_he: e.target.value }))} required />
              </div>
            </div>
          </div>
          {/* الوصف */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">{t('productDescription') || 'الوصف'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="description_ar">الوصف (عربي)</Label>
                <Textarea id="description_ar" value={formData.description_ar} onChange={e => setFormData(prev => ({ ...prev, description_ar: e.target.value }))} rows={3} />
              </div>
              <div>
                <Label htmlFor="description_en">Description (English)</Label>
                <Textarea id="description_en" value={formData.description_en} onChange={e => setFormData(prev => ({ ...prev, description_en: e.target.value }))} rows={3} />
              </div>
              <div>
                <Label htmlFor="description_he">תיאור (עברית)</Label>
                <Textarea id="description_he" value={formData.description_he} onChange={e => setFormData(prev => ({ ...prev, description_he: e.target.value }))} rows={3} />
              </div>
            </div>
          </div>
          {/* الأسعار */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">{t('prices') || 'الأسعار'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">{t('price')} <span className="text-red-500">*</span></Label>
                <Input id="price" type="number" step="0.01" value={formData.price} onChange={e => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))} required />
              </div>
              <div>
                <Label htmlFor="original_price">السعر الأصلي</Label>
                <Input id="original_price" type="number" step="0.01" value={formData.original_price} onChange={e => setFormData(prev => ({ ...prev, original_price: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label htmlFor="wholesale_price">سعر الجملة</Label>
                <Input id="wholesale_price" type="number" step="0.01" value={formData.wholesale_price} onChange={e => setFormData(prev => ({ ...prev, wholesale_price: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
          </div>
          {/* الفئة والمخزون */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-primary">{t('category')}</h3>
              <ProductCategoryField formData={formData} setFormData={setFormData} />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-primary">{t('stock')}</h3>
              <Label htmlFor="stock_quantity">كمية المخزون</Label>
              <Input id="stock_quantity" type="number" value={formData.stock_quantity} onChange={e => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          {/* الخصم والوسوم */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount">نسبة الخصم (%)</Label>
              <Input id="discount" type="number" step="0.01" min="0" max="100" value={formData.discount} onChange={e => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>
          {/* الصور */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-primary">{t('productImages')}</h3>
            <ImageUpload
              value={formData.images}
              onChange={(urls) => setFormData(prev => ({ 
                ...prev, 
                images: Array.isArray(urls) ? urls : [urls].filter(Boolean),
                image: Array.isArray(urls) && urls.length > 0 ? urls[0] : (typeof urls === 'string' ? urls : prev.image)
              }))}
              label={t('productImages')}
              placeholder={t('uploadImages')}
              multiple={true}
              maxImages={5}
              bucket="product-images"
            />
          </div>
          {/* التبديلات */}
          <div className="flex flex-wrap gap-6 border-t pt-6 mt-2">
            <div className="flex items-center gap-2">
              <Switch id="in_stock" checked={formData.in_stock} onCheckedChange={checked => setFormData(prev => ({ ...prev, in_stock: checked }))} />
              <Label htmlFor="in_stock">{t('inStock')}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="featured" checked={formData.featured} onCheckedChange={checked => setFormData(prev => ({ ...prev, featured: checked }))} />
              <Label htmlFor="featured">منتج مميز</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="active" checked={formData.active} onCheckedChange={checked => setFormData(prev => ({ ...prev, active: checked }))} />
              <Label htmlFor="active">{t('active')}</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="min-w-[100px]">{t('cancel')}</Button>
            <Button type="submit" disabled={loading} className="min-w-[120px] bg-primary text-white font-bold text-base hover:bg-primary/90">
              {loading ? t('loading') : t('add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;
