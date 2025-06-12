import React from 'react';
import { useLanguage } from '../../utils/languageContextUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { AdminProductForm } from '@/types/product';
import { useCategoriesRealtime } from '@/hooks/useCategoriesRealtime';
import ProductImageGallery from '@/components/ProductImageGallery';

interface ViewProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: AdminProductForm;
}

const ViewProductDialog: React.FC<ViewProductDialogProps> = ({
  open,
  onOpenChange,
  product,
}) => {
  const { t, language } = useLanguage();
  const { categories, loading: categoriesLoading } = useCategoriesRealtime();

  if (!product) return null;

  // Get the category name based on the current language
  let categoryName = product.category;
  const foundCategory = categories.find((cat) => cat.id === product.category_id || cat.id === product.category);
  if (foundCategory) {
    if (language === 'ar') categoryName = foundCategory.name;
    else if (language === 'en') categoryName = foundCategory.nameEn;
    else if (language === 'he') categoryName = foundCategory.nameHe || foundCategory.name;
    else categoryName = foundCategory.name;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-0 sm:p-0 rounded-2xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl font-bold mb-2">{t('viewProduct')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-8 px-6 pb-6">
          {/* معرض صور احترافي */}
          <div className="w-full md:w-1/2 flex flex-col items-center">
            <ProductImageGallery product={{
              name: product.name_ar || product.name_en || '',
              image: product.image,
              images: product.images,
              discount: product.discount
            }} />
          </div>

          {/* معلومات المنتج */}
          <div className="flex-1 w-full space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">{t('productNames')}</h3>
                <p><strong>{t('arabic')}:</strong> {product.name_ar}</p>
                <p><strong>{t('english')}:</strong> {product.name_en}</p>
                <p><strong>{t('hebrew')}:</strong> {product.name_he}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">{t('category')}</h3>
                <p className={language === 'he' ? 'text-right' : 'text-left'}>{categoryName}</p>
                <div className="flex flex-wrap gap-2 mt-2 items-center">
                  <Badge variant={product.in_stock ? 'default' : 'destructive'}>
                    {product.in_stock ? t('inStock') : t('outOfStock')}
                  </Badge>
                  {product.featured && (
                    <Badge variant="secondary">{t('featured')}</Badge>
                  )}
                  {typeof product.active === 'boolean' && (
                    <Badge variant={product.active ? 'default' : 'destructive'}>
                      {product.active ? t('active') : t('inactive')}
                    </Badge>
                  )}
                  {typeof product.stock_quantity === 'number' && (
                    <Badge variant="outline">{t('stockQuantity')}: {product.stock_quantity}</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* جدول مواصفات مختصر إذا توفرت بيانات إضافية */}
            {product.tags && product.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-1">{t('tags')}</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* الوصف */}
            <div>
              <h3 className="text-lg font-semibold mb-2">{t('descriptions')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <strong>{t('arabic')}:</strong>
                  <p className="text-gray-600 whitespace-pre-line break-words">{product.description_ar}</p>
                </div>
                <div>
                  <strong>{t('english')}:</strong>
                  <p className="text-gray-600 whitespace-pre-line break-words">{product.description_en}</p>
                </div>
                <div>
                  <strong>{t('hebrew')}:</strong>
                  <p className="text-gray-600 whitespace-pre-line break-words">{product.description_he}</p>
                </div>
              </div>
            </div>

            {/* التسعير */}
            <div>
              <h3 className="text-lg font-semibold mb-2">{t('pricing')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <strong>{t('price')}:</strong>
                  <p>{product.price} {t('currency')}</p>
                </div>
                {product.original_price && (
                  <div>
                    <strong>{t('originalPrice')}:</strong>
                    <p>{product.original_price} {t('currency')}</p>
                  </div>
                )}
                {product.wholesale_price && (
                  <div>
                    <strong>{t('wholesalePrice')}:</strong>
                    <p>{product.wholesale_price} {t('currency')}</p>
                  </div>
                )}
                {typeof product.discount !== 'undefined' && product.discount !== null && (
                  <div>
                    <strong>{t('discount')}:</strong>
                    <p>{product.discount}%</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6">
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            {t('close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewProductDialog;
