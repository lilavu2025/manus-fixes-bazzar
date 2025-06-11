const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase URL and anon key
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createSampleData() {
  try {
    console.log('Creating sample categories...');
    
    // Create sample categories
    const categories = [
      {
        name: 'Electronics',
        name_ar: 'إلكترونيات',
        name_en: 'Electronics',
        name_he: 'אלקטרוניקה',
        description: 'Electronic devices and gadgets',
        description_ar: 'أجهزة إلكترونية وأدوات',
        description_en: 'Electronic devices and gadgets',
        description_he: 'מכשירים אלקטרוניים וגאדג\'טים',
        active: true,
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'
      },
      {
        name: 'Clothing',
        name_ar: 'ملابس',
        name_en: 'Clothing',
        name_he: 'בגדים',
        description: 'Fashion and clothing items',
        description_ar: 'أزياء وملابس',
        description_en: 'Fashion and clothing items',
        description_he: 'פריטי אופנה ובגדים',
        active: true,
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400'
      },
      {
        name: 'Home & Garden',
        name_ar: 'منزل وحديقة',
        name_en: 'Home & Garden',
        name_he: 'בית וגן',
        description: 'Home improvement and garden supplies',
        description_ar: 'تحسين المنزل ومستلزمات الحديقة',
        description_en: 'Home improvement and garden supplies',
        description_he: 'שיפור הבית ואספקת גן',
        active: true,
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'
      }
    ];

    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .insert(categories)
      .select();

    if (categoriesError) {
      console.error('Error creating categories:', categoriesError);
      return;
    }

    console.log('Categories created successfully:', categoriesData);

    // Create sample products
    console.log('Creating sample products...');
    
    const products = [
      {
        name: 'Smartphone',
        name_ar: 'هاتف ذكي',
        name_en: 'Smartphone',
        name_he: 'סמארטפון',
        description: 'Latest smartphone with advanced features',
        description_ar: 'أحدث هاتف ذكي بميزات متقدمة',
        description_en: 'Latest smartphone with advanced features',
        description_he: 'סמארטפון חדיש עם תכונות מתקדמות',
        price: 599.99,
        original_price: 699.99,
        wholesale_price: 450.00,
        category_id: categoriesData[0].id,
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
        images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'],
        in_stock: true,
        stock_quantity: 50,
        rating: 4.5,
        reviews_count: 128,
        discount: 14,
        featured: true,
        tags: ['electronics', 'mobile', 'smartphone']
      },
      {
        name: 'T-Shirt',
        name_ar: 'تي شيرت',
        name_en: 'T-Shirt',
        name_he: 'חולצת טי',
        description: 'Comfortable cotton t-shirt',
        description_ar: 'تي شيرت قطني مريح',
        description_en: 'Comfortable cotton t-shirt',
        description_he: 'חולצת טי כותנה נוחה',
        price: 29.99,
        original_price: 39.99,
        wholesale_price: 20.00,
        category_id: categoriesData[1].id,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
        in_stock: true,
        stock_quantity: 100,
        rating: 4.2,
        reviews_count: 45,
        discount: 25,
        featured: false,
        tags: ['clothing', 'casual', 'cotton']
      }
    ];

    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .insert(products)
      .select();

    if (productsError) {
      console.error('Error creating products:', productsError);
      return;
    }

    console.log('Products created successfully:', productsData);

    // Create sample banners
    console.log('Creating sample banners...');
    
    const banners = [
      {
        title: 'Summer Sale',
        title_ar: 'تخفيضات الصيف',
        title_en: 'Summer Sale',
        title_he: 'מבצע קיץ',
        subtitle: 'Up to 50% off on selected items',
        subtitle_ar: 'خصم يصل إلى 50% على منتجات مختارة',
        subtitle_en: 'Up to 50% off on selected items',
        subtitle_he: 'עד 50% הנחה על פריטים נבחרים',
        image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800',
        link: '/offers',
        active: true,
        sort_order: 1
      }
    ];

    const { data: bannersData, error: bannersError } = await supabase
      .from('banners')
      .insert(banners)
      .select();

    if (bannersError) {
      console.error('Error creating banners:', bannersError);
      return;
    }

    console.log('Banners created successfully:', bannersData);
    console.log('Sample data creation completed!');

  } catch (error) {
    console.error('Error creating sample data:', error);
  }
}

// Run the script
createSampleData();