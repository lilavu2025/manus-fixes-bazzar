import React from 'react';
import { useLanguage } from '@/utils/languageContextUtils';
import { useCategories } from '@/hooks/useSupabaseData';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductFormData } from '@/types/product';

interface ProductCategoryFieldProps {
  formData: ProductFormData;
  setFormData: (data: ProductFormData) => void;
}

const ProductCategoryField: React.FC<ProductCategoryFieldProps> = ({
  formData,
  setFormData,
}) => {
  const { isRTL, t, language } = useLanguage();
  const { data, isLoading, error } = useCategories();
  const categories = data ?? [];

  console.log('ProductCategoryField - categories:', categories);
  console.log('ProductCategoryField - loading:', isLoading);
  console.log('ProductCategoryField - error:', error);
  console.log('ProductCategoryField - formData.category_id:', formData.category_id);
  const found = categories.find((cat) => cat.id === formData.category_id);
  console.log('ProductCategoryField - category_id match:', found ? 'MATCH' : 'NO MATCH', found);

  if (isLoading) {
    return (
      <div>
        <Label htmlFor="category">{t('category')}</Label>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder={t("categoriesLoading")} />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Label htmlFor="category">{t('category')}</Label>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder={t("categoriesLoadError")} />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor="category">{t('category')}</Label> <span className="text-red-500">*</span>
      <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
        <SelectTrigger>
          <SelectValue placeholder={t('selectCategory')} />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {(language === 'en' && category.nameEn) ? category.nameEn : (language === 'he' && category.nameHe) ? category.nameHe : category.name /* fallback للعربي */ || category.nameEn || category.nameHe || ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProductCategoryField;
