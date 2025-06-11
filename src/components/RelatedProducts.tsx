import * as React from 'react';
import { useLanguage } from '@/utils/languageContextUtils';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/types';

interface RelatedProductsProps {
  products: Product[];
}

const RelatedProducts = ({ products }: RelatedProductsProps) => {
  const { t } = useLanguage();

  if (products.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">{t('relatedProducts')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((relatedProduct) => (
          <ProductCard
            key={relatedProduct.id}
            product={relatedProduct}
          />
        ))}
      </div>
    </section>
  );
};

export default RelatedProducts;
