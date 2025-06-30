-- سكريبت تعبئة بيانات وهمية كاملة لعرض الموقع للمستثمر
-- بيانات المستخدمين (profiles)
insert into public.profiles (id, full_name, email, phone, user_type)
values
  ('00000000-0000-0000-0000-000000000001', 'أحمد المدير', 'admin@example.com', '0520000001', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'سارة تاجر جملة', 'wholesale@example.com', '0540000002', 'wholesale'),
  ('00000000-0000-0000-0000-000000000003', 'محمد زبون', 'retail@example.com', '0590000003', 'retail'),
  ('00000000-0000-0000-0000-000000000004', 'ليلى عميل', 'leila@example.com', '0591234567', 'retail'),
  ('00000000-0000-0000-0000-000000000005', 'خالد تاجر', 'khaled@example.com', '0569876543', 'wholesale'),
  ('00000000-0000-0000-0000-000000000006', 'يوسف زبون', 'yousef@example.com', '0595555555', 'retail'),
  ('00000000-0000-0000-0000-000000000007', 'منى تاجر', 'mona@example.com', '0562222333', 'wholesale'),
  ('00000000-0000-0000-0000-000000000008', 'سعيد عميل', 'saeed@example.com', '0598888999', 'retail'),
  ('00000000-0000-0000-0000-000000000009', 'هالة عميل', 'hala@example.com', '0591111222', 'retail'),
  ('00000000-0000-0000-0000-000000000010', 'رامي تاجر', 'rami@example.com', '0563333444', 'wholesale');

-- بيانات الفئات (categories)
insert into public.categories (id, name_ar, name_en, name_he, image, icon, active)
values
  ('10000000-0000-0000-0000-000000000001', 'الكترونيات', 'Electronics', 'אלקטרוניקה', 'cat1.jpg', 'icon1', true),
  ('10000000-0000-0000-0000-000000000002', 'ملابس', 'Clothes', 'בגדים', 'cat2.jpg', 'icon2', true),
  ('10000000-0000-0000-0000-000000000003', 'ألعاب', 'Toys', 'צעצועים', 'cat3.jpg', 'icon3', true),
  ('10000000-0000-0000-0000-000000000004', 'مطبخ', 'Kitchen', 'מטבח', 'cat4.jpg', 'icon4', true),
  ('10000000-0000-0000-0000-000000000005', 'أحذية', 'Shoes', 'נעליים', 'cat5.jpg', 'icon5', true),
  ('10000000-0000-0000-0000-000000000006', 'مستلزمات منزلية', 'Home Supplies', 'ציוד לבית', 'cat6.jpg', 'icon6', true),
  ('10000000-0000-0000-0000-000000000007', 'إكسسوارات', 'Accessories', 'אביזרים', 'https://images.unsplash.com/photo-1517841905240-472988babdf9', 'icon7', true);

-- بيانات المنتجات (products)
insert into public.products (id, category_id, name_ar, name_en, name_he, description_ar, description_en, description_he, image, images, price, original_price, wholesale_price, discount, featured, in_stock, stock_quantity, active, top_ordered, rating, reviews_count, sales_count, tags)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'هاتف ذكي', 'Smartphone', 'סמארטפון', 'هاتف ذكي حديث', 'Modern smartphone', 'טלפון חכם מודרני', 'prod1.jpg', ARRAY['prod1_1.jpg','prod1_2.jpg'], 999, 1200, 900, 20, true, true, 50, true, true, 4.8, 120, 300, ARRAY['الكترونيات','هاتف']),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'قميص رجالي', 'Men Shirt', 'חולצת גברים', 'قميص قطن عالي الجودة', 'High quality cotton shirt', 'חולצת כותנה איכותית', 'prod2.jpg', ARRAY['prod2_1.jpg'], 35, 50, 30, 10, false, true, 200, true, false, 4.2, 40, 80, ARRAY['ملابس','رجالي']),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'لعبة أطفال', 'Kids Toy', 'צעצוע ילדים', 'لعبة تعليمية ممتعة', 'Fun educational toy', 'צעצוע חינוכי מהנה', 'prod3.jpg', ARRAY['prod3_1.jpg','prod3_2.jpg'], 20, 25, 15, 5, true, true, 100, true, false, 4.6, 60, 150, ARRAY['ألعاب','تعليمي']),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'خلاط كهربائي', 'Blender', 'בלנדר', 'خلاط كهربائي قوي', 'Powerful electric blender', 'בלנדר חשמלי חזק', 'prod4.jpg', ARRAY['prod4_1.jpg'], 150, 200, 120, 25, true, true, 30, true, false, 4.7, 25, 60, ARRAY['مطبخ','أجهزة']),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'سماعات رأس', 'Headphones', 'אוזניות', 'سماعات رأس لاسلكية', 'Wireless headphones', 'אוזניות אלחוטיות', 'prod5.jpg', ARRAY['prod5_1.jpg'], 80, 100, 70, 20, false, true, 80, true, true, 4.5, 33, 90, ARRAY['الكترونيات','صوتيات']),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000005', 'حذاء رياضي', 'Sport Shoes', 'נעלי ספורט', 'حذاء رياضي مريح', 'Comfortable sport shoes', 'נעלי ספורט נוחות', 'prod6.jpg', ARRAY['prod6_1.jpg','prod6_2.jpg'], 120, 150, 100, 20, true, true, 60, true, true, 4.9, 55, 110, ARRAY['أحذية','رياضي']),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000006', 'مكنسة كهربائية', 'Vacuum Cleaner', 'שואב אבק', 'مكنسة كهربائية قوية', 'Powerful vacuum cleaner', 'שואב אבק חזק', 'prod7.jpg', ARRAY['prod7_1.jpg'], 300, 350, 250, 15, false, true, 20, true, false, 4.3, 20, 40, ARRAY['منزل','أجهزة']),
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', 'فستان نسائي', 'Women Dress', 'שמלת נשים', 'فستان أنيق', 'Elegant dress', 'שמלה אלגנטית', 'prod8.jpg', ARRAY['prod8_1.jpg'], 200, 250, 180, 10, true, true, 35, true, false, 4.7, 18, 30, ARRAY['ملابس','نسائي']),
  ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000007', 'ساعة يد', 'Wrist Watch', 'שעון יד', 'ساعة يد أنيقة', 'Elegant wrist watch', 'שעון יד אלגנטי', 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b', ARRAY['https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b','https://images.unsplash.com/photo-1465101046530-73398c7f28ca'], 250, 300, 200, 17, true, true, 40, true, false, 4.8, 22, 60, ARRAY['إكسسوارات','ساعة']),
  ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', 'لابتوب', 'Laptop', 'מחשב נייד', 'لابتوب حديث', 'Modern laptop', 'מחשב נייד מודרני', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8', ARRAY['https://images.unsplash.com/photo-1517336714731-489689fd1ca8'], 3500, 4000, 3200, 12, true, true, 15, true, true, 4.9, 40, 80, ARRAY['الكترونيات','لابتوب']);

-- بيانات العروض (offers)
insert into public.offers (id, title_ar, title_en, title_he, description_ar, description_en, description_he, image_url, discount_percent, start_date, end_date, active)
values
  ('30000000-0000-0000-0000-000000000001', 'عرض الصيف', 'Summer Offer', 'מבצע קיץ', 'خصم خاص على الإلكترونيات', 'Special discount on electronics', 'הנחה מיוחדת על אלקטרוניקה', 'offer1.jpg', 15, '2025-06-01', '2025-07-01', true),
  ('30000000-0000-0000-0000-000000000002', 'عرض الملابس', 'Clothes Offer', 'מבצע בגדים', 'خصم على الملابس', 'Discount on clothes', 'הנחה על בגדים', 'offer2.jpg', 10, '2025-06-10', '2025-07-10', true),
  ('30000000-0000-0000-0000-000000000003', 'عرض المطبخ', 'Kitchen Offer', 'מבצע מטבח', 'خصم على أجهزة المطبخ', 'Discount on kitchen appliances', 'הנחה על מוצרי מטבח', 'offer3.jpg', 12, '2025-07-01', '2025-08-01', true);

-- بيانات البانرات (banners)
insert into public.banners (id, image, link, title_ar, title_en, title_he, subtitle_ar, subtitle_en, subtitle_he, sort_order, active)
values
  ('40000000-0000-0000-0000-000000000001', 'banner1.jpg', 'https://example.com/offer1', 'أهلاً بكم', 'Welcome', 'ברוכים הבאים', 'تسوق الآن', 'Shop Now', 'קנה עכשיו', 1, true),
  ('40000000-0000-0000-0000-000000000002', 'banner2.jpg', 'https://example.com/offer2', 'خصومات الصيف', 'Summer Discounts', 'הנחות קיץ', 'لا تفوت الفرصة', 'Don''t miss it', 'אל תפספס', 2, true),
  ('40000000-0000-0000-0000-000000000003', 'banner3.jpg', 'https://example.com/offer3', 'جديد في المطبخ', 'New in Kitchen', 'חדש במטבח', 'اكتشف الأجهزة', 'Discover appliances', 'גלה מכשירים', 3, true),
  ('40000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb', 'https://example.com/accessories', 'إكسسوارات جديدة', 'New Accessories', 'אביזרים חדשים', 'تسوق الإكسسوارات', 'Shop Accessories', 'קנה אביזרים', 4, true);

-- بيانات العناوين (addresses)
insert into public.addresses (id, user_id, full_name, phone, city, area, street, building, floor, apartment, is_default)
values
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'محمد زبون', '+970590000003', 'رام الله', 'المنطقة الوسطى', 'شارع القدس', 'عمارة 5', '2', '8', true),
  ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'سارة تاجر جملة', '+970590000002', 'نابلس', 'المنطقة الشمالية', 'شارع الجامعة', 'عمارة 2', '1', '3', true),
  ('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'ليلى عميل', '0592345678', 'الخليل', 'المنطقة الجنوبية', 'شارع الحرم', 'عمارة 7', '3', '12', true);

-- بيانات السلة (cart)
insert into public.cart (id, user_id, product_id, quantity)
values
  ('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 2),
  ('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 1),
  ('60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 1);

-- بيانات المفضلة (favorites)
insert into public.favorites (id, user_id, product_id)
values
  ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001'),
  ('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003'),
  ('70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000005');

-- بيانات الطلبات (orders)
insert into public.orders (id, user_id, order_number, customer_name, payment_method, shipping_address, items, total, total_after_discount, discount_type, discount_value, status, notes)
values
  ('80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 1001, 'محمد زبون', 'بطاقة ائتمان', '{"city":"رام الله","area":"المنطقة الوسطى","street":"شارع القدس","building":"عمارة 5","apartment":"8"}', '[{"product_id":"20000000-0000-0000-0000-000000000001","quantity":2}]', 1998, 1798, 'percentage', 10, 'تم التوصيل', 'شكراً لكم!'),
  ('80000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 1002, 'ليلى عميل', 'نقداً', '{"city":"الخليل","area":"المنطقة الجنوبية","street":"شارع الحرم","building":"عمارة 7","apartment":"12"}', '[{"product_id":"20000000-0000-0000-0000-000000000004","quantity":1}]', 150, 132, 'percentage', 12, 'قيد التوصيل', 'يرجى الاتصال قبل التوصيل');

-- بيانات عناصر الطلب (order_items)
insert into public.order_items (id, order_id, product_id, order_number, price, quantity)
values
  ('90000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 1001, 999, 2),
  ('90000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', 1002, 150, 1);

-- بيانات معلومات الاتصال (contact_info)
insert into public.contact_info (id, email, phone, address, facebook, instagram, whatsapp, working_hours, fields_order)
values
  ('a0000000-0000-0000-0000-000000000001', 'info@demo.com', '+970599999999', 'فلسطين - رام الله', 'fb.com/demo', 'insta.com/demo', 'wa.me/970599999999', 'من 8 صباحاً حتى 8 مساءً', '["email","phone","address","working_hours","facebook","instagram","whatsapp"]'),
  ('a0000000-0000-0000-0000-000000000002', 'support@demo.com', '0561112233', 'فلسطين - نابلس', 'fb.com/support', 'insta.com/support', 'wa.me/0561112233', 'من 9 صباحاً حتى 6 مساءً', '["email","phone","address","working_hours","facebook","instagram","whatsapp"]');

-- بيانات الإعدادات (settings)
insert into public.settings (key, value)
values
  ('site_name', 'متجر تجريبي'),
  ('currency', 'شيكل'),
  ('support_email', 'support@demo.com'),
  ('delivery_fee', '20'),
  ('min_order', '50');

-- بيانات سجل النشاط (user_activity_log)
insert into public.user_activity_log (id, user_id, admin_id, action, target_field, old_value, new_value, details)
values
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'تعديل العنوان', 'address', 'رام الله القديمة', 'رام الله الجديدة', '{"reason":"تصحيح العنوان"}'),
  ('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'إضافة عنوان', 'address', null, 'الخليل', '{"reason":"إضافة عنوان جديد"}');

-- بيانات المستخدمين المحذوفين (deleted_users)
insert into public.deleted_users (id, user_id, full_name, email, phone, address, user_type, created_at, deleted_at, deleted_by, deleted_by_name, last_sign_in_at, highest_order_value, purchased_products, orders, original_data)
values
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'مستخدم محذوف', 'deleted@example.com', '+970590000004', 'نابلس', 'retail', '2025-01-01', '2025-06-01', '00000000-0000-0000-0000-000000000001', 'أحمد المدير', '2025-05-01', 500, '[{"product_id":"20000000-0000-0000-0000-000000000002","quantity":1}]', '[{"order_id":"80000000-0000-0000-0000-000000000001"}]', '{"note":"حذف يدوي"}'),
  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'مستخدم محذوف 2', 'deleted2@example.com', '0598765432', 'بيت لحم', 'wholesale', '2025-02-01', '2025-06-15', '00000000-0000-0000-0000-000000000001', 'أحمد المدير', '2025-05-15', 800, '[{"product_id":"20000000-0000-0000-0000-000000000005","quantity":2}]', '[{"order_id":"80000000-0000-0000-0000-000000000002"}]', '{"note":"حذف تلقائي"}');
