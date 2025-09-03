import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/utils/languageContextUtils';
import { ProductOption, VariantSelection } from '@/types/variant';
import { cn } from '@/lib/utils';

interface ProductVariantSelectorProps {
  options: ProductOption[];
  selection: VariantSelection;
  onSelectionChange: (optionName: string, value: string) => void;
  getAvailableValues: (optionName: string) => string[];
  className?: string;
  disabled?: boolean;
}

const ProductVariantSelector: React.FC<ProductVariantSelectorProps> = ({
  options,
  selection,
  onSelectionChange,
  getAvailableValues,
  className,
  disabled = false,
}) => {
  const { t, isRTL, language } = useLanguage();

  const tryParseI18n = (val?: string | null): { ar?: string; en?: string; he?: string } | null => {
    if (!val) return null;
    try {
      const parsed = JSON.parse(val);
      if (parsed && (typeof parsed === 'object') && ('ar' in parsed || 'en' in parsed || 'he' in parsed)) {
        return parsed as any;
      }
    } catch {}
    return null;
  };

  const toDisplay = (val: string): string => {
    const obj = tryParseI18n(val);
    if (!obj) return val;
    return (language === 'en' ? (obj.en || obj.ar || obj.he) : language === 'he' ? (obj.he || obj.en || obj.ar) : (obj.ar || obj.en || obj.he)) || '';
  };

  if (!options.length) return null;

  return (
    <div className={cn('space-y-3', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <h3 className={cn('text-lg font-semibold text-gray-900 dark:text-white', isRTL ? 'text-right' : 'text-left')}>
        {t('selectVariant') || 'اختر المواصفات'}
      </h3>
      {options
        .sort((a, b) => a.option_position - b.option_position)
        .map((option) => {
          const availableValues = getAvailableValues(option.name);
          const selectedValue = selection[option.name];
          const optionLabel = toDisplay(option.name);
          return (
            <div key={option.id} className="space-y-2">
              <div
                className={cn(
                  'flex flex-wrap gap-2',
                  isRTL ? 'text-right' : 'text-left'
                )}
              >
                <label
                  className={cn(
                    'text-sm font-medium text-gray-700 dark:text-gray-300',
                    isRTL ? 'text-right' : 'text-left'
                  )}
                >
                  {optionLabel} {selectedValue && `(${toDisplay(selectedValue)})` + ':'}
                </label>
                {option.option_values.map((value) => {
                  const isAvailable = availableValues.includes(value);
                  const isSelected = selectedValue === value;
                  const isBtnDisabled = disabled || !isAvailable;
                  return (
                    <Button
                      key={value}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      disabled={isBtnDisabled}
                      onClick={() => {
                        if (isBtnDisabled) return;
                        onSelectionChange(option.name, value);
                      }}
                      className={cn(
                        'min-w-[60px]',
                        isSelected && 'ring-2 ring-primary ring-offset-1',
                        (!isAvailable || disabled) && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {toDisplay(value)}
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default ProductVariantSelector;
