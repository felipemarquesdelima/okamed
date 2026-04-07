
CREATE POLICY "Public can view hospitals"
ON public.hospitals FOR SELECT
TO anon
USING (true);
