import { useState, useCallback, useMemo } from 'react';
import { ProductVariant, ProductOption, VariantSelection, SelectedVariant } from '@/types/variant';
import { useLanguage } from '@/utils/languageContextUtils';
import { toast } from 'sonner';

interface UseProductVariantsProps {
  productId: string;
  options: ProductOption[];
  variants: ProductVariant[];
  defaultPrice: number;
  defaultWholesalePrice: number;
  defaultImage: string;
  defaultStockQuantity?: number;
}

export const useProductVariants = ({
  productId,
  options,
  variants,
  defaultPrice,
  defaultWholesalePrice,
  defaultImage,
  defaultStockQuantity = 0
}: UseProductVariantsProps) => {
  const { t } = useLanguage();
  const [selection, setSelection] = useState<VariantSelection>({});

  // العثور على الفيرنت المطابق للاختيار الحالي
  const selectedVariant = useMemo<SelectedVariant>(() => {
    // إذا لم يكن هناك خيارات أو لم يتم اختيار أي فيرنت
    if (!options.length || Object.keys(selection).length === 0) {
      return {
        variant: null,
        isAvailable: true,
        price: defaultPrice,
        wholesale_price: defaultWholesalePrice,
        stock_quantity: defaultStockQuantity,
        image: defaultImage
      };
    }

    // البحث عن الفيرنت المطابق
    const matchingVariant = variants.find(variant => {
      return options.every(option => {
        const selectedValue = selection[option.name];
        const variantValue = variant.option_values[option.name];
        return selectedValue === variantValue;
      });
    });

    if (matchingVariant) {
      return {
        variant: matchingVariant,
        isAvailable: matchingVariant.active && matchingVariant.stock_quantity > 0,
        price: matchingVariant.price,
        wholesale_price: matchingVariant.wholesale_price,
        stock_quantity: matchingVariant.stock_quantity,
        image: matchingVariant.image || defaultImage
      };
    }

    // إذا لم يتم العثور على فيرنت مطابق
    return {
      variant: null,
      isAvailable: false,
      price: defaultPrice,
      wholesale_price: defaultWholesalePrice,
      stock_quantity: 0,
      image: defaultImage
    };
  }, [selection, options, variants, defaultPrice, defaultWholesalePrice, defaultImage, defaultStockQuantity]);

  // الحصول على القيم المتاحة لخيار معين بناءً على الاختيارات الحالية
  const getAvailableOptionValues = useCallback((optionName: string): string[] => {
    const option = options.find(opt => opt.name === optionName);
    if (!option) return [];

    // إذا لم يتم اختيار أي فيرنت آخر، إرجاع جميع القيم
    const otherSelections = Object.keys(selection).filter(key => key !== optionName);
    if (otherSelections.length === 0) {
      return option.option_values;
    }

    // فلترة القيم المتاحة بناءً على الاختيارات الأخرى
    const availableValues = option.option_values.filter(value => {
      const testSelection = { ...selection, [optionName]: value };
      
      return variants.some(variant => {
        return options.every(opt => {
          const selectedValue = testSelection[opt.name];
          const variantValue = variant.option_values[opt.name];
          return !selectedValue || selectedValue === variantValue;
        }) && variant.active && variant.stock_quantity > 0;
      });
    });

    return availableValues;
  }, [options, variants, selection]);

  // تحديث اختيار خيار معين
  const updateSelection = useCallback((optionName: string, value: string) => {
    setSelection(prev => {
      const newSelection = { ...prev, [optionName]: value };
      
      // التحقق من صحة الاختيار الجديد
      const availableValues = getAvailableOptionValues(optionName);
      if (!availableValues.includes(value)) {
        toast.error(t('variantNotAvailable') || 'هذا الخيار غير متوفر');
        return prev;
      }

      return newSelection;
    });
  }, [getAvailableOptionValues, t]);

  // مسح جميع الاختيارات
  const clearSelection = useCallback(() => {
    setSelection({});
  }, []);

  // التحقق من اكتمال الاختيار
  const isSelectionComplete = useMemo(() => {
    return options.every(option => selection[option.name]);
  }, [options, selection]);

  // الحصول على معرف الفيرنت المحدد
  const getSelectedVariantId = useCallback(() => {
    return selectedVariant.variant?.id || null;
  }, [selectedVariant]);

  return {
    selection,
    selectedVariant,
    updateSelection,
    clearSelection,
    getAvailableOptionValues,
    isSelectionComplete,
    getSelectedVariantId,
    hasVariants: options.length > 0
  };
};
