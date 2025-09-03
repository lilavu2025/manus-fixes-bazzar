import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/utils/languageContextUtils";
import { useProductOptions, useProductVariants } from "@/hooks/useVariantsAPI";

interface ProductVariantMiniSelectorProps {
  productId: string;
  compact?: boolean;
  className?: string;
  onVariantChange?: (variant: any) => void;
  showSelectedInfo?: boolean; // إخفاء/إظهار معلومات الفيرنت المختار
  disabled?: boolean; // تعطيل الاختيار عند نفاد المخزون
}

interface ProductOption {
  id: string;
  name: string;
  option_values: string[];
  option_position: number;
}

interface ProductVariant {
  id: string;
  price: number;
  wholesale_price: number;
  stock_quantity: number;
  option_values: Record<string, string>;
  sku: string;
  image?: string;
  active: boolean;
}

const ProductVariantMiniSelector: React.FC<ProductVariantMiniSelectorProps> = ({
  productId,
  compact = false,
  className = "",
  onVariantChange,
  showSelectedInfo = true,
  disabled = false
}) => {
  const { t, isRTL, language } = useLanguage();
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // استخدام hooks لجلب البيانات
  const { data: options = [], isLoading: optionsLoading } = useProductOptions(productId);
  const { data: variants = [], isLoading: variantsLoading } = useProductVariants(productId);
  
  const loading = optionsLoading || variantsLoading;

  // تحديد الفيرنت الافتراضي عند تحميل البيانات
  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      const firstVariant = variants[0];
      setSelectedVariant(firstVariant);
      setSelectedOptions(firstVariant.option_values);
      onVariantChange?.(firstVariant);
    }
  }, [variants, selectedVariant, onVariantChange]);

  // تحديد خيار معين
  const handleOptionSelect = (optionName: string, value: string) => {
    const newSelectedOptions = {
      ...selectedOptions,
      [optionName]: value
    };
    setSelectedOptions(newSelectedOptions);

    // البحث عن الفيرنت المطابق
    const matchingVariant = variants.find(variant => {
      const variantOptions = variant.option_values as Record<string, string>;
      return Object.keys(newSelectedOptions).every(
        key => variantOptions[key] === newSelectedOptions[key]
      );
    });

    if (matchingVariant) {
      setSelectedVariant(matchingVariant);
      onVariantChange?.(matchingVariant);
    } else {
      // لم يتم العثور على فيرنت مطابق
      setSelectedVariant(null);
      onVariantChange?.(null);
    }
  };

  // إذا لم توجد خيارات أو فيرنتس، لا نعرض شيء
  if (loading || !options.length || !variants.length) {
    return null;
  }

  if (compact) {
    // العرض المضغوط للمنتجات في البطاقات
    return (
      <div className={`space-y-2 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
        {options.slice(0, 2).map((option) => (
          <div key={option.id} className="space-y-1">
            <div className="flex flex-wrap gap-1">
              <label className="text-xs font-medium text-gray-700">
                {option.name+":"}
              </label>
              {option.option_values.slice(0, 3).map((value) => {
                const isSelected = selectedOptions[option.name] === value;
                return (
                  <Button
                    key={value}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={`h-6 px-2 text-xs ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={disabled}
                    onClick={(e) => {
                      if (disabled) return;
                      e.preventDefault();
                      e.stopPropagation();
                      handleOptionSelect(option.name, value);
                    }}
                  >
                    {value}
                  </Button>
                );
              })}
              {option.option_values.length > 3 && (
                <Badge variant="secondary" className="h-6 px-2 text-xs">
                  +{option.option_values.length - 3}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // العرض الكامل للاستعراض السريع
  return (
    <div className={`space-y-4 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {options.map((option) => (
        <div key={option.id} className="space-y-2">
          <label className="text-sm font-medium text-gray-900">
            {option.name}
          </label>
          <div className="flex flex-wrap gap-2">
            {option.option_values.map((value) => {
              const isSelected = selectedOptions[option.name] === value;
              return (
                <Button
                  key={value}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className={`h-8 px-3 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={disabled}
                  onClick={(e) => {
                    if (disabled) return;
                    e.preventDefault();
                    e.stopPropagation();
                    handleOptionSelect(option.name, value);
                  }}
                >
                  {value}
                </Button>
              );
            })}
          </div>
        </div>
      ))}
      
  {showSelectedInfo && selectedVariant && (
        <div className={`bg-gray-50 p-3 rounded-lg space-y-2 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h4 className="font-medium text-sm">{t("selectedVariant")}:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">{t("price")}:</span>
              <span className={`font-semibold ${isRTL ? 'mr-1' : 'ml-1'}`}>
                {selectedVariant.price} {t("currency")}
              </span>
            </div>
            {selectedVariant.stock_quantity !== null && (
              <div>
                <span className="text-gray-600">{t("stock")}:</span>
                <span className={`${isRTL ? 'mr-1' : 'ml-1'} ${selectedVariant.stock_quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                  {selectedVariant.stock_quantity}
                </span>
              </div>
            )}
            {selectedVariant.sku && (
              <div className="col-span-2">
                <span className="text-gray-600">{t('sku') || 'SKU'}:</span>
                <span className={`${isRTL ? 'mr-1' : 'ml-1'} font-mono text-xs`}>
                  {selectedVariant.sku}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { ProductVariantMiniSelector };
export default ProductVariantMiniSelector;
