CREATE TABLE public.service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE CASCADE NOT NULL,
  year integer NOT NULL DEFAULT 2026,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  service_type text NOT NULL DEFAULT 'corretiva',
  os_abertas integer NOT NULL DEFAULT 0,
  os_finalizadas integer NOT NULL DEFAULT 0,
  meta numeric NOT NULL DEFAULT 90,
  acum_critico integer NOT NULL DEFAULT 0,
  acum_geral integer NOT NULL DEFAULT 0,
  analise_critica text DEFAULT '—',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hospital_id, year, month, service_type)
);

ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view service_orders"
  ON public.service_orders FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Public can view service_orders"
  ON public.service_orders FOR SELECT TO anon
  USING (true);

CREATE POLICY "Admins can insert service_orders"
  ON public.service_orders FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update service_orders"
  ON public.service_orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete service_orders"
  ON public.service_orders FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_service_orders_updated_at
  BEFORE UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();