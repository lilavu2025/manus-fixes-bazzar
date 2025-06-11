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
  const { t } = useLanguage();

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('viewProduct')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex gap-6">
            <img
              src={product.image}
              alt={product.name_ar}
              className="w-48 h-48 object-cover rounded-lg"
            />
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{t('productNames')}</h3>
                <p><strong>{t('arabic')}:</strong> {product.name_ar}</p>
                <p><strong>{t('english')}:</strong> {product.name_en}</p>
                <p><strong>{t('hebrew')}:</strong> {product.name_he}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold">{t('category')}</h3>
                <p>{product.category}</p>
              </div>

              <div className="flex gap-4">
                <Badge variant={product.in_stock ? 'default' : 'destructive'}>
                  {product.in_stock ? t('inStock') : t('outOfStock')}
                </Badge>
                {product.featured && (
                  <Badge variant="secondary">{t('featured')}</Badge>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">{t('descriptions')}</h3>
            <div className="space-y-2">
              <div>
                <strong>{t('arabic')}:</strong>
                <p className="text-gray-600">{product.description_ar}</p>
              </div>
              <div>
                <strong>{t('english')}:</strong>
                <p className="text-gray-600">{product.description_en}</p>
              </div>
              <div>
                <strong>{t('hebrew')}:</strong>
                <p className="text-gray-600">{product.description_he}</p>
              </div>
            </div>
          </div>

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
              {product.discount && (
                <div>
                  <strong>{t('discount')}:</strong>
                  <p>{product.discount}%</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            {t('close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewProductDialog;
