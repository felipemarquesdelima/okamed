
-- Drop and recreate UPDATE policy with WITH CHECK
DROP POLICY IF EXISTS "Controladores can update their hospital orders" ON public.service_orders;

CREATE POLICY "Controladores can update their hospital orders"
  ON public.service_orders FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'controlador') 
    AND public.is_assigned_to_hospital(auth.uid(), hospital_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'controlador') 
    AND public.is_assigned_to_hospital(auth.uid(), hospital_id)
  );
