import * as React from "react";
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Category } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/utils/languageContextUtils';
import { getLocalizedName } from '@/utils/getLocalizedName';
import LazyImage from '@/components/LazyImage';

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
    <div onClick={handleClick} className="cursor-pointer w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
      <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 overflow-hidden rounded-xl">
        <div className="relative w-full h-32 sm:h-40 md:h-48 bg-gray-100">
          {/* خلفية الصورة مع containment */}
          <div
            className="absolute inset-0 bg-center bg-contain bg-no-repeat"
            style={{ backgroundImage: `url(${category.image || '/placeholder.svg'})` }}
          />
          {/* تدرج لتحسين ظهور النص */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {/* شارة عدد المنتجات */}
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="bg-white/90 text-gray-800 text-sm sm:text-base">
              {category.count} {category.count === 1 ? t('products') : t('products')}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 text-center">
          <h3 className="font-bold text-lg sm:text-xl md:text-2xl group-hover:text-primary transition-colors">
            {getLocalizedName(category, language)}
          </h3>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryCard;
