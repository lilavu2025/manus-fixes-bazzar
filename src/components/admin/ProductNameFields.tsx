import React from 'react';
import { useLanguage } from '@/utils/languageContextUtils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProductFormData } from '@/types/product';

interface ProductNameFieldsProps {
  formData: ProductFormData;
  setFormData: (data: ProductFormData) => void;
}

const ProductNameFields: React.FC<ProductNameFieldsProps> = ({
  formData,
  setFormData,
}) => {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="name_ar">{t('productNameArabic')}</Label>
        <Input
          id="name_ar"
          value={formData.name_ar}
          onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="name_en">{t('productNameEnglish')}</Label>
        <Input
          id="name_en"
          value={formData.name_en}
          onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="name_he">{t('productNameHebrew')}</Label>
        <Input
          id="name_he"
          value={formData.name_he}
          onChange={(e) => setFormData({ ...formData, name_he: e.target.value })}
          required
        />
      </div>
    </div>
  );
};

export default ProductNameFields;
