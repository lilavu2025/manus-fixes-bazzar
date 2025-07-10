import React from 'react';
import { useLanguage } from '@/utils/languageContextUtils';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ProductFormData } from '@/types/product';

interface ProductToggleFieldsProps {
  formData: ProductFormData;
  setFormData: (data: ProductFormData) => void;
}

const ProductToggleFields: React.FC<ProductToggleFieldsProps> = ({
  formData,
  setFormData,
}) => {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2 rtl:space-x-reverse p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Switch
            id="in_stock"
            checked={formData.in_stock}
            onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })}
          />
          <Label htmlFor="in_stock" className="font-medium">{t('inStock')}</Label>
        </div>
        
        <div className="flex items-center space-x-2 rtl:space-x-reverse p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Switch
            id="featured"
            checked={formData.featured}
            onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
          />
          <Label htmlFor="featured" className="font-medium">{t('featured')}</Label>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 rtl:space-x-reverse p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <Switch
          id="active"
          checked={formData.active}
          onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
        />
        <Label htmlFor="active" className="font-medium text-green-700 dark:text-green-300">{t("active")}</Label>
      </div>
    </div>
  );
};

export default ProductToggleFields;
