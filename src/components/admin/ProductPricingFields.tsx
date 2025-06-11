import React from 'react';
import { useLanguage } from '@/utils/languageContextUtils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProductFormData } from '@/types/product';

interface ProductPricingFieldsProps {
  formData: ProductFormData;
  setFormData: (data: ProductFormData) => void;
}

const ProductPricingFields: React.FC<ProductPricingFieldsProps> = ({
  formData,
  setFormData,
}) => {
  const { t } = useLanguage();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="price">{t('price')}</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            required
          />
        </div>
        <div>
          <Label htmlFor="original_price">{t('originalPrice')}</Label>
          <Input
            id="original_price"
            type="number"
            step="0.01"
            value={formData.original_price}
            onChange={(e) => setFormData({ ...formData, original_price: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="wholesale_price">{t('wholesalePrice')}</Label>
          <Input
            id="wholesale_price"
            type="number"
            step="0.01"
            value={formData.wholesale_price}
            onChange={(e) => setFormData({ ...formData, wholesale_price: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="discount">{t('discount')} (%)</Label>
          <Input
            id="discount"
            type="number"
            step="0.01"
            value={formData.discount}
            onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="stock_quantity">{t('stockQuantity')}</Label>
          <Input
            id="stock_quantity"
            type="number"
            min="0"
            value={formData.stock_quantity}
            onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
            required
          />
        </div>
      </div>
    </>
  );
};

export default ProductPricingFields;
