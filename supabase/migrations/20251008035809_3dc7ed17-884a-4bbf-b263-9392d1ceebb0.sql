-- Fix security issue: Add search_path to function
CREATE OR REPLACE FUNCTION public.generate_purchase_access_token()
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;