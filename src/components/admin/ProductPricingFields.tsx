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
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <Label htmlFor="price" className="mb-2 block text-green-700 dark:text-green-300 font-medium">
            {t('price')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            required
            className="border-green-200 focus:border-green-400"
          />
        </div>
        
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Label htmlFor="original_price" className="mb-2 block font-medium">
            {t('originalPrice')}
          </Label>
          <Input
            id="original_price"
            type="number"
            step="0.01"
            value={formData.original_price}
            onChange={(e) => setFormData({ ...formData, original_price: Number(e.target.value) })}
          />
        </div>
        
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Label htmlFor="wholesale_price" className="mb-2 block text-blue-700 dark:text-blue-300 font-medium">
            {t('wholesalePrice')}
          </Label>
          <Input
            id="wholesale_price"
            type="number"
            step="0.01"
            value={formData.wholesale_price}
            onChange={(e) => setFormData({ ...formData, wholesale_price: Number(e.target.value) })}
            className="border-blue-200 focus:border-blue-400"
          />
        </div>
        
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <Label htmlFor="discount" className="mb-2 block text-purple-700 dark:text-purple-300 font-medium">
            {t('discount')} (%)
          </Label>
          <Input
            id="discount"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.discount}
            onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
            className="border-purple-200 focus:border-purple-400"
          />
        </div>
      </div>
      
      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <Label htmlFor="stock_quantity" className="mb-2 block text-yellow-700 dark:text-yellow-300 font-medium">
          {t('stockQuantity')} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="stock_quantity"
          type="number"
          min="0"
          value={formData.stock_quantity}
          onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
          required
          className="border-yellow-200 focus:border-yellow-400"
        />
      </div>
    </div>
  );
};

export default ProductPricingFields;
