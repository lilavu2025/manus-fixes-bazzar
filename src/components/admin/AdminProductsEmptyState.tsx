import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Package } from 'lucide-react';
import { useLanguage } from '@/utils/languageContextUtils';

interface AdminProductsEmptyStateProps {
  onAddProduct: () => void;
}

const AdminProductsEmptyState: React.FC<AdminProductsEmptyStateProps> = ({
  onAddProduct,
}) => {
  const { t } = useLanguage();

  return (
    <Card>
      <CardContent className="p-12">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noProducts')}</h3>
          <p className="text-gray-500 mb-6">{t('addYourFirstProduct')}</p>
          <Button onClick={onAddProduct} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('addProduct')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminProductsEmptyState;
