import React from 'react';
import AddProductDialog from './AddProductDialog';
import EditProductDialog from './EditProductDialog';
import ViewProductDialog from './ViewProductDialog';
import { ProductFormData, Category, AdminProductForm } from '@/types/product';

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
}) => {
  return (
    <>
      <AddProductDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        categories={categories}
        onSuccess={onSuccess}
      />

      {selectedProduct && (
        <>
          <EditProductDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            product={selectedProduct}
            categories={categories}
            onSuccess={onSuccess}
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
