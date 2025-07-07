------انشاء الجداول في قاعدة البيانات بالترتيب الصحيح ------

-- إنشاء جدول settings
CREATE TABLE public.settings (
  key text NOT NULL,
  value text NULL,
  CONSTRAINT settings_pkey PRIMARY KEY (key)
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

-- إنشاء جدول products -- بعد categories
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

-- إنشاء جدول profiles -- بعد auth.users
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

-- إنشاء جدول orders -- بعد profiles
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

-- إنشاء جدول order_items  -- بعد orders + products
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

-- إنشاء جدول cart  -- بعد products + auth.users
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

-- إنشاء جدول favorites -- بعد products + auth.users
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

-- إنشاء جدول addresses  -- بعد profiles
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