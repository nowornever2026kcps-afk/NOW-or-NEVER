/* ============================================================
   NOW-or-NEVER — ADMIN MARKETPLACE RPCs
   ------------------------------------------------------------
   Run this in Supabase SQL Editor once.
   All write operations verify public.is_admin() server-side.
   ============================================================ */

CREATE OR REPLACE FUNCTION public.admin_marketplace_list()
RETURNS TABLE (
  item_id text,
  category text,
  item_name text,
  description text,
  price numeric,
  kind text,
  preview text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  RETURN QUERY
  SELECT
    s.item_id::text,
    s.category::text,
    s.item_name::text,
    s.description::text,
    s.price::numeric,
    s.kind::text,
    s.preview::text,
    s.created_at::timestamptz
  FROM public.shop_catalog AS s
  ORDER BY s.created_at DESC NULLS LAST, s.item_name ASC;
END;
$function$;


CREATE OR REPLACE FUNCTION public.admin_marketplace_create(
  p_item_id text,
  p_category text,
  p_item_name text,
  p_description text,
  p_price numeric,
  p_kind text,
  p_preview text
)
RETURNS public.shop_catalog
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_item public.shop_catalog;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  IF NULLIF(trim(p_item_id), '') IS NULL THEN
    RAISE EXCEPTION 'Item ID is required';
  END IF;

  IF NULLIF(trim(p_item_name), '') IS NULL THEN
    RAISE EXCEPTION 'Item name is required';
  END IF;

  IF p_price IS NULL OR p_price < 0 THEN
    RAISE EXCEPTION 'Price must be zero or greater';
  END IF;

  IF EXISTS (SELECT 1 FROM public.shop_catalog WHERE item_id = trim(p_item_id)) THEN
    RAISE EXCEPTION 'An item with this ID already exists';
  END IF;

  INSERT INTO public.shop_catalog (
    item_id, category, item_name, description, price, kind, preview
  ) VALUES (
    trim(p_item_id), trim(p_category), trim(p_item_name), trim(p_description),
    p_price, trim(p_kind), COALESCE(NULLIF(trim(p_preview), ''), '🎁')
  )
  RETURNING * INTO v_item;

  RETURN v_item;
END;
$function$;


CREATE OR REPLACE FUNCTION public.admin_marketplace_update(
  p_original_item_id text,
  p_item_id text,
  p_category text,
  p_item_name text,
  p_description text,
  p_price numeric,
  p_kind text,
  p_preview text
)
RETURNS public.shop_catalog
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_item public.shop_catalog;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  IF NULLIF(trim(p_original_item_id), '') IS NULL OR NULLIF(trim(p_item_id), '') IS NULL THEN
    RAISE EXCEPTION 'Item ID is required';
  END IF;

  IF NULLIF(trim(p_item_name), '') IS NULL THEN
    RAISE EXCEPTION 'Item name is required';
  END IF;

  IF p_price IS NULL OR p_price < 0 THEN
    RAISE EXCEPTION 'Price must be zero or greater';
  END IF;

  IF trim(p_original_item_id) <> trim(p_item_id)
     AND EXISTS (SELECT 1 FROM public.shop_catalog WHERE item_id = trim(p_item_id)) THEN
    RAISE EXCEPTION 'The new item ID is already in use';
  END IF;

  UPDATE public.shop_catalog
  SET
    item_id = trim(p_item_id),
    category = trim(p_category),
    item_name = trim(p_item_name),
    description = trim(p_description),
    price = p_price,
    kind = trim(p_kind),
    preview = COALESCE(NULLIF(trim(p_preview), ''), '🎁')
  WHERE item_id = trim(p_original_item_id)
  RETURNING * INTO v_item;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Marketplace item not found';
  END IF;

  RETURN v_item;
END;
$function$;


CREATE OR REPLACE FUNCTION public.admin_marketplace_delete(p_item_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.shop_catalog WHERE item_id = trim(p_item_id)) THEN
    RAISE EXCEPTION 'Marketplace item not found';
  END IF;

  DELETE FROM public.shop_catalog
  WHERE item_id = trim(p_item_id);

  RETURN true;
END;
$function$;


REVOKE ALL ON FUNCTION public.admin_marketplace_list() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_marketplace_create(text,text,text,text,numeric,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_marketplace_update(text,text,text,text,text,numeric,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_marketplace_delete(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_marketplace_list() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_marketplace_create(text,text,text,text,numeric,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_marketplace_update(text,text,text,text,text,numeric,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_marketplace_delete(text) TO authenticated;

/* ============================================================
   IMPORTANT
   ------------------------------------------------------------
   The student-facing shop currently contains a catalogue in
   index.html. These admin RPCs manage shop_catalog safely.
   The next marketplace step should make the student shop load
   its catalogue from shop_catalog so newly-created items appear
   automatically without editing index.html.
   ============================================================ */
