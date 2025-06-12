import React from 'react';
import { useLanguage } from '../../utils/languageContextUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Category } from '@/types/product';

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
  const { t } = useLanguage();

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full p-0 overflow-hidden rounded-2xl shadow-xl">
        <DialogHeader className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b">
          <DialogTitle className="text-xl font-bold text-blue-900 flex items-center gap-2">
            {t('viewCategory')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 px-6 py-6 bg-white dark:bg-gray-900">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-28 h-28 rounded-xl overflow-hidden border bg-gray-50 flex items-center justify-center mb-2">
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.name}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-gray-400 text-xs">{t('noImage')}</span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {category.name}
            </h2>
            {typeof category.active !== 'undefined' && (
              <Badge
                variant={category.active ? 'default' : 'destructive'}
                className="ml-2"
              >
                {category.active ? t('active') : t('inactive')}
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {t('categoryNames')}
              </h3>
              <div className="space-y-1">
                <p>
                  <strong>{t('arabic')}:</strong> {category.name}
                </p>
                <p>
                  <strong>{t('english')}:</strong> {category.nameEn}
                </p>
                <p>
                  <strong>{t('hebrew')}:</strong> {category.nameHe}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {t('statistics')}
              </h3>
              <div className="flex items-center gap-2">
                <span>{t('productCount')}:</span>
                <Badge variant="secondary">{category.count}</Badge>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-row gap-2 justify-end px-6 pb-6 pt-0 border-t mt-4">
          <Button onClick={() => onOpenChange(false)}>
            {t('close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewCategoryDialog;
