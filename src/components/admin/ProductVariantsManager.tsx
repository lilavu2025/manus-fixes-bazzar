import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/utils/languageContextUtils';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';
import { ProductOption, ProductVariant, VariantFormData } from '@/types/variant';
import { cn } from '@/lib/utils';
import { Trash2, Plus, Save, X, ChevronDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAllProductOptions } from '@/hooks/useVariantsAPI';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProductVariantsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  options: ProductOption[];
  variants: ProductVariant[];
  onSave: (options: ProductOption[], variants: ProductVariant[]) => Promise<void>;
  loading?: boolean;
}

const ProductVariantsManager: React.FC<ProductVariantsManagerProps> = ({
  open,
  onOpenChange,
  productId,
  productName,
  options: initialOptions,
  variants: initialVariants,
  onSave,
  loading = false
}) => {
  const { t, isRTL } = useLanguage();
  
  const [options, setOptions] = useState<ProductOption[]>(initialOptions);
  const [variants, setVariants] = useState<ProductVariant[]>(initialVariants);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionValues, setNewOptionValues] = useState<string[]>(['']); // تغيير لقائمة من القيم
  const [editingOption, setEditingOption] = useState<ProductOption | null>(null); // لتعديل الخيارات
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [generatingVariants, setGeneratingVariants] = useState(false);
  
  // state للتعديل الجماعي
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    price: '',
    wholesale_price: '',
    stock_quantity: '',
    active: true
  });
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());

  // جلب الخيارات المستخدمة سابقاً
  const { data: previousOptions = [] } = useAllProductOptions();

  // إضافة قيمة جديدة لخيار
  const addOptionValue = useCallback(() => {
    setNewOptionValues(prev => [...prev, '']);
  }, []);

  // حذف قيمة من خيار
  const removeOptionValue = useCallback((index: number) => {
    setNewOptionValues(prev => prev.filter((_, i) => i !== index));
  }, []);

  // تحديث قيمة خيار
  const updateOptionValue = useCallback((index: number, value: string) => {
    setNewOptionValues(prev => prev.map((v, i) => i === index ? value : v));
  }, []);

  // إضافة خيار جديد أو تحديث موجود
  const addOrUpdateOption = useCallback(() => {
    if (!newOptionName.trim()) {
      toast.error(t('pleaseEnterOptionName') || 'يرجى إدخال اسم الخيار');
      return;
    }

    const values = newOptionValues.map(v => v.trim()).filter(Boolean);
    if (values.length === 0) {
      toast.error(t('pleaseEnterValidValues') || 'يرجى إدخال قيم صحيحة');
      return;
    }

    // التحقق من وجود خيار بنفس الاسم (باستثناء الخيار المُحرر حالياً)
    const existingOption = options.find(opt => 
      opt.name.toLowerCase() === newOptionName.trim().toLowerCase() && 
      opt.id !== editingOption?.id
    );

    if (existingOption) {
      // إضافة القيم الجديدة للخيار الموجود
      const updatedOptions = options.map(opt => {
        if (opt.id === existingOption.id) {
          const combinedValues = [...new Set([...opt.option_values, ...values])];
          return { ...opt, option_values: combinedValues };
        }
        return opt;
      });
      setOptions(updatedOptions);
      toast.success(t('valuesAddedToExistingOption') || 'تم إضافة القيم للخيار الموجود');
    } else if (editingOption) {
      // تحديث خيار موجود
      const updatedOptions = options.map(opt => 
        opt.id === editingOption.id 
          ? { ...opt, name: newOptionName.trim(), option_values: values }
          : opt
      );
      setOptions(updatedOptions);
      toast.success(t('optionUpdated') || 'تم تحديث الخيار');
    } else {
      // إضافة خيار جديد
      const newOption: ProductOption = {
        id: `temp_${Date.now()}`,
        product_id: productId,
        name: newOptionName.trim(),
        option_values: values,
        option_position: options.length,
        created_at: new Date().toISOString()
      };
      setOptions(prev => [...prev, newOption]);
      toast.success(t('optionAdded') || 'تم إضافة الخيار');
    }

    // إعادة تعيين النموذج
    setNewOptionName('');
    setNewOptionValues(['']);
    setEditingOption(null);
  }, [newOptionName, newOptionValues, options, editingOption, productId, t]);

  // بدء تعديل خيار
  const startEditingOption = useCallback((option: ProductOption) => {
    setNewOptionName(option.name);
    setNewOptionValues(option.option_values);
    setEditingOption(option);
  }, []);

  // إلغاء تعديل خيار
  const cancelEditingOption = useCallback(() => {
    setNewOptionName('');
    setNewOptionValues(['']);
    setEditingOption(null);
  }, []);

  // دوال التعديل الجماعي
  const toggleVariantSelection = useCallback((variantId: string) => {
    setSelectedVariants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(variantId)) {
        newSet.delete(variantId);
      } else {
        newSet.add(variantId);
      }
      return newSet;
    });
  }, []);

  const selectAllVariants = useCallback(() => {
    setSelectedVariants(new Set(variants.map(v => v.id)));
  }, [variants]);

  const clearVariantSelection = useCallback(() => {
    setSelectedVariants(new Set());
  }, []);

  const applyBulkEdit = useCallback(() => {
    if (selectedVariants.size === 0) {
      toast.error(t('pleaseSelectVariants') || 'يرجى اختيار فيرنتس للتعديل');
      return;
    }

    const updatedVariants = variants.map(variant => {
      if (selectedVariants.has(variant.id)) {
        return {
          ...variant,
          ...(bulkEditData.price && { price: parseFloat(bulkEditData.price) }),
          ...(bulkEditData.wholesale_price && { wholesale_price: parseFloat(bulkEditData.wholesale_price) }),
          ...(bulkEditData.stock_quantity && { stock_quantity: parseInt(bulkEditData.stock_quantity) }),
          active: bulkEditData.active
        };
      }
      return variant;
    });

    setVariants(updatedVariants);
    setBulkEditMode(false);
    setSelectedVariants(new Set());
    setBulkEditData({
      price: '',
      wholesale_price: '',
      stock_quantity: '',
      active: true
    });
    
    toast.success(t('bulkEditApplied') || `تم تطبيق التعديل على ${selectedVariants.size} فيرنت`);
  }, [selectedVariants, variants, bulkEditData, t]);

  // حذف خيار
  const deleteOption = useCallback((optionId: string) => {
    setOptions(prev => prev.filter(opt => opt.id !== optionId));
    // حذف الفيرنتس المرتبطة بهذا الخيار
    setVariants(prev => prev.filter(variant => 
      !Object.keys(variant.option_values).some(key => {
        const option = options.find(opt => opt.name === key);
        return option?.id === optionId;
      })
    ));
    toast.success(t('optionDeleted') || 'تم حذف الخيار');
  }, [options, t]);

  // توليد جميع التركيبات الممكنة للفيرنتس
  const generateAllVariants = useCallback(() => {
    if (options.length === 0) {
      toast.error(t('pleaseAddOptionsFirst') || 'يرجى إضافة الخيارات أولاً');
      return;
    }

    setGeneratingVariants(true);
    
    // توليد جميع التركيبات
    const generateCombinations = (opts: ProductOption[]): Record<string, string>[] => {
      if (opts.length === 0) return [{}];
      
      const [first, ...rest] = opts;
      const restCombinations = generateCombinations(rest);
      
      return first.option_values.flatMap(value =>
        restCombinations.map(combo => ({
          [first.name]: value,
          ...combo
        }))
      );
    };

    const combinations = generateCombinations(options);
    const newVariants: ProductVariant[] = combinations.map((combo, index) => ({
      id: `temp_${Date.now()}_${index}`,
      product_id: productId,
      sku: `${productId}-${Object.values(combo).join('-')}`,
      price: 0,
      wholesale_price: 0,
      stock_quantity: 0,
      active: true,
      image: '',
      option_values: combo,
      created_at: new Date().toISOString()
    }));

    setVariants(newVariants);
    setGeneratingVariants(false);
    toast.success(t('variantsGenerated') || 'تم توليد الفيرنتس');
  }, [options, productId, t]);

  // تحديث فيرنت
  const updateVariant = useCallback((variantId: string, updates: Partial<ProductVariant>) => {
    setVariants(prev => prev.map(variant => 
      variant.id === variantId ? { ...variant, ...updates } : variant
    ));
  }, []);

  // حذف فيرنت
  const deleteVariant = useCallback((variantId: string) => {
    setVariants(prev => prev.filter(variant => variant.id !== variantId));
    toast.success(t('variantDeleted') || 'تم حذف الفيرنت');
  }, [t]);

  // حفظ التغييرات
  const handleSave = useCallback(async () => {
    if (options.length > 0 && variants.length === 0) {
      toast.error(t('pleaseAddVariantsOrRemoveOptions') || 'يرجى إضافة فيرنتس أو إزالة الخيارات');
      return;
    }

    // التحقق من صحة البيانات
    const invalidVariants = variants.filter(variant => 
      !variant.sku || variant.price <= 0 || variant.wholesale_price <= 0
    );

    if (invalidVariants.length > 0) {
      toast.error(t('pleaseCompleteVariantData') || 'يرجى إكمال بيانات جميع الفيرنتس');
      return;
    }

    try {
      await onSave(options, variants);
      onOpenChange(false);
      toast.success(t('variantsSaved') || 'تم حفظ الفيرنتس');
    } catch (error) {
      toast.error(t('errorSavingVariants') || 'خطأ في حفظ الفيرنتس');
    }
  }, [options, variants, onSave, onOpenChange, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={isRTL ? 'rtl' : 'ltr'}
        className={cn(
          'max-w-6xl max-h-[90vh] overflow-hidden',
          isRTL ? 'rtl text-right' : 'text-left'
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {t('manageProductVariants') || 'إدارة فيرنتس المنتج'}: {productName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="options" className="w-full">
          <TabsList className={cn("w-full", isRTL ? "flex flex-row-reverse" : "flex") }>
            <TabsTrigger value="options" className="flex-1">
              {t('options') || 'الخيارات'} ({options.length})
            </TabsTrigger>
            <TabsTrigger value="variants" className="flex-1">
              {t('variants') || 'الفيرنتس'} ({variants.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="options" className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* إضافة خيار جديد */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">{t('addNewOption') || 'إضافة خيار جديد'}</h4>
              
              {/* خيارات سابقة */}
              {previousOptions.length > 0 && !editingOption && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-md">
                  <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {t('previouslyUsedOptions') || 'خيارات مستخدمة سابقاً'}
                  </Label>
                  <div className={cn("flex flex-wrap gap-2 mt-2", isRTL && "justify-end") }>
                    {previousOptions.map((prevOption, index) => (
                      <DropdownMenu key={index}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs bg-white dark:bg-gray-800"
                          >
                            {prevOption.name}
                            <ChevronDown className={cn('w-3 h-3', isRTL ? 'mr-1' : 'ml-1')} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => {
                              setNewOptionName(prevOption.name);
                              setNewOptionValues(prevOption.option_values);
                            }}
                          >
                            استخدام كامل ({prevOption.option_values.join(', ')})
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setNewOptionName(prevOption.name);
                              setNewOptionValues(['']);
                            }}
                          >
                            اسم الخيار فقط
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ))}
                  </div>
                </div>
              )}

              {editingOption && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                      {t('editingOption') || 'تعديل الخيار'}: {editingOption.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelEditingOption}
                      className="text-yellow-700 dark:text-yellow-300"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <Label>{t('optionName') || 'اسم الخيار'}</Label>
                  <Input
                    value={newOptionName}
                    onChange={(e) => setNewOptionName(e.target.value)}
                    placeholder={t('optionNamePlaceholder') || 'مثل: اللون، الحجم'}
                  />
                </div>
                
                <div>
                  <div className={cn("flex items-center justify-between mb-2", isRTL && "flex-row-reverse") }>
                    <Label>{t('optionValues') || 'قيم الخيار'}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOptionValue}
                    >
                      <Plus className={cn('w-4 h-4', isRTL ? 'ml-1' : 'mr-1')} />
                      {t('addValue') || 'إضافة قيمة'}
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {newOptionValues.map((value, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={value}
                          onChange={(e) => updateOptionValue(index, e.target.value)}
                          placeholder={t('optionValuePlaceholder') || 'مثل: أحمر، كبير'}
                          className="flex-1"
                        />
                        {newOptionValues.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeOptionValue(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={addOrUpdateOption} className="flex-1">
                    <Plus className={cn('w-4 h-4', isRTL ? 'ml-2' : 'mr-2')} />
                    {editingOption ? (t('updateOption') || 'تحديث الخيار') : (t('addOption') || 'إضافة الخيار')}
                  </Button>
                  {editingOption && (
                    <Button
                      variant="outline"
                      onClick={cancelEditingOption}
                    >
                      {t('cancel') || 'إلغاء'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* قائمة الخيارات */}
            <div className="space-y-3">
              {options.map((option) => (
                <div key={option.id} className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                  <div className={cn("flex justify-between items-start", isRTL && "flex-row-reverse") }>
                    <div className="flex-1">
                      <h5 className="font-semibold text-lg">{option.name}</h5>
                      <div className="flex flex-wrap gap-2 mt-2" dir={isRTL ? "rtl" : "ltr"}>
                        {option.option_values.map((value) => (
                          <span
                            key={value}
                            className="px-2 py-1 bg-primary/10 text-primary rounded text-sm"
                          >
                            {value}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditingOption(option)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteOption(option.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {options.length > 0 && (
              <Button 
                onClick={generateAllVariants} 
                disabled={generatingVariants}
                className="w-full"
              >
                {generatingVariants ? 
                  (t('generating') || 'جاري التوليد...') : 
                  (t('generateAllVariants') || 'توليد جميع الفيرنتس')
                }
              </Button>
            )}
          </TabsContent>

          <TabsContent value="variants" className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* أدوات التعديل الجماعي */}
            {variants.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className={cn("flex items-center justify-between mb-3", isRTL && "flex-row-reverse") }>
                  <h4 className="font-semibold">{t('bulkEdit') || 'تعديل جماعي'}</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={bulkEditMode ? () => setBulkEditMode(false) : () => setBulkEditMode(true)}
                    >
                      {bulkEditMode ? (t('cancel') || 'إلغاء') : (t('enableBulkEdit') || 'تفعيل التعديل الجماعي')}
                    </Button>
                  </div>
                </div>

                {bulkEditMode && (
                  <div className="space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
                    {/* اختيار الفيرنتس */}
                    <div className="flex gap-2 mb-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllVariants}
                      >
                        {t('selectAll') || 'اختيار الكل'} ({variants.length})
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearVariantSelection}
                      >
                        {t('clearSelection') || 'إلغاء الاختيار'}
                      </Button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        {t('selected') || 'محدد'}: {selectedVariants.size} {t('variants') || 'فيرنت'}
                      </span>
                    </div>

                    {/* حقول التعديل الجماعي */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-sm">{t('price') || 'السعر'}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={t('newPrice') || 'السعر الجديد'}
                          value={bulkEditData.price}
                          onChange={(e) => setBulkEditData(prev => ({ ...prev, price: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">{t('wholesalePrice') || 'سعر الجملة'}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={t('newWholesalePrice') || 'سعر الجملة الجديد'}
                          value={bulkEditData.wholesale_price}
                          onChange={(e) => setBulkEditData(prev => ({ ...prev, wholesale_price: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">{t('stockQuantity') || 'الكمية'}</Label>
                        <Input
                          type="number"
                          placeholder={t('newStockQuantity') || 'الكمية الجديدة'}
                          value={bulkEditData.stock_quantity}
                          onChange={(e) => setBulkEditData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className={cn('flex items-center space-x-2', isRTL && 'space-x-reverse')}>
                          <Switch
                            checked={bulkEditData.active}
                            onCheckedChange={(checked) => setBulkEditData(prev => ({ ...prev, active: checked }))}
                          />
                          <Label className="text-sm">{t('active') || 'فعال'}</Label>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={applyBulkEdit}
                      disabled={selectedVariants.size === 0}
                      className="w-full"
                    >
                      {t('applyBulkEdit') || 'تطبيق التعديل الجماعي'} ({selectedVariants.size} {t('variants') || 'فيرنت'})
                    </Button>
                  </div>
                )}
              </div>
            )}

            {variants.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>{t('noVariantsYet') || 'لا توجد فيرنتس بعد'}</p>
                <p className="text-sm mt-2">
                  {t('addOptionsFirstThenGenerate') || 'أضف الخيارات أولاً ثم قم بتوليد الفيرنتس'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {variants.map((variant) => (
                  <VariantCard
                    key={variant.id}
                    variant={variant}
                    onUpdate={updateVariant}
                    onDelete={deleteVariant}
                    bulkEditMode={bulkEditMode}
                    isSelected={selectedVariants.has(variant.id)}
                    onToggleSelection={() => toggleVariantSelection(variant.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className={cn('w-4 h-4', isRTL ? 'ml-2' : 'mr-2')} />
            {t('cancel') || 'إلغاء'}
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className={cn('w-4 h-4', isRTL ? 'ml-2' : 'mr-2')} />
            {loading ? (t('saving') || 'جاري الحفظ...') : (t('save') || 'حفظ')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// مكون كرت الفيرنت
interface VariantCardProps {
  variant: ProductVariant;
  onUpdate: (variantId: string, updates: Partial<ProductVariant>) => void;
  onDelete: (variantId: string) => void;
  bulkEditMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}

const VariantCard: React.FC<VariantCardProps> = ({ 
  variant, 
  onUpdate, 
  onDelete, 
  bulkEditMode = false,
  isSelected = false,
  onToggleSelection 
}) => {
  const { t, isRTL } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const variantName = Object.entries(variant.option_values)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' - ');

  return (
    <div className={cn(
      "bg-white dark:bg-gray-900 p-4 rounded-lg border",
      bulkEditMode && isSelected && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900"
    )} dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3 flex-1">
          {bulkEditMode && onToggleSelection && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelection}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          )}
          <div>
            <h6 className="font-semibold">{variantName}</h6>
            <p className="text-sm text-gray-500">{t('sku') || 'SKU'}: {variant.sku}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (t('collapse') || 'طي') : (t('expand') || 'توسيع')}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(variant.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div>
            <Label>SKU</Label>
            <Input
              value={variant.sku}
              onChange={(e) => onUpdate(variant.id, { sku: e.target.value })}
            />
          </div>
          
          <div>
            <Label>{t('price') || 'السعر'}</Label>
            <Input
              type="number"
              step="0.01"
              value={variant.price}
              onChange={(e) => onUpdate(variant.id, { price: parseFloat(e.target.value) || 0 })}
            />
          </div>
          
          <div>
            <Label>{t('wholesalePrice') || 'سعر الجملة'}</Label>
            <Input
              type="number"
              step="0.01"
              value={variant.wholesale_price}
              onChange={(e) => onUpdate(variant.id, { wholesale_price: parseFloat(e.target.value) || 0 })}
            />
          </div>
          
          <div>
            <Label>{t('stockQuantity') || 'الكمية'}</Label>
            <Input
              type="number"
              min="0"
              value={variant.stock_quantity}
              onChange={(e) => onUpdate(variant.id, { stock_quantity: parseInt(e.target.value) || 0 })}
            />
          </div>
          
          <div className={cn('flex items-center space-x-2', isRTL && 'space-x-reverse')}>
            <Switch
              checked={variant.active}
              onCheckedChange={(checked) => onUpdate(variant.id, { active: checked })}
            />
            <Label>{t('active') || 'نشط'}</Label>
          </div>
          
          <div className="md:col-span-2 lg:col-span-3">
            <Label>{t('variantImage') || 'صورة الفيرنت'}</Label>
            <ImageUpload
              value={variant.image}
              onChange={(url) => onUpdate(variant.id, { image: Array.isArray(url) ? url[0] || '' : url })}
              bucket="product-images"
              label={t('uploadVariantImage') || 'رفع صورة الفيرنت'}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductVariantsManager;
