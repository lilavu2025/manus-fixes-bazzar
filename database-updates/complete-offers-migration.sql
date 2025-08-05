-- ================================================
-- مجموعة كاملة من أوامر SQL لتفعيل نظام العروض
-- Complete SQL Commands for Offers System Implementation
-- تاريخ الإنشاء: 4 أغسطس 2025
-- ================================================

-- ملاحظة مهمة: هذا الملف يحتوي على التعديلات الهيكلية فقط
-- Important Note: This file contains structural changes only
-- لا يتم إضافة أي بيانات تجريبية أو عينات
-- No test data or samples are added

-- ================================================
-- 1. إضافة الأعمدة الجديدة لجدول الطلبات
-- Adding new columns to orders table
-- ================================================

-- إضافة حقل العروض المطبقة (JSON)
-- Add applied offers field (JSON)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS applied_offers JSONB;

-- إضافة حقل العناصر المجانية (JSON)  
-- Add free items field (JSON)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS free_items JSONB;

-- إضافة حقل مبلغ الخصم من العروض
-- Add discount amount from offers field
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount_from_offers NUMERIC(10,2) DEFAULT 0;

-- ================================================
-- 2. إضافة التعليقات التوضيحية
-- Adding descriptive comments
-- ================================================

COMMENT ON COLUMN orders.applied_offers IS 'العروض المطبقة على الطلبية (JSON format) - Applied offers on the order';
COMMENT ON COLUMN orders.free_items IS 'العناصر المجانية في الطلبية (JSON format) - Free items in the order';
COMMENT ON COLUMN orders.discount_from_offers IS 'مبلغ الخصم الإجمالي من العروض - Total discount amount from offers';

-- ================================================
-- 3. فهارس لتحسين الأداء (اختياري)
-- Indexes for performance optimization (optional)
-- ================================================

-- فهرس على العروض المطبقة للبحث السريع
-- Index on applied offers for fast searching
CREATE INDEX IF NOT EXISTS idx_orders_applied_offers 
ON orders USING GIN (applied_offers);

-- فهرس على العناصر المجانية
-- Index on free items
CREATE INDEX IF NOT EXISTS idx_orders_free_items 
ON orders USING GIN (free_items);

-- فهرس على مبلغ الخصم
-- Index on discount amount
CREATE INDEX IF NOT EXISTS idx_orders_discount_from_offers 
ON orders (discount_from_offers) 
WHERE discount_from_offers > 0;

-- ================================================
-- 4. أوامر التحقق من التطبيق الناجح
-- Verification commands for successful implementation
-- ================================================

-- التحقق من وجود الأعمدة الجديدة
-- Check if new columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'orders' 
AND column_name IN ('applied_offers', 'free_items', 'discount_from_offers')
ORDER BY ordinal_position;

-- عرض جميع أعمدة جدول الطلبات
-- Display all columns in orders table
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- ================================================
-- 5. إحصائيات بعد التطبيق
-- Statistics after implementation
-- ================================================

-- عدد الطلبات التي تحتوي على عروض (ستكون 0 في البداية)
-- Count orders with offers (will be 0 initially)
SELECT 
    COUNT(*) as total_orders,
    COUNT(applied_offers) as orders_with_offers,
    COUNT(free_items) as orders_with_free_items,
    AVG(discount_from_offers) as avg_discount
FROM orders;

-- ================================================
-- انتهاء ملف الترحيل
-- End of migration file
-- ================================================

-- للتأكد من نجاح جميع العمليات، يجب أن تظهر رسالة نجاح لكل أمر
-- To ensure all operations succeed, each command should show a success message

-- ملخص التغييرات:
-- Summary of changes:
-- ✅ إضافة 3 أعمدة جديدة لجدول orders
-- ✅ Added 3 new columns to orders table
-- ✅ إضافة تعليقات توضيحية
-- ✅ Added descriptive comments  
-- ✅ إضافة فهارس لتحسين الأداء
-- ✅ Added indexes for performance
-- ✅ أوامر التحقق والإحصائيات
-- ✅ Verification and statistics commands
