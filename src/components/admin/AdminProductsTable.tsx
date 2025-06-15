import React from 'react';
import { useLanguage } from '../../utils/languageContextUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash, Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Product } from '@/types/product';

interface AdminProductsTableProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string, productName: string) => void;
  categories?: { id: string; name: string }[]; // إضافة قائمة الفئات
}

const AdminProductsTable: React.FC<AdminProductsTableProps> = ({
  products,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
  categories = [], // افتراضي مصفوفة فارغة
}) => {
  const { t, language } = useLanguage();

  // دالة لجلب اسم المنتج حسب اللغة
  const getProductName = (product: Product) => {
    if (language === 'ar') return product.name;
    if (language === 'en') return product.nameEn || product.name;
    if (language === 'he') return product.nameHe || product.name;
    return product.name;
  };

  // دالة لجلب اسم الفئة من id
  const getCategoryName = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.name : categoryId;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('products')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader className="text-center">
            <TableRow>
              <TableHead className="text-center">{t('productImage')}</TableHead>
              <TableHead className="text-center">{t('productName')}</TableHead>
              <TableHead className="text-center">{t('category')}</TableHead>
              <TableHead className="text-center">{t('price')}</TableHead>
              <TableHead className="text-center">{t('stockQuantity')}</TableHead>
              <TableHead className="text-center">{t('inStock')}</TableHead>
              <TableHead className="text-center">{t('status')}</TableHead>
              <TableHead className="text-center">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <img
                    src={product.image || '/placeholder.svg'}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-lg border shadow-sm bg-white mx-auto"
                    onError={e => { e.currentTarget.src = '/placeholder.svg'; }}
                  />
                </TableCell>
                <TableCell className="font-medium max-w-[120px] truncate">{getProductName(product)}</TableCell>
                <TableCell>{getCategoryName(product.category)}</TableCell>
                <TableCell>{product.price} {t('currency')}</TableCell>
                <TableCell>{product.stock_quantity || 0}</TableCell>
                <TableCell>
                  <Badge variant={product.inStock ? 'default' : 'destructive'}>
                    {product.inStock ? t('inStock') : t('outOfStock')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={product.active ? 'default' : 'destructive'}>
                    {product.active ? t('active') : t('inactive')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      title={t('view')}
                      onClick={() => onViewProduct(product)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      title={t('edit')}
                      onClick={() => onEditProduct(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" title={t('delete')}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('deleteProduct')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('deleteProductConfirmation')} "{product.name}"?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => onDeleteProduct(product.id, product.name)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {t('delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AdminProductsTable;
