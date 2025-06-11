
import { Product, Category, Banner } from '@/types';

export const categories: Category[] = [
  {
    id: '1',
    name: 'الهواتف الذكية',
    nameEn: 'Smartphones',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
    icon: 'smartphone',
    count: 25
  },
  {
    id: '2',
    name: 'اللابتوب والحاسوب',
    nameEn: 'Laptops & Computers',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
    icon: 'laptop',
    count: 18
  },
  {
    id: '3',
    name: 'الأجهزة المنزلية',
    nameEn: 'Home Appliances',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
    icon: 'home',
    count: 32
  },
  {
    id: '4',
    name: 'الموضة والأزياء',
    nameEn: 'Fashion',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
    icon: 'shirt',
    count: 45
  },
  {
    id: '5',
    name: 'الرياضة واللياقة',
    nameEn: 'Sports & Fitness',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
    icon: 'dumbbell',
    count: 28
  },
  {
    id: '6',
    name: 'الكتب والقرطاسية',
    nameEn: 'Books & Stationery',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
    icon: 'book',
    count: 15
  }
];

export const banners: Banner[] = [
  {
    id: '1',
    title: 'خصم 50% على جميع الهواتف الذكية',
    subtitle: 'عرض محدود لفترة قصيرة',
    image: 'https://images.unsplash.com/photo-1607936854279-55e8f4c64888?w=800',
    active: true
  },
  {
    id: '2',
    title: 'مجموعة جديدة من اللابتوب',
    subtitle: 'أحدث التقنيات بأفضل الأسعار',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800',
    active: true
  },
  {
    id: '3',
    title: 'أجهزة منزلية ذكية',
    subtitle: 'اجعل منزلك أكثر ذكاءً',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    active: true
  }
];

export const products: Product[] = [
  {
    id: '1',
    name: 'آيفون 15 برو',
    nameEn: 'iPhone 15 Pro',
    description: 'أحدث إصدار من آيفون بتقنيات متطورة وكاميرا احترافية',
    descriptionEn: 'Latest iPhone with advanced technology and professional camera',
    price: 4500,
    originalPrice: 5000,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500',
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500',
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500',
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500'
    ],
    category: '1',
    inStock: true,
    rating: 4.8,
    reviews: 124,
    discount: 10,
    featured: true,
    tags: ['جديد', 'مميز', 'خصم']
  },
  {
    id: '2',
    name: 'سامسونج جالاكسي S24',
    nameEn: 'Samsung Galaxy S24',
    description: 'هاتف ذكي متطور بشاشة عالية الدقة وأداء فائق',
    descriptionEn: 'Advanced smartphone with high-resolution display and superior performance',
    price: 3200,
    originalPrice: 3800,
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500',
    category: '1',
    inStock: true,
    rating: 4.6,
    reviews: 89,
    discount: 15,
    featured: true
  },
  {
    id: '3',
    name: 'ماك بوك برو M3',
    nameEn: 'MacBook Pro M3',
    description: 'لابتوب احترافي بمعالج M3 الجديد وأداء استثنائي',
    descriptionEn: 'Professional laptop with new M3 processor and exceptional performance',
    price: 8500,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
    category: '2',
    inStock: true,
    rating: 4.9,
    reviews: 67,
    featured: true
  },
  {
    id: '4',
    name: 'أير فرايز ذكي',
    nameEn: 'Smart Air Fryer',
    description: 'مقلاة هوائية ذكية للطبخ الصحي واللذيذ',
    descriptionEn: 'Smart air fryer for healthy and delicious cooking',
    price: 450,
    originalPrice: 600,
    image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=500',
    category: '3',
    inStock: true,
    rating: 4.4,
    reviews: 156,
    discount: 25
  },
  {
    id: '5',
    name: 'قميص قطني أنيق',
    nameEn: 'Elegant Cotton Shirt',
    description: 'قميص قطني عالي الجودة مناسب لجميع المناسبات',
    descriptionEn: 'High-quality cotton shirt suitable for all occasions',
    price: 120,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
    category: '4',
    inStock: true,
    rating: 4.2,
    reviews: 43
  },
  {
    id: '6',
    name: 'دراجة رياضية',
    nameEn: 'Sports Bicycle',
    description: 'دراجة رياضية خفيفة الوزن وعالية الأداء',
    descriptionEn: 'Lightweight and high-performance sports bicycle',
    price: 850,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
    category: '5',
    inStock: false,
    rating: 4.5,
    reviews: 78
  },
  {
    id: '7',
    name: 'كتاب البرمجة الحديثة',
    nameEn: 'Modern Programming Book',
    description: 'دليل شامل لتعلم البرمجة الحديثة',
    descriptionEn: 'Comprehensive guide to learning modern programming',
    price: 65,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
    category: '6',
    inStock: true,
    rating: 4.7,
    reviews: 92
  },
  {
    id: '8',
    name: 'هواوي P60 برو',
    nameEn: 'Huawei P60 Pro',
    description: 'هاتف بكاميرا احترافية وتصميم أنيق',
    descriptionEn: 'Phone with professional camera and elegant design',
    price: 2800,
    image: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=500',
    category: '1',
    inStock: true,
    rating: 4.3,
    reviews: 54,
    featured: true
  }
];
