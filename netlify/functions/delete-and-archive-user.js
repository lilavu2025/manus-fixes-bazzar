// netlify/functions/delete-and-archive-user.js

const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const { userId, adminName, adminId } = JSON.parse(event.body || '{}');
  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing userId' })
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing Supabase credentials' })
    };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // 1. جلب بيانات المستخدم من profiles
  const { data: userData, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (fetchError || !userData) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'User not found or fetch error' })
    };
  }

  // 2. أرشفة بيانات المستخدم في deleted_users (كل الأعمدة)
  const archivePayload = {
    user_id: userData.id,
    full_name: userData.full_name,
    email: userData.email,
    phone: userData.phone,
    address: userData.address ?? null,
    deleted_by: adminId || null, // uuid
    deleted_by_name: adminName || null, // نص
    last_sign_in_at: userData.last_sign_in_at ?? null,
    user_type: userData.user_type ?? null,
    created_at: userData.created_at ?? null,
    deleted_at: new Date().toISOString(),
    original_data: userData
  };
  const { error: archiveError } = await supabase.from('deleted_users').insert([archivePayload]);
  if (archiveError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Archive error: ' + archiveError.message })
    };
  }

  // 3. حذف المستخدم من نظام المصادقة
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Auth error: ' + authError.message })
    };
  }

  // 4. حذف المستخدم من جدول profiles
  const { error: deleteError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);
  if (deleteError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Delete error: ' + deleteError.message })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};
