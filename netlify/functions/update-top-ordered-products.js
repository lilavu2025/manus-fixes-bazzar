// وظيفة Netlify لتحديث أكثر 10 منتجات مبيعًا تلقائيًا
// تعتمد على supabase-js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async function(event, context) {
  // 1. احسب عدد مرات بيع كل منتج
  const { data: sales, error: salesError } = await supabase
    .from('order_items')
    .select('product_id, count:quantity')
    .group('product_id')
    .order('count', { ascending: false });

  if (salesError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: salesError.message })
    };
  }

  // 2. حدد أكثر 10 منتجات مبيعًا
  const top10 = sales.slice(0, 10).map(item => item.product_id);

  // 3. حدث عمود top_ordered لجميع المنتجات
  // أ. اجعل جميع المنتجات top_ordered = false
  await supabase.from('products').update({ top_ordered: false }).neq('top_ordered', false);
  // ب. اجعل المنتجات الأكثر مبيعًا top_ordered = true
  if (top10.length > 0) {
    await supabase.from('products').update({ top_ordered: true }).in('id', top10);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'تم تحديث أكثر 10 منتجات مبيعًا بنجاح', top10 })
  };
};
