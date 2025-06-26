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
    <section className="my-8">
      <h2 className="text-2xl font-bold mb-4 text-center">{t("topSelling")}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default TopOrderedProducts;
