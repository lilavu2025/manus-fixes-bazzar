-- إضافة حقول العروض إلى جدول orders
-- Add offers fields to orders table

-- إضافة حقل العروض المطبقة (JSON)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS applied_offers JSONB;

-- إضافة حقل العناصر المجانية (JSON)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS free_items JSONB;

-- إضافة حقل مبلغ الخصم من العروض
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount_from_offers NUMERIC(10,2) DEFAULT 0;

-- إضافة تعليقات للتوضيح
COMMENT ON COLUMN orders.applied_offers IS 'العروض المطبقة على الطلبية (JSON format)';
COMMENT ON COLUMN orders.free_items IS 'العناصر المجانية في الطلبية (JSON format)';
COMMENT ON COLUMN orders.discount_from_offers IS 'مبلغ الخصم الإجمالي من العروض';
