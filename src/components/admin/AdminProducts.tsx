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
import { BarChart3, Filter, CheckCircle, XCircle } from 'lucide-react';

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

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStock, setFilterStock] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');

  // إحصائيات سريعة
  const totalProducts = products.length;
  const inactiveProducts = products.filter(p => p.active === false).length;
  const lowStockProducts = products.filter(p => p.stock_quantity <= 5).length;

  // فلترة المنتجات
  const filteredProducts = products.filter(product => {
    let pass = true;
    if (filterCategory !== 'all' && product.category !== filterCategory) pass = false;
    if (filterStock === 'low' && product.stock_quantity > 5) pass = false;
    if (filterStock === 'in' && !product.inStock) pass = false;
    if (filterStock === 'out' && product.inStock) pass = false;
    if (filterActive === 'active' && product.active === false) pass = false;
    if (filterActive === 'inactive' && product.active !== false) pass = false;
    return pass;
  });

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
    <div className="space-y-8 max-w-7xl mx-auto px-2 sm:px-4 md:px-8 py-6">
      {/* شريط الإحصائيات */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-xl p-4 flex items-center gap-3 shadow-sm cursor-pointer hover:shadow-md transition"
          onClick={() => {
            setFilterCategory('all');
            setFilterStock('all');
            setFilterActive('all');
          }}
          title={t('showAllProducts') || 'عرض كل المنتجات'}
        >
          <BarChart3 className="h-8 w-8 text-blue-500" />
          <div>
            <div className="text-lg font-bold">{totalProducts}</div>
            <div className="text-xs text-gray-600">{t('products')}</div>
          </div>
        </div>
        <div
          className="bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-xl p-4 flex items-center gap-3 shadow-sm cursor-pointer hover:shadow-md transition"
          onClick={() => {
            setFilterCategory('all');
            setFilterStock('all');
            setFilterActive('inactive');
          }}
          title="عرض المنتجات غير الفعالة"
        >
          <XCircle className="h-8 w-8 text-yellow-500" />
          <div>
            <div className="text-lg font-bold">{inactiveProducts}</div>
            <div className="text-xs text-gray-600">غير فعالة</div>
          </div>
        </div>
        <div
          className="bg-gradient-to-r from-red-100 to-red-50 rounded-xl p-4 flex items-center gap-3 shadow-sm cursor-pointer hover:shadow-md transition"
          onClick={() => {
            setFilterCategory('all');
            setFilterStock('low');
            setFilterActive('all');
          }}
          title="عرض المنتجات منخفضة المخزون"
        >
          <Filter className="h-8 w-8 text-red-500" />
          <div>
            <div className="text-lg font-bold">{lowStockProducts}</div>
            <div className="text-xs text-gray-600">منخفضة المخزون (&le;5)</div>
          </div>
        </div>
      </div>
      {/* شريط الفلاتر */}
      <div className="flex flex-wrap gap-2 items-center bg-white rounded-xl p-3 shadow-sm border mt-4 relative">
        <span className="font-medium text-gray-700">{t('filters')}:</span>
        <select className="border rounded px-2 py-1" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="all">{t('allCategories')}</option>
          {productCategories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <select className="border rounded px-2 py-1" value={filterStock} onChange={e => setFilterStock(e.target.value)}>
          <option value="all">{t('allStock')}</option>
          <option value="low">{t('lowStock')}</option>
          <option value="in">{t('inStock')}</option>
          <option value="out">{t('outOfStock')}</option>
        </select>
        <select className="border rounded px-2 py-1" value={filterActive} onChange={e => setFilterActive(e.target.value)}>
          <option value="all">{t('allStatus')}</option>
          <option value="active">{t('active')}</option>
          <option value="inactive">{t('inactive')}</option>
        </select>
        <button
          type="button"
          className="ml-auto px-4 py-2 rounded-lg bg-red-600 text-white font-bold shadow border border-red-700 hover:bg-red-700 transition-all duration-200"
          onClick={() => {
            setFilterCategory('all');
            setFilterStock('all');
            setFilterActive('all');
          }}
        >
          <span className="inline-block align-middle">{t('resetFilters') || 'تصفير الفلاتر'}</span>
        </button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
        <AdminProductsHeader
          productCount={filteredProducts.length}
          onAddProduct={() => setShowAddDialog(true)}
        />
      </div>
      {filteredProducts.length === 0 ? (
        <AdminProductsEmptyState onAddProduct={() => setShowAddDialog(true)} />
      ) : (
        <div className="overflow-x-auto rounded-xl shadow-lg bg-white mt-4">
          <AdminProductsTable
            products={filteredProducts}
            onViewProduct={handleViewProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            categories={productCategories}
          />
        </div>
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
