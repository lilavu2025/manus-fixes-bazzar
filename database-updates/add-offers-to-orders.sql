-- إضافة حقول العروض المطبقة إلى جدول الطلبات
-- تشغيل هذا السكريبت في Supabase SQL Editor

-- إضافة حقل العروض المطبقة
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS applied_offers jsonb,
ADD COLUMN IF NOT EXISTS free_items jsonb,
ADD COLUMN IF NOT EXISTS original_total numeric,
ADD COLUMN IF NOT EXISTS discount_from_offers numeric DEFAULT 0;

-- إضافة فهرس للبحث في العروض المطبقة
CREATE INDEX IF NOT EXISTS idx_orders_applied_offers ON public.orders USING gin(applied_offers);

-- إضافة جدول إحصائيات العروض (لتتبع الاستخدام)
CREATE TABLE IF NOT EXISTS public.offer_usage_stats (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid references public.offers(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  discount_amount numeric not null default 0,
  free_items_count integer not null default 0,
  created_at timestamp with time zone default now()
);

-- إضافة فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_offer_usage_stats_offer_id ON public.offer_usage_stats(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_usage_stats_order_id ON public.offer_usage_stats(order_id);
CREATE INDEX IF NOT EXISTS idx_offer_usage_stats_created_at ON public.offer_usage_stats(created_at);

-- تعليق للمطور
-- بعد تشغيل هذا السكريبت، ستحتاج إلى:
-- 1. تحديث كود صفحة الدفع لحفظ معلومات العروض المطبقة
-- 2. تحديث صفحات الطلبات والفواتير لعرض العروض المطبقة
-- 3. تحديث إحصائيات العروض لقراءة البيانات من offer_usage_stats
