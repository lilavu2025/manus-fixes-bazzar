import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Category } from "@/types";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/utils/languageContextUtils";
import { getLocalizedName } from "@/utils/getLocalizedName";
import LazyImage from "@/components/LazyImage";

interface CategoryCardProps {
  category: Category;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const handleClick = () => {
    navigate(`/products?category=${category.id}`);
  };

  return (
    // تحديد عرض محدود مع جعل البطاقة متوسطة الحجم على الشاشات الكبيرة
    <div
      onClick={handleClick}
      className="cursor-pointer w-full min-w-[140px] max-w-xs sm:max-w-sm md:max-w-md mx-auto"
    >
      <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 overflow-hidden rounded-xl">
        <div className="relative w-full h-24 sm:h-32 md:h-40 lg:h-48 bg-gray-100">
          {/* خلفية الصورة مع containment */}
          <div
            className="absolute inset-0 bg-center bg-contain bg-no-repeat"
            style={{
              backgroundImage: `url(${category.image || "/placeholder.svg"})`,
            }}
          />
          {/* تدرج لتحسين ظهور النص */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {/* شارة عدد المنتجات */}
          <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2">
            <Badge
              variant="secondary"
              className="bg-white/90 text-gray-800 text-[10px] sm:text-xs md:text-sm px-1.5 py-0.5 sm:px-2 sm:py-1"
            >
              {category.count}{" "}
              {category.count === 1 ? t("products") : t("products")}
            </Badge>
          </div>
        </div>

        <CardContent className="p-2 sm:p-3 md:p-4 text-center">
          <h3 className="font-bold text-sm sm:text-base md:text-lg lg:text-xl group-hover:text-primary transition-colors line-clamp-2">
            {getLocalizedName(category, language)}
          </h3>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryCard;
