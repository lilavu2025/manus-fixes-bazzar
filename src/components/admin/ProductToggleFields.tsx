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
    <div className="flex items-center gap-6">
      <div className="flex items-center space-x-2">
        <Switch
          id="in_stock"
          checked={formData.in_stock}
          onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })}
        />
        <Label htmlFor="in_stock">{t('inStock')}</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="featured"
          checked={formData.featured}
          onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
        />
        <Label htmlFor="featured">{t('featured')}</Label>
      </div>
      <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, active: checked })
                }
              />
              <Label htmlFor="active">{t("active")}</Label>
            </div>
    </div>
  );
};

export default ProductToggleFields;
