import { useEffect, useState } from "react";
import { fetchTopOrderedProducts, updateTopOrderedProducts } from "@/integrations/supabase/dataSenders";
import { mapProductFromDb } from "@/types/mapProductFromDb";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/utils/languageContextUtils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AdminTopOrderedReport = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

  useEffect(() => {
    fetchTopOrderedProducts().then((data) => {
      const arr = Array.isArray(data) ? data : [];
      console.log("[AdminTopOrderedReport] arr:", arr);
      if (arr.length > 0) {
        // اطبع أول منتج كامل للتشخيص
        console.log("[AdminTopOrderedReport] first product (full):", JSON.stringify(arr[0], null, 2));
      }
      setProducts(arr.map(mapProductFromDb));
      setLoading(false);
    });
  }, []);

  // حساب إجمالي المبيعات لكل المنتجات
  const totalSales = products.reduce(
    (acc, p) => acc + (typeof p["sales_count"] === "number" ? p["sales_count"] : 0),
    0
  );

  return (
    <Card className="my-8">
      <CardHeader>
        <CardTitle>{t("topSellingReport")}</CardTitle>
        <Button
          variant="outline"
          className="ml-4 text-xs border-[hsl(var(--secondary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--secondary))]"
          onClick={async () => {
            try {
              await updateTopOrderedProducts();
              toast.success(t("updatedTopSelling"));
              window.location.reload();
            } catch (e) {
              toast.error(t("error"));
            }
          }}
        >
          {t("updateTopSellingNow")}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>{t("loading")}</div>
        ) : products.length === 0 ? (
          <div>{t("noTopSellingProducts")}</div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {t("totalSales")}:{" "}
              <span className="font-bold text-orange-600">{totalSales}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-center border bg-white rounded-lg shadow-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th>#</th>
                    <th>{t("productImage")}</th>
                    <th>{t("productName")}</th>
                    <th>{t("stockQuantity")}</th>
                    <th>{t("status")}</th>
                    <th>{t("salesCount")}</th>
                    <th>{t("salesPercent")}</th>
                    <th>{t("barChart")}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, idx) => {
                    const sales = typeof product["sales_count"] === "number" ? product["sales_count"] : 0;
                    const percent = totalSales
                      ? Math.round((sales / totalSales) * 100)
                      : 0;
                    return (
                      <tr
                        key={product.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td>{idx + 1}</td>
                        <td>
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="font-medium text-gray-800">
                          {language === "ar" 
                            ? product.name 
                            : language === "he" 
                            ? product.nameHe 
                            : product.nameEn}
                        </td>
                        <td>{product.stock_quantity}</td>
                        <td>{product.inStock ? t("inStock") : t("outOfStock")}</td>
                        <td className="font-bold text-orange-600">{sales}</td>
                        <td>{percent}%</td>
                        <td>
                          <div className="h-3 w-24 bg-gray-200 rounded overflow-hidden">
                            <div
                              className="h-3 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))]"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminTopOrderedReport;
