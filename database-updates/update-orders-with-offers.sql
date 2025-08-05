-- تحديث قاعدة البيانات لدعم العروض في الطلبات
-- يرجى تشغيل هذا السكريبت في Supabase SQL Editor

-- 1. إضافة حقول العروض المطبقة إلى جدول الطلبات
DO $$
BEGIN
    -- إضافة الحقول الجديدة إذا لم تكن موجودة
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'applied_offers') THEN
        ALTER TABLE public.orders ADD COLUMN applied_offers jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'free_items') THEN
        ALTER TABLE public.orders ADD COLUMN free_items jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'original_total') THEN
        ALTER TABLE public.orders ADD COLUMN original_total numeric;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'discount_from_offers') THEN
        ALTER TABLE public.orders ADD COLUMN discount_from_offers numeric DEFAULT 0;
    END IF;
END
$$;

-- 2. إنشاء جدول إحصائيات العروض
CREATE TABLE IF NOT EXISTS public.offer_usage_stats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id uuid REFERENCES public.offers(id) ON DELETE CASCADE,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    discount_amount numeric NOT NULL DEFAULT 0,
    free_items_count integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. إضافة فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_orders_applied_offers ON public.orders USING gin(applied_offers);
CREATE INDEX IF NOT EXISTS idx_offer_usage_stats_offer_id ON public.offer_usage_stats(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_usage_stats_order_id ON public.offer_usage_stats(order_id);
CREATE INDEX IF NOT EXISTS idx_offer_usage_stats_created_at ON public.offer_usage_stats(created_at);
CREATE INDEX IF NOT EXISTS idx_offer_usage_stats_user_id ON public.offer_usage_stats(user_id);

-- 4. إضافة سياسات الأمان لجدول إحصائيات العروض
-- السماح للمشرفين بالعرض والإدراج
CREATE POLICY "Allow admin to view offer usage stats" ON public.offer_usage_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY "Allow admin to insert offer usage stats" ON public.offer_usage_stats
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

-- السماح للمستخدمين بعرض إحصائياتهم فقط
CREATE POLICY "Allow users to view their own offer usage stats" ON public.offer_usage_stats
    FOR SELECT USING (user_id = auth.uid());

-- تفعيل RLS على الجدول الجديد
ALTER TABLE public.offer_usage_stats ENABLE ROW LEVEL SECURITY;

-- 5. إنشاء view لعرض الإحصائيات بشكل مبسط
CREATE OR REPLACE VIEW public.offer_statistics_view AS
SELECT 
    o.id as offer_id,
    o.title_ar,
    o.title_en, 
    o.title_he,
    o.offer_type,
    o.active,
    COUNT(ous.id) as total_usage,
    COALESCE(SUM(ous.discount_amount), 0) as total_discount_amount,
    COALESCE(SUM(ous.free_items_count), 0) as total_free_items,
    COUNT(DISTINCT ous.user_id) as unique_users,
    AVG(ous.discount_amount) as average_discount,
    MAX(ous.created_at) as last_used_at
FROM public.offers o
LEFT JOIN public.offer_usage_stats ous ON o.id = ous.offer_id
GROUP BY o.id, o.title_ar, o.title_en, o.title_he, o.offer_type, o.active;

-- تعليق نهائي
COMMENT ON TABLE public.offer_usage_stats IS 'جدول لتتبع استخدام العروض في الطلبات لأغراض الإحصائيات والتحليل';
COMMENT ON VIEW public.offer_statistics_view IS 'عرض مبسط لإحصائيات العروض مع البيانات المجمعة';

-- إنهاء السكريبت
SELECT 'تم تحديث قاعدة البيانات بنجاح لدعم العروض في الطلبات' as status;
