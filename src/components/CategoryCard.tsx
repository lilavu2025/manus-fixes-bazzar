import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Category } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/utils/languageContextUtils';
import LazyImage from '@/components/LazyImage';

interface CategoryCardProps {
  category: Category;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // تسجيل بيانات الفئة لغايات التصحيح
  console.log('Rendering CategoryCard for category:', category);

  // عند الضغط على البطاقة، نوجّه المستخدم لصفحة المنتجات الخاصة بهذه الفئة
  const handleClick = () => {
    console.log(`Navigating to products page with category ID: ${category.id}`);
    navigate(`/products?category=${category.id}`);
  };

  return (
    <div onClick={handleClick} className="cursor-pointer">
      {/* البطاقة الرئيسية التي تحتوي على الصورة واسم الفئة */}
      <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-2 hover:border-primary/20">
        <div className="relative">
          {/* صورة الفئة أو صورة بديلة إن لم تتوفر */}
          <LazyImage
            src={category.image || '/placeholder.svg'}
            alt={category.name}
            className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-110"
          />
          {/* تدرج لوني من الأسفل للأعلى لتحسين ظهور النص */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* شارة تُظهر عدد المنتجات ضمن هذه الفئة */}
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="bg-white/90 text-gray-800">
              {/* نعرض عدد المنتجات داخل الفئة */}
              {category.count} {category.count === 1 ? 'منتج' : 'منتج'}
            </Badge>
          </div>
        </div>

        {/* محتوى البطاقة: اسم الفئة بالعربية والإنجليزية */}
        <CardContent className="p-4 text-center">
          <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
            {category.name}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {category.nameEn}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryCard;
