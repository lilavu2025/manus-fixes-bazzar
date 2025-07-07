-- سكريبت إنشاء قاعدة بيانات المشروع مع السياسات (Supabase/Postgres)
-- إعداد ENUM
create type public.user_type as enum ('admin', 'wholesale', 'retail');

-- جدول المستخدمين (profiles)
create table if not exists public.profiles (
  id uuid primary key,
  full_name text not null,
  email text,
  email_confirmed_at timestamp,
  phone text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  last_sign_in_at timestamp,
  last_order_date timestamp,
  highest_order_value numeric,
  language text,
  disabled boolean,
  user_type public.user_type
);

-- جدول العناوين
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  full_name text not null,
  phone text not null,
  city text not null,
  area text not null,
  street text not null,
  building text not null,
  floor text,
  apartment text,
  is_default boolean,
  created_at timestamp with time zone default now()
);

-- جدول الفئات
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  name_he text not null,
  image text not null,
  icon text not null,
  active boolean,
  created_at timestamp with time zone default now()
);

-- جدول المنتجات
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name_ar text not null,
  name_en text not null,
  name_he text not null,
  description_ar text not null,
  description_en text not null,
  description_he text not null,
  image text not null,
  images text[],
  price numeric not null,
  original_price numeric,
  wholesale_price numeric,
  discount numeric,
  featured boolean,
  in_stock boolean,
  stock_quantity integer,
  active boolean,
  top_ordered boolean,
  rating numeric,
  reviews_count integer,
  sales_count integer,
  tags text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- جدول العروض
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text not null,
  title_he text not null,
  description_ar text not null,
  description_en text not null,
  description_he text not null,
  image_url text not null,
  discount_percent numeric not null,
  start_date date not null,
  end_date date not null,
  active boolean,
  created_at timestamp with time zone default now()
);

-- جدول السلة
create table if not exists public.cart (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  quantity integer not null default 1,
  added_at timestamp with time zone default now()
);

-- جدول المفضلة
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  added_at timestamp with time zone default now()
);

-- جدول الطلبات
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  order_number integer not null,
  customer_name text,
  payment_method text,
  shipping_address jsonb not null,
  items jsonb,
  total numeric not null,
  total_after_discount numeric,
  discount_type text,
  discount_value numeric,
  status text not null,
  notes text,
  admin_created boolean,
  admin_creator_name text,
  cancelled_by uuid,
  cancelled_by_name text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- جدول عناصر الطلب
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  order_number integer,
  price numeric not null,
  quantity integer not null,
  created_at timestamp with time zone default now()
);

-- جدول معلومات الاتصال (تم نسخه من contact_info.sql)
create table if not exists public.contact_info (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  phone text,
  address text,
  facebook text,
  instagram text,
  whatsapp text,
  working_hours text,
  fields_order jsonb,
  updated_at timestamp with time zone default now()
);

-- جدول المستخدمين المحذوفين
create table if not exists public.deleted_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  full_name text,
  email text,
  phone text,
  address text,
  user_type public.user_type,
  created_at timestamp,
  deleted_at timestamp,
  deleted_by uuid,
  deleted_by_name text,
  last_sign_in_at timestamp,
  highest_order_value numeric,
  purchased_products jsonb,
  orders jsonb,
  original_data jsonb
);

-- جدول الإعدادات
create table if not exists public.settings (
  key text primary key,
  value text
);

-- جدول سجل النشاط
create table if not exists public.user_activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  admin_id uuid,
  action text not null,
  target_field text,
  old_value text,
  new_value text,
  details jsonb,
  created_at timestamp with time zone default now()
);

-- جدول البانرات
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  image text not null,
  link text,
  title_ar text not null,
  title_en text not null,
  title_he text not null,
  subtitle_ar text not null,
  subtitle_en text not null,
  subtitle_he text not null,
  sort_order integer,
  active boolean,
  created_at timestamp with time zone default now()
);

-- تفعيل RLS على كل الجداول
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.offers enable row level security;
alter table public.cart enable row level security;
alter table public.favorites enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.contact_info enable row level security;
alter table public.deleted_users enable row level security;
alter table public.settings enable row level security;
alter table public.user_activity_log enable row level security;
alter table public.banners enable row level security;

-- سياسات الأمان (مثال عملي)
-- profiles: كل مستخدم يعدل بياناته فقط
create policy "Users can view their profile" on public.profiles for select using (auth.uid()::uuid = id);
create policy "Users can update their profile" on public.profiles for update using (auth.uid()::uuid = id);

-- addresses: كل مستخدم يدير عناوينه فقط
create policy "Users can manage their addresses" on public.addresses for all using (auth.uid()::uuid = user_id);

-- cart: كل مستخدم يدير سلته فقط
create policy "Users can manage their cart" on public.cart for all using (auth.uid()::uuid = user_id);

-- favorites: كل مستخدم يدير مفضلته فقط
create policy "Users can manage their favorites" on public.favorites for all using (auth.uid()::uuid = user_id);

-- orders: كل مستخدم يرى ويعدل طلباته فقط
create policy "Users can manage their orders" on public.orders for all using (auth.uid()::uuid = user_id);

-- order_items: السماح بالقراءة فقط للجميع
create policy "Anyone can view order items" on public.order_items for select using (true);

-- categories, products, offers, banners: القراءة للجميع
create policy "Anyone can view categories" on public.categories for select using (true);
create policy "Anyone can view products" on public.products for select using (true);
create policy "Anyone can view offers" on public.offers for select using (true);
create policy "Anyone can view banners" on public.banners for select using (true);

-- contact_info: القراءة للجميع، التعديل للإدارة فقط
create policy "Anyone can view contact info" on public.contact_info for select using (true);
create policy "Admins can update contact info" on public.contact_info for update using (auth.role() = 'authenticated' and (select user_type from public.profiles where id = auth.uid()::uuid) = 'admin');

-- settings, user_activity_log: للإدارة فقط
create policy "Admins can manage settings" on public.settings for all using (auth.role() = 'authenticated' and (select user_type from public.profiles where id = auth.uid()::uuid) = 'admin');
create policy "Admins can manage activity log" on public.user_activity_log for all using (auth.role() = 'authenticated' and (select user_type from public.profiles where id = auth.uid()::uuid) = 'admin');

-- deleted_users: للإدارة فقط
create policy "Admins can manage deleted users" on public.deleted_users for all using (auth.role() = 'authenticated' and (select user_type from public.profiles where id = auth.uid()::uuid) = 'admin');

-- مثال: إدخال بيانات افتراضية لمعلومات الاتصال
insert into public.contact_info (email, phone, address, facebook, instagram, whatsapp, working_hours, fields_order)
values ('info@example.com', '+970000000000', 'العنوان هنا', '', '', '', 'من 9 صباحاً حتى 5 مساءً', '["email","phone","address","working_hours","facebook","instagram","whatsapp"]')
on conflict do nothing;

-- إدخال افتراضي لإعداد إخفاء صفحة العروض
insert into public.settings (key, value) values ('hide_offers_page', 'false') on conflict (key) do nothing;



----------------- تريجرات إضافية -----------------
-- تريجر لتحديث حالة المنتج في المخزون بناءً على الكمية
-- هذا التريجر يقوم بتحديث حالة المنتج في المخزون (in_stock) بناءً على الكمية المتاحة
CREATE OR REPLACE FUNCTION update_in_stock_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock_quantity <= 0 THEN
    NEW.in_stock := FALSE;
  ELSE
    NEW.in_stock := TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_in_stock ON products;

CREATE TRIGGER trg_update_in_stock
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_in_stock_status();


----- تريجر لتحديث إحصائيات الطلبات في ملف المستخدم عند إضافة طلب جديد
CREATE OR REPLACE FUNCTION public.update_profile_order_stats()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles
  SET
    last_order_date = NEW.created_at,
    highest_order_value = GREATEST(
      COALESCE(highest_order_value, 0),
      COALESCE(NEW.total, 0)
    )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- حذف الـ Trigger إذا كان موجودًا
DROP TRIGGER IF EXISTS trg_update_profile_order_stats ON public.orders;

-- إنشاء الـ Trigger بعد الحذف
CREATE TRIGGER trg_update_profile_order_stats
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_order_stats();

----- ربط اعمده forgn key في الجداول التي تحتاجها
-- addresses.user_id → profiles.id
ALTER TABLE addresses
ADD CONSTRAINT fk_addresses_user_id
FOREIGN KEY (user_id) REFERENCES profiles(id);

-- cart.product_id → products.id
ALTER TABLE cart
ADD CONSTRAINT fk_cart_product_id
FOREIGN KEY (product_id) REFERENCES products(id);

-- cart.user_id → auth.users.id
ALTER TABLE cart
ADD CONSTRAINT fk_cart_user_id
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- favorites.product_id → products.id
ALTER TABLE favorites
ADD CONSTRAINT fk_favorites_product_id
FOREIGN KEY (product_id) REFERENCES products(id);

-- favorites.user_id → auth.users.id
ALTER TABLE favorites
ADD CONSTRAINT fk_favorites_user_id
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- order_items.order_id → orders.id
ALTER TABLE order_items
ADD CONSTRAINT fk_order_items_order_id
FOREIGN KEY (order_id) REFERENCES orders(id);

-- order_items.product_id → products.id
ALTER TABLE order_items
ADD CONSTRAINT fk_order_items_product_id
FOREIGN KEY (product_id) REFERENCES products(id);

-- orders.user_id → profiles.id
ALTER TABLE orders
ADD CONSTRAINT fk_orders_user_id
FOREIGN KEY (user_id) REFERENCES profiles(id);

-- products.category_id → categories.id
ALTER TABLE products
ADD CONSTRAINT fk_products_category_id
FOREIGN KEY (category_id) REFERENCES categories(id);

-- profiles.id → auth.users.id (هنا المفتاح الأساسي هو أيضًا مفتاح أجنبي)
ALTER TABLE profiles
ADD CONSTRAINT fk_profiles_id
FOREIGN KEY (id) REFERENCES auth.users(id);

-- user_activity_log.admin_id → auth.users.id
ALTER TABLE user_activity_log
ADD CONSTRAINT fk_user_activity_log_admin_id
FOREIGN KEY (admin_id) REFERENCES auth.users(id);

----- تريجر لإنشاء ملف تعريف جديد عند إنشاء مستخدم جديد في auth.users
-- هذا التريجر يقوم بإنشاء سجل جديد في جدول profiles عند إنشاء مستخدم جديد
CREATE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 1. handle_new_user: ينشئ صف في profiles عند التسجيل
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, created_at, updated_at)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. set_email_confirmed_for_oauth: تأكيد الإيميل لو كان عبر OAuth
CREATE OR REPLACE FUNCTION public.set_email_confirmed_for_oauth()
RETURNS trigger AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. sync_email_confirmed_to_profiles: مزامنة تأكيد الإيميل إلى جدول profiles
CREATE OR REPLACE FUNCTION public.sync_email_confirmed_to_profiles()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET email_confirmed_at = NEW.email_confirmed_at
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. update_last_sign_in: تحديث آخر دخول للمستخدم
CREATE OR REPLACE FUNCTION public.update_last_sign_in()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET last_sign_in_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. update_profile_order_stats: تحديث بيانات المستخدم بناءً على الطلبات
CREATE OR REPLACE FUNCTION public.update_profile_order_stats()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET
    last_order_date = GREATEST(COALESCE(last_order_date, 'epoch'::timestamp), NEW.created_at),
    highest_order_value = GREATEST(COALESCE(highest_order_value, 0), COALESCE(NEW.total_amount, 0))
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. validate_phone: التحقق من رقم الجوال (بدأ بـ05 وطوله 10 أرقام)
CREATE OR REPLACE FUNCTION public.validate_phone(phone TEXT)
RETURNS boolean AS $$
BEGIN
  RETURN phone ~ '^05[0-9]{8}$';
END;
$$ LANGUAGE plpgsql;

-- 7. update_in_stock_status: تحديث حالة التخزين بناءً على الكمية
CREATE OR REPLACE FUNCTION public.update_in_stock_status()
RETURNS trigger AS $$
BEGIN
  UPDATE public.products
  SET in_stock = (NEW.stock_quantity > 0)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. log_user_update_activity: تسجيل نشاط تحديث المستخدم
CREATE OR REPLACE FUNCTION public.log_user_update_activity()
RETURNS trigger AS $$
DECLARE
  _uid uuid;
BEGIN
  INSERT INTO public.user_activity_log (admin_id, user_id, action, created_at)
  VALUES (current_setting('request.jwt.claim.sub')::uuid, NEW.id, 'update_profile', now())
  RETURNING id INTO _uid;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. log_multiple_user_updates: تسجيل نشاط لعدة مستخدمين
CREATE OR REPLACE FUNCTION public.log_multiple_user_updates(_user_ids uuid[], _action text)
RETURNS uuid[] AS $$
DECLARE
  _result uuid[];
BEGIN
  INSERT INTO public.user_activity_log (admin_id, user_id, action, created_at)
  SELECT current_setting('request.jwt.claim.sub')::uuid, u, _action, now()
  FROM unnest(_user_ids) AS u
  RETURNING id INTO _result;
  RETURN _result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 🧼 حذف التريجرات إذا كانت موجودة مسبقًا

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_oauth_signup ON auth.users;
DROP TRIGGER IF EXISTS on_user_update_email ON auth.users;
DROP TRIGGER IF EXISTS on_user_signed_in ON auth.users;
DROP TRIGGER IF EXISTS on_order_created ON public.orders;
DROP TRIGGER IF EXISTS on_product_stock_change ON public.products;
DROP TRIGGER IF EXISTS on_profile_update ON public.profiles;

-- ✅ إنشاء التريجرات من جديد

-- عند تسجيل مستخدم جديد
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- عند التسجيل عبر OAuth
CREATE TRIGGER on_auth_oauth_signup
AFTER INSERT ON auth.users
FOR EACH ROW
WHEN (NEW.raw_user_meta_data IS NOT NULL)
EXECUTE FUNCTION public.set_email_confirmed_for_oauth();

-- مزامنة تأكيد الإيميل إلى جدول profiles
CREATE TRIGGER on_user_update_email
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_email_confirmed_to_profiles();

-- تحديث وقت آخر تسجيل دخول
CREATE TRIGGER on_user_signed_in
AFTER UPDATE OF last_sign_in_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.update_last_sign_in();

-- بعد إنشاء طلب جديد (orders)
CREATE TRIGGER on_order_created
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_order_stats();

-- تحديث حالة التوفر بعد إدخال/تحديث كمية المنتج
CREATE TRIGGER on_product_stock_change
AFTER INSERT OR UPDATE OF stock_quantity ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_in_stock_status();

-- تسجيل النشاط عند تعديل ملف المستخدم
CREATE TRIGGER on_profile_update
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.log_user_update_activity();
