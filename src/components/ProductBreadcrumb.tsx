import * as React from "react";
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/utils/languageContextUtils';

interface ProductBreadcrumbProps {
  productName: string;
}

const ProductBreadcrumb = ({ productName }: ProductBreadcrumbProps) => {
  const { t } = useLanguage();

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
      <Link to="/" className="hover:text-primary">{t('home')}</Link>
      <ArrowRight className="h-4 w-4" />
      <Link to="/products" className="hover:text-primary">{t('products')}</Link>
      <ArrowRight className="h-4 w-4" />
      <span className="text-gray-900">{productName}</span>
    </nav>
  );
};

export default ProductBreadcrumb;
