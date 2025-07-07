
create type public.user_type as enum ('admin', 'wholesale', 'retail');

-- إنشاء جدول addresses
CREATE TABLE public.addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
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
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT addresses_pkey PRIMARY KEY (id),
  CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- إنشاء جدول banners
CREATE TABLE public.banners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title_ar text NOT NULL,
  title_en text NOT NULL,
  title_he text NOT NULL,
  subtitle_ar text NOT NULL,
  subtitle_en text NOT NULL,
  subtitle_he text NOT NULL,
  image text NOT NULL,
  link text NULL,
  active boolean NULL DEFAULT true,
  sort_order integer NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT banners_pkey PRIMARY KEY (id)
);

-- إنشاء جدول cart
CREATE TABLE public.cart (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  added_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT cart_pkey PRIMARY KEY (id),
  CONSTRAINT cart_user_id_product_id_key UNIQUE (user_id, product_id),
  CONSTRAINT cart_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT cart_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- إنشاء جدول categories
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  name_he text NOT NULL,
  image text NOT NULL,
  icon text NOT NULL,
  active boolean NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);

-- إنشاء جدول contact_info
CREATE TABLE public.contact_info (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  phone text NULL,
  address text NULL,
  facebook text NULL,
  instagram text NULL,
  whatsapp text NULL,
  updated_at timestamp with time zone NULL DEFAULT now(),
  working_hours text NULL,
  fields_order jsonb NULL,
  CONSTRAINT contact_info_pkey PRIMARY KEY (id)
);

-- إنشاء جدول deleted_users
CREATE TABLE public.deleted_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NULL,
  email text NULL,
  phone text NULL,
  address text NULL,
  deleted_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_by uuid NULL,
  original_data jsonb NULL,
  last_sign_in_at timestamp with time zone NULL,
  user_type text NULL,
  created_at timestamp with time zone NULL,
  deleted_by_name text NULL,
  highest_order_value numeric NULL,
  purchased_products jsonb NULL,
  orders jsonb NULL,
  CONSTRAINT deleted_users_pkey PRIMARY KEY (id)
);

-- إنشاء جدول favorites
CREATE TABLE public.favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  added_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT favorites_pkey PRIMARY KEY (id),
  CONSTRAINT favorites_user_id_product_id_key UNIQUE (user_id, product_id),
  CONSTRAINT favorites_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- إنشاء جدول offers
CREATE TABLE public.offers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title_ar text NOT NULL,
  title_en text NOT NULL,
  title_he text NOT NULL,
  description_ar text NOT NULL,
  description_en text NOT NULL,
  description_he text NOT NULL,
  discount_percent numeric NOT NULL,
  image_url text NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  active boolean NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT offers_pkey PRIMARY KEY (id),
  CONSTRAINT offers_check CHECK ((end_date > start_date)),
  CONSTRAINT offers_discount_percent_check CHECK (((discount_percent >= (0)::numeric) AND (discount_percent <= (100)::numeric)))
);

-- إنشاء جدول order_items
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL,
  price numeric(10,2) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  order_number bigint NULL,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- إنشاء جدول orders
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  total numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  payment_method text NOT NULL DEFAULT 'cash'::text,
  notes text NULL,
  shipping_address jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  items jsonb NULL,
  admin_created boolean NULL DEFAULT false,
  admin_creator_name text NULL,
  cancelled_by text NULL,
  cancelled_by_name text NULL,
  customer_name text NULL,
  discount_type character varying(10) NULL,
  discount_value numeric NULL,
  total_after_discount numeric NULL,
  order_number bigserial NOT NULL,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_order_number_key UNIQUE (order_number),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT orders_payment_method_check CHECK ((payment_method = ANY (ARRAY['cash'::text, 'card'::text, 'bank_transfer'::text]))),
  CONSTRAINT orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text])))
);

-- إنشاء جدول products
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  name_he text NOT NULL,
  description_ar text NOT NULL,
  description_en text NOT NULL,
  description_he text NOT NULL,
  price numeric(10,2) NOT NULL,
  original_price numeric(10,2) NULL,
  image text NOT NULL,
  images text[] NULL DEFAULT '{}'::text[],
  category_id uuid NOT NULL,
  in_stock boolean NULL DEFAULT true,
  stock_quantity integer NULL DEFAULT 0,
  rating numeric(3,2) NULL DEFAULT 0,
  reviews_count integer NULL DEFAULT 0,
  discount numeric(5,2) NULL,
  featured boolean NULL DEFAULT false,
  tags text[] NULL DEFAULT '{}'::text[],
  active boolean NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  wholesale_price numeric(10,2) NULL,
  top_ordered boolean NULL DEFAULT false,
  sales_count integer NULL DEFAULT 0,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE
);

-- إنشاء جدول profiles
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text NOT NULL,
  phone text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_type public.user_type NULL DEFAULT 'retail'::user_type,
  email text NULL,
  email_confirmed_at timestamp with time zone NULL,
  disabled boolean NULL DEFAULT false,
  last_order_date timestamp with time zone NULL,
  highest_order_value numeric NULL,
  last_sign_in_at timestamp without time zone NULL,
  language text NULL DEFAULT 'ar'::text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- إنشاء جدول settings
CREATE TABLE public.settings (
  key text NOT NULL,
  value text NULL,
  CONSTRAINT settings_pkey PRIMARY KEY (key)
);

-- إنشاء جدول user_activity_log
CREATE TABLE public.user_activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid NULL,
  user_id uuid NOT NULL,
  action text NOT NULL,
  target_field text NULL,
  old_value text NULL,
  new_value text NULL,
  details jsonb NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT user_activity_log_pkey PRIMARY KEY (id),
  CONSTRAINT user_activity_log_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE SET NULL
);


---------نهاية إنشاء الجداول ---------


-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_user_activity_log_admin_id ON public.user_activity_log USING btree (admin_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON public.user_activity_log USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_action ON public.user_activity_log USING btree (action);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON public.user_activity_log USING btree (created_at DESC);

-- إنشاء السياسات (RLS Policies)
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can view their own addresses" ON public.addresses FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create their own addresses" ON public.addresses FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own addresses" ON public.addresses FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own addresses" ON public.addresses FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "Banners are viewable by everyone" ON public.banners FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view order items for their orders" ON public.order_items FOR SELECT TO authenticated USING (order_id IN (SELECT orders.id FROM orders WHERE (orders.user_id = auth.uid())));
CREATE POLICY "Users can insert into their own favorites" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can create order items for their orders" ON public.order_items FOR INSERT TO authenticated WITH CHECK (order_id IN (SELECT orders.id FROM orders WHERE (orders.user_id = auth.uid())));
CREATE POLICY "Users can delete from their own favorites" ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Everyone can view active offers" ON public.offers FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "Users can manage their own cart" ON public.cart FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anonymous cart access" ON public.cart FOR ALL TO anon USING (true);
CREATE POLICY "Admins can view all orders" ON public.orders FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.user_type = 'admin'::user_type))));
CREATE POLICY "Users can insert into their own cart" ON public.cart FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cart" ON public.cart FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from their own cart" ON public.cart FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all order items" ON public.order_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.user_type = 'admin'::user_type))));
CREATE POLICY "Users can view their own cart" ON public.cart FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any order" ON public.orders FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.user_type = 'admin'::user_type))));
CREATE POLICY "Allow admin users to view all profiles" ON public.profiles FOR SELECT TO authenticated USING ((user_type = 'admin'::useruser_type) OR true);
CREATE POLICY "Allow admin users to update profiles" ON public.profiles FOR UPDATE TO authenticated USING (user_type = 'admin'::user_type);
CREATE POLICY "Allow admin users to delete profiles" ON public.profiles FOR DELETE TO authenticated USING (user_type = 'admin'::user_type);
CREATE POLICY "Users can update own orders" ON public.orders FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.role() = 'authenticated'::text) AND (id = auth.uid()));
CREATE POLICY "Users can manage own addresses" ON public.addresses FOR ALL TO authenticated USING ((auth.role() = 'authenticated'::text) AND (user_id = auth.uid()));
CREATE POLICY "Public can read banners" ON public.banners FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage banners" ON public.banners FOR ALL TO authenticated USING ((auth.role() = 'authenticated'::text) AND ((SELECT profiles.user_type FROM profiles WHERE (profiles.id = auth.uid())) = 'admin'::user_type));
CREATE POLICY "Users can manage own cart" ON public.cart FOR ALL TO authenticated USING ((auth.role() = 'authenticated'::text) AND (user_id = auth.uid()));
CREATE POLICY "Public can read categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO authenticated USING ((auth.role() = 'authenticated'::text) AND ((SELECT profiles.user_type FROM profiles WHERE (profiles.id = auth.uid())) = 'admin'::user_type));
CREATE POLICY "Users can manage own favorites" ON public.favorites FOR ALL TO authenticated USING ((auth.role() = 'authenticated'::text) AND (user_id = auth.uid()));
CREATE POLICY "Public can read offers" ON public.offers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage offers" ON public.offers FOR ALL TO authenticated USING ((auth.role() = 'authenticated'::text) AND ((SELECT profiles.user_type FROM profiles WHERE (profiles.id = auth.uid())) = 'admin'::user_type));
CREATE POLICY "Users can manage own order items" ON public.order_items FOR ALL TO authenticated USING ((auth.role() = 'authenticated'::text) AND ((SELECT orders.user_id FROM orders WHERE (orders.id = order_items.order_id)) = auth.uid()));
CREATE POLICY "Users can manage own orders" ON public.orders FOR ALL TO authenticated USING ((auth.role() = 'authenticated'::text) AND (user_id = auth.uid()));
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL TO authenticated USING ((auth.role() = 'authenticated'::text) AND ((SELECT profiles.user_type FROM profiles WHERE (profiles.id = auth.uid())) = 'admin'::user_type));
CREATE POLICY "Public can read products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL TO authenticated USING ((auth.role() = 'authenticated'::text) AND ((SELECT profiles.user_type FROM profiles WHERE (profiles.id = auth.uid())) = 'admin'::user_type));
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.role() = 'authenticated'::text) AND (id = auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.role() = 'authenticated'::text) AND (id = auth.uid()));
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated USING ((auth.role() = 'authenticated'::text) AND ((SELECT profiles_1.user_type FROM profiles profiles_1 WHERE (profiles_1.id = auth.uid())) = 'admin'::user_type));

-- إنشاء التريجرات
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

CREATE TRIGGER trigger_update_in_stock_status
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_in_stock_status();

CREATE OR REPLACE FUNCTION public.update_last_sign_in() RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
    SET last_sign_in_at = NEW.last_sign_in_at
  WHERE id = NEW.id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_last_sign_in
BEFORE UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.update_last_sign_in();

CREATE OR REPLACE FUNCTION public.log_user_update_activity(p_admin_id uuid, p_user_id uuid, p_field_name text, p_old_value text, p_new_value text, p_details jsonb DEFAULT '{}'::jsonb) RETURNS uuid AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.user_activity_log (
    admin_id,
    user_id,
    action,
    target_field,
    old_value,
    new_value,
    details,
    created_at
  ) VALUES (
    p_admin_id,
    p_user_id,
    'update',
    p_field_name,
    p_old_value,
    p_new_value,
    p_details,
    now()
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.log_multiple_user_updates(p_admin_id uuid, p_user_id uuid, p_changes jsonb) RETURNS uuid[] AS $$
DECLARE
  log_ids uuid[] := '{}';
  change_record jsonb;
  log_id uuid;
BEGIN
  FOR change_record IN SELECT * FROM jsonb_array_elements(p_changes)
  LOOP
    INSERT INTO public.user_activity_log (
      admin_id,
      user_id,
      action,
      target_field,
      old_value,
      new_value,
      details,
      created_at
    ) VALUES (
      p_admin_id,
      p_user_id,
      'update',
      change_record->>'field',
      change_record->>'old_value',
      change_record->>'new_value',
      jsonb_build_object(
        'batch_update', true,
        'total_changes', jsonb_array_length(p_changes)
      ),
      now()
    ) RETURNING id INTO log_id;

    log_ids := log_ids || log_id;
  END LOOP;

  RETURN log_ids;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_profile_order_stats() RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
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

CREATE OR REPLACE FUNCTION public.sync_email_confirmed_to_profiles() RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
    SET email_confirmed_at = NEW.email_confirmed_at
    WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
BEGIN
  RAISE NOTICE 'Creating profile for user: %', NEW.id;
  RAISE NOTICE 'Meta data: %', NEW.raw_user_meta_data;

  INSERT INTO public.profiles (id, full_name, phone, user_type, email, email_confirmed_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'مستخدم جديد'),
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data ->> 'phone', '') = '' THEN NULL 
      ELSE NEW.raw_user_meta_data ->> 'phone'
    END,
    'retail'::public.user_type,
    NEW.email,
    NEW.email_confirmed_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_handle_new_user
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- تفعيل RLS على الجداول
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS للجداول
CREATE POLICY "Allow users to view their own profiles" ON public.profiles
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Allow users to update their own profiles" ON public.profiles
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Allow users to manage their own orders" ON public.orders
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Allow users to manage their own cart" ON public.cart
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Allow users to manage their own favorites" ON public.favorites
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Allow admins to manage all profiles" ON public.profiles
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_type = 'admin' AND id = auth.uid()));

CREATE POLICY "Allow admins to manage all orders" ON public.orders
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_type = 'admin' AND id = auth.uid()));

CREATE POLICY "Allow admins to manage all products" ON public.products
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_type = 'admin' AND id = auth.uid()));

CREATE POLICY "Allow admins to manage all categories" ON public.categories
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_type = 'admin' AND id = auth.uid()));

CREATE POLICY "Allow admins to manage all banners" ON public.banners
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_type = 'admin' AND id = auth.uid()));

CREATE POLICY "Allow admins to manage all offers" ON public.offers
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_type = 'admin' AND id = auth.uid()));

CREATE POLICY "Allow admins to manage all settings" ON public.settings
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_type = 'admin' AND id = auth.uid()));

CREATE POLICY "Allow admins to manage user activity logs" ON public.user_activity_log
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_type = 'admin' AND id = auth.uid()));

-- تفعيل السياسات
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cart FORCE ROW LEVEL SECURITY;
ALTER TABLE public.favorites FORCE ROW LEVEL SECURITY;
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;
ALTER TABLE public.categories FORCE ROW LEVEL SECURITY;
ALTER TABLE public.banners FORCE ROW LEVEL SECURITY;
ALTER TABLE public.offers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.settings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log FORCE ROW LEVEL SECURITY;

-- ملاحظة: تأكد من مراجعة السياسات وتعديلها حسب الحاجة لضمان الأمان والامتثال للمتطلبات.