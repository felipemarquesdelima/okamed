
-- Create profiles table for user display info
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  full_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create user_hospital_assignments table
CREATE TABLE IF NOT EXISTS public.user_hospital_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, hospital_id)
);

ALTER TABLE public.user_hospital_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage assignments" ON public.user_hospital_assignments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read own assignments" ON public.user_hospital_assignments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Function to check if user is assigned to a hospital
CREATE OR REPLACE FUNCTION public.is_assigned_to_hospital(_user_id uuid, _hospital_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_hospital_assignments
    WHERE user_id = _user_id AND hospital_id = _hospital_id
  )
$$;

-- Update service_orders policies to allow controladores to manage their hospital's data
CREATE POLICY "Controladores can insert their hospital orders"
  ON public.service_orders FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'controlador') 
    AND public.is_assigned_to_hospital(auth.uid(), hospital_id)
  );

CREATE POLICY "Controladores can update their hospital orders"
  ON public.service_orders FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'controlador') 
    AND public.is_assigned_to_hospital(auth.uid(), hospital_id)
  );

CREATE POLICY "Controladores can delete their hospital orders"
  ON public.service_orders FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'controlador') 
    AND public.is_assigned_to_hospital(auth.uid(), hospital_id)
  );

CREATE POLICY "Controladores can update their hospital"
  ON public.hospitals FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'controlador') 
    AND public.is_assigned_to_hospital(auth.uid(), id)
  );
