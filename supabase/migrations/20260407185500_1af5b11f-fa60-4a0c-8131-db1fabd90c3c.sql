
CREATE TABLE public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view hospitals
CREATE POLICY "Anyone can view hospitals"
ON public.hospitals FOR SELECT
TO authenticated
USING (true);

-- Admins can manage hospitals
CREATE POLICY "Admins can insert hospitals"
ON public.hospitals FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update hospitals"
ON public.hospitals FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete hospitals"
ON public.hospitals FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Seed default hospitals
INSERT INTO public.hospitals (name, short_name) VALUES
  ('Hospital de Clínicas', 'HC'),
  ('Hospital Municipal', 'HM'),
  ('Hospital de Atendimento', 'HA'),
  ('Hospital Universitário', 'HU'),
  ('Rede de Saúde', 'REDE');

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_hospitals_updated_at
BEFORE UPDATE ON public.hospitals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
