------- انشاء التريجرات والفنكشنز ------

-- إنشاء التريجرات والفنكشنز في قاعدة البيانات
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