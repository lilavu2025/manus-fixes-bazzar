-- تفعيل RLS
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- السياسات

CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles AS p
  WHERE p.id = auth.uid() AND p.user_type = 'admin'
));


CREATE POLICY "Public can view active products" ON public.products
FOR SELECT TO authenticated
USING (active = true);

CREATE POLICY "Admins can manage all products" ON public.products
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin'
));


CREATE POLICY "Users can manage their own orders" ON public.orders
FOR ALL TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all orders" ON public.orders
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin'
));


CREATE POLICY "Users can manage own cart" ON public.cart
FOR ALL TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Anonymous users can use cart" ON public.cart
FOR ALL TO anon
USING (true);


CREATE POLICY "Public can read active categories" ON public.categories
FOR SELECT TO authenticated
USING (active = true);

CREATE POLICY "Admins can manage all categories" ON public.categories
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin'
));


CREATE POLICY "Public can read active banners" ON public.banners
FOR SELECT TO authenticated
USING (active = true);

CREATE POLICY "Admins can manage all banners" ON public.banners
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin'
));


CREATE POLICY "Public can read active offers" ON public.offers
FOR SELECT TO authenticated
USING (active = true);

CREATE POLICY "Admins can manage all offers" ON public.offers
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin'
));


CREATE POLICY "Users can manage their own favorites" ON public.favorites
FOR ALL TO authenticated
USING (user_id = auth.uid());


CREATE POLICY "Users can manage their own addresses" ON public.addresses
FOR ALL TO authenticated
USING (user_id = auth.uid());


CREATE POLICY "Admins can manage settings" ON public.settings
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin'
));

CREATE POLICY "Admins can manage user activity log" ON public.user_activity_log
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin'
));


CREATE POLICY "Users can manage own order_items" ON public.order_items
FOR ALL TO authenticated
USING (order_id IN (
  SELECT id FROM public.orders WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can manage all order_items" ON public.order_items
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin'
));

CREATE POLICY "Allow users to create their profile"
ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);



-- فرض RLS
ALTER TABLE public.addresses FORCE ROW LEVEL SECURITY;
ALTER TABLE public.banners FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cart FORCE ROW LEVEL SECURITY;
ALTER TABLE public.categories FORCE ROW LEVEL SECURITY;
ALTER TABLE public.favorites FORCE ROW LEVEL SECURITY;
ALTER TABLE public.offers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.order_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.settings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log FORCE ROW LEVEL SECURITY;