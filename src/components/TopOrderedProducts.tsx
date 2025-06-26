import { useEffect, useState } from "react";
import { fetchTopOrderedProducts } from "@/integrations/supabase/dataSenders";
import ProductCard from "@/components/ProductCard";
import { mapProductFromDb } from "@/types/mapProductFromDb";
import { useLanguage } from "@/utils/languageContextUtils";

const TopOrderedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    fetchTopOrderedProducts().then((data) => {
      setProducts(Array.isArray(data) ? data.map(mapProductFromDb) : []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>{t("loading")}</div>;
  if (!products.length) return <div>{t("noTopProducts")}</div>;

  return (
    <section className="my-6 sm:my-8">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-center">{t("topSelling")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default TopOrderedProducts;
