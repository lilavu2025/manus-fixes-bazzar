-- جدول معلومات الاتصال للموقع
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

-- إدخال بيانات افتراضية (يمكن تعديلها لاحقاً من لوحة التحكم)
insert into public.contact_info (email, phone, address, facebook, instagram, whatsapp, working_hours, fields_order)
values ('info@example.com', '+970000000000', 'العنوان هنا', '', '', '', 'من 9 صباحاً حتى 5 مساءً', '["email","phone","address","working_hours","facebook","instagram","whatsapp"]')
on conflict do nothing;
