CREATE TABLE public.site_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  goal_percent numeric NOT NULL DEFAULT 90 CHECK (goal_percent >= 0 AND goal_percent <= 100),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can update site settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

INSERT INTO public.site_settings (id, goal_percent) VALUES (true, 90);

CREATE OR REPLACE FUNCTION public.apply_global_goal_to_service_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT goal_percent INTO NEW.meta
  FROM public.site_settings
  WHERE id = true;
  RETURN NEW;
END;
$$;

CREATE TRIGGER apply_global_goal_to_service_orders
BEFORE INSERT OR UPDATE ON public.service_orders
FOR EACH ROW
EXECUTE FUNCTION public.apply_global_goal_to_service_order();

CREATE OR REPLACE FUNCTION public.sync_global_goal_to_service_orders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.service_orders
  SET meta = NEW.goal_percent
  WHERE meta IS DISTINCT FROM NEW.goal_percent;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_global_goal_to_service_orders
AFTER UPDATE OF goal_percent ON public.site_settings
FOR EACH ROW
WHEN (OLD.goal_percent IS DISTINCT FROM NEW.goal_percent)
EXECUTE FUNCTION public.sync_global_goal_to_service_orders();

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

UPDATE public.service_orders SET meta = 90 WHERE meta IS DISTINCT FROM 90;