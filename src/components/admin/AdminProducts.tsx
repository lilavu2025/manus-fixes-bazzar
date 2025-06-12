import React, { useState } from 'react';
import { useLanguage } from '../../utils/languageContextUtils';
import { useProductsRealtime } from '@/hooks/useProductsRealtime';
import { useCategories } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import AdminProductsHeader from './AdminProductsHeader';
import AdminProductsEmptyState from './AdminProductsEmptyState';
import AdminProductsTable from './AdminProductsTable';
import AdminProductsDialogs from './AdminProductsDialogs';
import { Product, ProductFormData, AdminProductForm } from '@/types/product';
import { mapCategoryToProductCategory } from '@/types/index';

const AdminProducts: React.FC = () => {
  const { t } = useLanguage();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AdminProductForm | null>(null);
  const { products, loading: productsLoading, error: productsError, refetch: refetchProducts } = useProductsRealtime();
  const { data: categoriesData } = useCategories();
  const categories = categoriesData && Array.isArray(categoriesData.data) ? categoriesData.data : [];
  // تحويل قائمة الفئات إلى النوع الصحيح قبل تمريرها للمكونات الفرعية
  const productCategories = categories.map(mapCategoryToProductCategory);

  // Helper type for flexible product mapping
  type ProductWithOptionalFields = Product & {
    name_he?: string;
    nameHe?: string;
    description_he?: string;
    descriptionHe?: string;
    category_id?: string;
    discount?: number;
  };

  const mapProductToFormData = (product: ProductWithOptionalFields): AdminProductForm => ({
    id: product.id,
    name_ar: product.name || '',
    name_en: product.nameEn || '',
    name_he: product.nameHe || product.name_he || '',
    description_ar: product.description || '',
    description_en: product.descriptionEn || '',
    description_he: product.descriptionHe || product.description_he || '',
    price: product.price,
    original_price: product.originalPrice || 0,
    wholesale_price: product.wholesalePrice || 0,
    category_id: product.category_id || '', // التصحيح هنا فقط
    category: product.category || '',
    image: product.image,
    images: product.images || [],
    in_stock: product.inStock,
    stock_quantity: product.stock_quantity || 0,
    featured: product.featured || false,
    active: product.active ?? true,
    discount: typeof product.discount === 'number' ? product.discount : 0,
    tags: product.tags || [],
  });

  const handleDeleteProduct = async (productId: string, productName: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: t('productDeleted'),
        description: `${t('productDeletedSuccessfully')} ${productName}`,
      });

      refetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: t('error'),
        description: t('errorDeletingProduct'),
      });
    }
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(mapProductToFormData(product));
    setShowViewDialog(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(mapProductToFormData(product));
    setShowEditDialog(true);
  };

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // استبدل productsData?.data بـ products مباشرة
  const productsList = products;

  return (
    <div className="space-y-6">
      <AdminProductsHeader
        productCount={productsList.length}
        onAddProduct={() => setShowAddDialog(true)}
      />

      {productsList.length === 0 ? (
        <AdminProductsEmptyState onAddProduct={() => setShowAddDialog(true)} />
      ) : (
        <AdminProductsTable
          products={productsList}
          onViewProduct={handleViewProduct}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
          categories={productCategories} // تمرير قائمة الفئات لجدول المنتجات
        />
      )}

      <AdminProductsDialogs
        showAddDialog={showAddDialog}
        setShowAddDialog={setShowAddDialog}
        showEditDialog={showEditDialog}
        setShowEditDialog={setShowEditDialog}
        showViewDialog={showViewDialog}
        setShowViewDialog={setShowViewDialog}
        selectedProduct={selectedProduct}
        categories={productCategories}
        onSuccess={() => refetchProducts()}
      />
    </div>
  );
};

export default AdminProducts;
