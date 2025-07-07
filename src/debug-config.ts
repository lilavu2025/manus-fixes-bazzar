import config from '@/configs/activeConfig';

// إظهار معلومات التكوين في الكونسول
console.log('=== معلومات التكوين ===');
console.log('اسم العميل:', import.meta.env.VITE_CLIENT_KEY);
console.log('Supabase URL:', config.supabaseUrl);
console.log('Supabase Key موجود:', !!config.supabaseKey);
console.log('التكوين الكامل:', config);

// اختبار إنشاء عميل Supabase
try {
  import('@/integrations/supabase/client').then(({ supabase }) => {
    console.log('✅ تم إنشاء عميل Supabase بنجاح');
    console.log('عميل Supabase:', supabase);
  });
} catch (error) {
  console.error('❌ خطأ في إنشاء عميل Supabase:', error);
}

export {};
