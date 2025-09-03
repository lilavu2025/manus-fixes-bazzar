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
  const { t, isRTL } = useLanguage();

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
                  {option.name} {selectedValue && `(${selectedValue})` + ':'}
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
                      {value}
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
