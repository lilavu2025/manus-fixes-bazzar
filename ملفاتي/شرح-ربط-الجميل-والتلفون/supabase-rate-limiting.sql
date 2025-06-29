-- ====================================
-- Supabase Rate Limiting Setup Script
-- ====================================
-- هذا السكريپت يتحقق من إصدار Supabase ويوجهك للطريقة الصحيحة لإعداد Rate Limiting

-- التحقق من وجود جدول auth.config
DO $$
BEGIN
    -- محاولة التحقق من وجود الجدول
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'auth' 
        AND table_name = 'config'
    ) THEN
        -- إذا كان الجدول موجود (إصدار قديم من Supabase)
        RAISE NOTICE '✅ Found auth.config table - Using SQL configuration method';
        
        -- إعداد Rate Limiting للإيميل (5 رسائل كل 5 دقائق)
        INSERT INTO auth.config (parameter, value) 
        VALUES ('email_rate_limit', '5') 
        ON CONFLICT (parameter) DO UPDATE SET value = '5';
        
        INSERT INTO auth.config (parameter, value) 
        VALUES ('email_rate_limit_per', '300') 
        ON CONFLICT (parameter) DO UPDATE SET value = '300';
        
        -- إعداد Rate Limiting للهاتف/SMS
        INSERT INTO auth.config (parameter, value) 
        VALUES ('sms_rate_limit', '5') 
        ON CONFLICT (parameter) DO UPDATE SET value = '5';
        
        INSERT INTO auth.config (parameter, value) 
        VALUES ('sms_rate_limit_per', '300') 
        ON CONFLICT (parameter) DO UPDATE SET value = '300';
        
        -- إعداد Rate Limiting لإعادة تعيين كلمة المرور
        INSERT INTO auth.config (parameter, value) 
        VALUES ('password_reset_rate_limit', '3') 
        ON CONFLICT (parameter) DO UPDATE SET value = '3';
        
        INSERT INTO auth.config (parameter, value) 
        VALUES ('password_reset_rate_limit_per', '600') 
        ON CONFLICT (parameter) DO UPDATE SET value = '600';
        
        RAISE NOTICE '✅ Rate limiting configured via SQL successfully!';
        
    ELSE
        -- إذا لم يكن الجدول موجود (إصدار حديث من Supabase)
        RAISE NOTICE '⚠️  auth.config table not found - This indicates you are using a modern Supabase version';
        RAISE NOTICE '📋 Please configure Rate Limiting through Supabase Dashboard instead:';
        RAISE NOTICE '   1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/rate-limits';
        RAISE NOTICE '   2. Set Email Rate Limit: 5 requests per 300 seconds (5 minutes)';
        RAISE NOTICE '   3. Set SMS Rate Limit: 5 requests per 300 seconds (5 minutes)';
        RAISE NOTICE '   4. Set Password Reset Rate Limit: 3 requests per 600 seconds (10 minutes)';
        RAISE NOTICE '   OR use the code-based rate limiter in: src/utils/authRateLimiter.ts';
        
    END IF;
END
$$;
