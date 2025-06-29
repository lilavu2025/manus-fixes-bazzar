import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLanguage } from "@/utils/languageContextUtils";

interface AdminProductsHeaderProps {
  productCount: number;
  onAddProduct: () => void;
}

const AdminProductsHeader: React.FC<AdminProductsHeaderProps> = ({
  productCount,
  onAddProduct,
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-between w-full">
      <div>
        <h1 className="text-3xl font-bold">{t("manageProducts")}</h1>
        <p className="text-gray-600 mt-1">
          {productCount} {t("products")}
        </p>
      </div>
      <Button onClick={onAddProduct} className="ml-4 gap-2">
        <Plus className="h-4 w-4" />
        {t("addProduct")}
      </Button>
    </div>
  );
};

export default AdminProductsHeader;
