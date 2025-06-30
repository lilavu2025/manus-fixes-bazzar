
create type public.user_type as enum ('admin', 'wholesale', 'retail');

-- إنشاء الجداول
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY,
  full_name text NOT NULL,
  email text NULL,
  phone text NULL,
  user_type text NULL DEFAULT 'retail',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.categories (
  id uuid NOT NULL PRIMARY KEY,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  name_he text NOT NULL,
  image text NOT NULL,
  icon text NOT NULL,
  active boolean NULL DEFAULT true
);

CREATE TABLE public.products (
  id uuid NOT NULL PRIMARY KEY,
  category_id uuid NOT NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  name_he text NOT NULL,
  description_ar text NOT NULL,
  description_en text NOT NULL,
  description_he text NOT NULL,
  image text NOT NULL,
  price numeric(10,2) NOT NULL,
  in_stock boolean NULL DEFAULT true,
  stock_quantity integer NULL DEFAULT 0,
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE
);

CREATE TABLE public.offers (
  id uuid NOT NULL PRIMARY KEY,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  title_he text NOT NULL,
  description_ar text NOT NULL,
  description_en text NOT NULL,
  description_he text NOT NULL,
  image_url text NOT NULL,
  discount_percent integer NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  active boolean NULL DEFAULT true
);

CREATE TABLE public.banners (
  id uuid NOT NULL PRIMARY KEY,
  image text NOT NULL,
  link text NOT NULL,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  title_he text NOT NULL,
  subtitle_ar text NOT NULL,
  subtitle_en text NOT NULL,
  subtitle_he text NOT NULL,
  sort_order integer NOT NULL,
  active boolean NULL DEFAULT true
);

CREATE TABLE public.addresses (
  id uuid NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  city text NOT NULL,
  area text NOT NULL,
  street text NOT NULL,
  building text NOT NULL,
  floor text NULL,
  apartment text NULL,
  is_default boolean NULL DEFAULT false,
  CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.cart (
  id uuid NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL,
  CONSTRAINT cart_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT cart_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

CREATE TABLE public.favorites (
  id uuid NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT favorites_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

CREATE TABLE public.orders (
  id uuid NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  order_number integer NOT NULL,
  customer_name text NOT NULL,
  payment_method text NOT NULL,
  shipping_address jsonb NOT NULL,
  items jsonb NOT NULL,
  total numeric(10,2) NOT NULL,
  total_after_discount numeric(10,2) NOT NULL,
  discount_type text NOT NULL,
  discount_value numeric(10,2) NOT NULL,
  status text NOT NULL,
  notes text NULL,
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.order_items (
  id uuid NOT NULL PRIMARY KEY,
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  order_number integer NOT NULL,
  price numeric(10,2) NOT NULL,
  quantity integer NOT NULL,
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

CREATE TABLE public.contact_info (
  id uuid NOT NULL PRIMARY KEY,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  facebook text NULL,
  instagram text NULL,
  whatsapp text NULL,
  working_hours text NULL,
  fields_order jsonb NOT NULL
);

CREATE TABLE public.settings (
  key text NOT NULL PRIMARY KEY,
  value text NOT NULL
);

CREATE TABLE public.user_activity_log (
  id uuid NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_field text NOT NULL,
  old_value text NULL,
  new_value text NULL,
  details jsonb NULL
);

CREATE TABLE public.deleted_users (
  id uuid NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  user_type text NOT NULL,
  created_at timestamp with time zone NOT NULL,
  deleted_at timestamp with time zone NOT NULL,
  deleted_by uuid NOT NULL,
  deleted_by_name text NOT NULL,
  last_sign_in_at timestamp with time zone NULL,
  highest_order_value numeric(10,2) NULL,
  purchased_products jsonb NULL,
  orders jsonb NULL,
  original_data jsonb NULL
);

-- إنشاء الدوال
CREATE OR REPLACE FUNCTION public.update_in_stock_status() RETURNS trigger AS $$
BEGIN
  IF NEW.stock_quantity <= 0 THEN
    NEW.in_stock := FALSE;
  ELSE
    NEW.in_stock := TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء التريجرات
CREATE TRIGGER update_in_stock
AFTER INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_in_stock_status();


-- مثال: إدخال بيانات افتراضية لمعلومات الاتصال
insert into public.contact_info (email, phone, address, facebook, instagram, whatsapp, working_hours, fields_order)
values ('info@example.com', '+970000000000', 'العنوان هنا', '', '', '', 'من 9 صباحاً حتى 5 مساءً', '["email","phone","address","working_hours","facebook","instagram","whatsapp"]')
on conflict do nothing;

-- إدخال افتراضي لإعداد إخفاء صفحة العروض
insert into public.settings (key, value) values ('hide_offers_page', 'false') on conflict (key) do nothing;

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