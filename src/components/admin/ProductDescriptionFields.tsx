
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ProductFormData } from '@/types/product';
import { useLanguage } from '@/utils/languageContextUtils';

interface ProductDescriptionFieldsProps {
  formData: ProductFormData;
  setFormData: (data: ProductFormData) => void;
}

const ProductDescriptionFields: React.FC<ProductDescriptionFieldsProps> = ({
  formData,
  setFormData,
}) => {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="description_ar">{t('descriptionArabic')}</Label>
        <Textarea
          id="description_ar"
          value={formData.description_ar}
          onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="description_en">{t('descriptionEnglish')}</Label>
        <Textarea
          id="description_en"
          value={formData.description_en}
          onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="description_he">{t('descriptionHebrew')}</Label>
        <Textarea
          id="description_he"
          value={formData.description_he}
          onChange={(e) => setFormData({ ...formData, description_he: e.target.value })}
        />
      </div>
    </div>
  );
};

export default ProductDescriptionFields;
