import React from 'react';
import { useLanguage, isRTL } from '../../utils/languageContextUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Category } from '@/types/product';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { Copy, Image as ImageIcon, Info } from 'lucide-react';

interface ViewCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category;
}

const ViewCategoryDialog: React.FC<ViewCategoryDialogProps> = ({
  open,
  onOpenChange,
  category,
}) => {
  const { t, language } = useLanguage();
  const rtl = isRTL(language);

  if (!category) return null;

  // نسخ ID الفئة
  const handleCopyId = () => {
    navigator.clipboard.writeText(category.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-w-xl w-full p-0 overflow-hidden rounded-2xl shadow-2xl border-2 border-blue-100 bg-gradient-to-br from-blue-50/80 to-white dark:from-gray-900 dark:to-gray-800 ${
          rtl ? 'rtl' : 'ltr'
        }`}
        style={{ direction: rtl ? 'rtl' : 'ltr' }}
      >
        <DialogHeader className="bg-gradient-to-r from-blue-100 to-blue-200 px-6 py-4 border-b flex items-center justify-between">
          <DialogTitle className="text-xl font-bold text-blue-900 flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-400" />
            {t('viewCategory')}
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" aria-label={t('close')}>
              ×
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="space-y-6 px-6 py-6 bg-white dark:bg-gray-900">
          <div className="flex flex-col md:flex-row md:items-center gap-4 text-center md:text-start">
            <div className="flex flex-col items-center gap-2">
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-blue-200 bg-gray-50 flex items-center justify-center mb-2 shadow-sm">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-gray-400 text-xs flex flex-col items-center gap-1">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    {t('noImage')}
                  </span>
                )}
              </div>
              {category.icon && (
                <span className="text-2xl" title={t('categoryIcon')}>
                  {category.icon}
                </span>
              )}
            </div>
            <div className="flex-1 flex flex-col gap-2 items-center md:items-start">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 break-words">
                {(() => {
                  if (language === 'ar' && category.name) return category.name;
                  if (language === 'en' && category.nameEn) return category.nameEn;
                  if (language === 'he' && category.nameHe) return category.nameHe;
                  return category.name || category.nameEn || category.nameHe || '';
                })()}
              </h2>
              <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start">
                {typeof category.active !== 'undefined' && (
                  <Badge
                    variant={category.active ? 'default' : 'destructive'}
                    className="text-xs px-2 py-1"
                  >
                    {category.active ? t('active') : t('inactive')}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  {t('productCount')}: {category.count ?? 0}
                </Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        onClick={handleCopyId}
                        aria-label={t('copy') + ' ID'}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t('id')}: {category.id}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-blue-800 dark:text-blue-200">
                {t('categoryNames')}
              </h3>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>{t('arabic')}:</strong>{' '}
                  {category.name || (
                    <span className="text-gray-400">{t('notProvided')}</span>
                  )}
                </p>
                <p>
                  <strong>{t('english')}:</strong>{' '}
                  {category.nameEn || (
                    <span className="text-gray-400">{t('notProvided')}</span>
                  )}
                </p>
                <p>
                  <strong>{t('hebrew')}:</strong>{' '}
                  {category.nameHe || (
                    <span className="text-gray-400">{t('notProvided')}</span>
                  )}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-blue-800 dark:text-blue-200">
                {t('statistics')}
              </h3>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span>{t('productCount')}:</span>
                  <Badge variant="secondary">{category.count ?? 0}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>{t('id')}:</span>
                  <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {category.id}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-row gap-2 justify-end px-6 pb-6 pt-0 border-t mt-4">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            {t('close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewCategoryDialog;
