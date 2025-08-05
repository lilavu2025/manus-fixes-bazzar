-- ===============================================
-- إضافة أعمدة العروض إلى جدول orders
-- Add offers columns to orders table
-- ===============================================

-- 1. إضافة الأعمدة الجديدة
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS applied_offers JSONB;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS free_items JSONB;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount_from_offers NUMERIC(10,2) DEFAULT 0;

-- 2. إضافة تعليقات للتوضيح
COMMENT ON COLUMN orders.applied_offers IS 'العروض المطبقة على الطلبية (JSON format)';
COMMENT ON COLUMN orders.free_items IS 'العناصر المجانية في الطلبية (JSON format)';
COMMENT ON COLUMN orders.discount_from_offers IS 'مبلغ الخصم الإجمالي من العروض';
