// netlify/functions/cleanup-orphaned-auth-users.js
// دالة لتنظيف المستخدمين الموجودين في auth.users بس مش في profiles

const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
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

  try {
    // جلب جميع المستخدمين من auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    // جلب جميع المستخدمين من profiles
    const { data: profileUsers, error: profileError } = await supabase
      .from('profiles')
      .select('id');
    if (profileError) throw profileError;

    const profileIds = new Set(profileUsers.map(p => p.id));
    const orphanedUsers = authUsers.users.filter(user => !profileIds.has(user.id));

    console.log(`Found ${orphanedUsers.length} orphaned auth users`);

    let deletedCount = 0;
    const errors = [];

    // حذف المستخدمين اليتامى
    for (const user of orphanedUsers) {
      try {
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        if (error) {
          errors.push({ userId: user.id, error: error.message });
        } else {
          deletedCount++;
          console.log(`Deleted orphaned user: ${user.id} (${user.email})`);
        }
      } catch (err) {
        errors.push({ userId: user.id, error: err.message });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        deletedCount,
        totalOrphaned: orphanedUsers.length,
        errors: errors.length > 0 ? errors : undefined
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
