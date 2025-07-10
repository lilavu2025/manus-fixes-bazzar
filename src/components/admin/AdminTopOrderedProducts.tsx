import { useEffect, useState } from "react";
import { fetchTopOrderedProducts } from "@/integrations/supabase/dataSenders";
import { mapProductFromDb } from "@/types/mapProductFromDb";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/utils/languageContextUtils";


const AdminTopOrderedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

  useEffect(() => {
    fetchTopOrderedProducts().then((data) => {
      setProducts(Array.isArray(data) ? data.map(mapProductFromDb) : []);
      setLoading(false);
    });
  }, []);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t("topSelling")}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>{t("loading")}</div>
        ) : products.length === 0 ? (
          <div>{t("noTopSellingProducts")}</div>
        ) : (
          <div className="space-y-2">
            {products.map((product, idx) => (
              <div
                key={product.id}
                className="flex items-start justify-between bg-gray-50 rounded-lg px-3 py-2 border hover:shadow-sm transition-all gap-3"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="font-bold text-lg text-orange-600 w-6 text-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-gray-800 product-name">
                    {language === "ar" 
                      ? product.name 
                      : language === "he" 
                      ? product.nameHe 
                      : product.nameEn}
                  </span>
                </div>
                <span className="text-sm text-gray-600 bg-orange-100 rounded px-2 py-1 font-semibold flex-shrink-0 self-start">
                  {product.sales_count ?? product.salesCount ?? 0} {t('salesCount')}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminTopOrderedProducts;
