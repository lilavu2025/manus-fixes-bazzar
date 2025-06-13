import React from 'react';
import AddProductDialog from './AddProductDialog';
import EditProductDialog from './EditProductDialog';
import ViewProductDialog from './ViewProductDialog';
import { Product, ProductFormData, Category, AdminProductForm } from '@/types/product';

interface AdminProductsDialogsProps {
  showAddDialog: boolean;
  setShowAddDialog: (show: boolean) => void;
  showEditDialog: boolean;
  setShowEditDialog: (show: boolean) => void;
  showViewDialog: boolean;
  setShowViewDialog: (show: boolean) => void;
  selectedProduct: AdminProductForm | null;
  categories: Category[];
  onSuccess: () => void;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const AdminProductsDialogs: React.FC<AdminProductsDialogsProps> = ({
  showAddDialog,
  setShowAddDialog,
  showEditDialog,
  setShowEditDialog,
  showViewDialog,
  setShowViewDialog,
  selectedProduct,
  categories,
  onSuccess,
  setProducts,
}) => {
  return (
    <>
      <AddProductDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        categories={categories}
        onSuccess={onSuccess}
        setProducts={setProducts}
      />

      {selectedProduct && (
        <>
          <EditProductDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            product={selectedProduct}
            categories={categories}
            onSuccess={() => {}} // No-op: UI updates via setProducts
            setProducts={setProducts}
          />
          <ViewProductDialog
            open={showViewDialog}
            onOpenChange={setShowViewDialog}
            product={selectedProduct}
          />
        </>
      )}
    </>
  );
};

export default AdminProductsDialogs;
