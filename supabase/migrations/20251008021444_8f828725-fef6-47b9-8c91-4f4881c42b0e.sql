-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'salesperson', 'accountant', 'warehouse');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update people table RLS policies with role-based access
DROP POLICY IF EXISTS "Allow authenticated read people" ON public.people;
DROP POLICY IF EXISTS "Allow authenticated insert people" ON public.people;
DROP POLICY IF EXISTS "Allow authenticated update people" ON public.people;
DROP POLICY IF EXISTS "Allow authenticated delete people" ON public.people;

CREATE POLICY "Role-based read people"
ON public.people
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager') OR
  (type = 'customer' AND public.has_role(auth.uid(), 'salesperson')) OR
  (type = 'supplier' AND public.has_role(auth.uid(), 'accountant'))
);

CREATE POLICY "Role-based insert people"
ON public.people
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager') OR
  (type = 'customer' AND public.has_role(auth.uid(), 'salesperson'))
);

CREATE POLICY "Role-based update people"
ON public.people
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager') OR
  (created_by = auth.uid() AND type = 'customer' AND public.has_role(auth.uid(), 'salesperson'))
);

CREATE POLICY "Role-based delete people"
ON public.people
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager')
);

-- Update employees table RLS policies
DROP POLICY IF EXISTS "Allow authenticated read employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated insert employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated update employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated delete employees" ON public.employees;

CREATE POLICY "Role-based read employees"
ON public.employees
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Role-based insert employees"
ON public.employees
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Role-based update employees"
ON public.employees
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Role-based delete employees"
ON public.employees
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager')
);

-- Update sales table RLS policies
DROP POLICY IF EXISTS "Allow authenticated read sales" ON public.sales;
DROP POLICY IF EXISTS "Allow authenticated insert sales" ON public.sales;
DROP POLICY IF EXISTS "Allow authenticated update sales" ON public.sales;
DROP POLICY IF EXISTS "Allow authenticated delete sales" ON public.sales;

CREATE POLICY "Role-based read sales"
ON public.sales
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager') OR
  public.has_role(auth.uid(), 'accountant') OR
  (created_by = auth.uid() AND public.has_role(auth.uid(), 'salesperson'))
);

CREATE POLICY "Role-based insert sales"
ON public.sales
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager') OR
  public.has_role(auth.uid(), 'salesperson')
);

CREATE POLICY "Role-based update sales"
ON public.sales
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager') OR
  (created_by = auth.uid() AND public.has_role(auth.uid(), 'salesperson'))
);

CREATE POLICY "Role-based delete sales"
ON public.sales
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager')
);

-- Update sale_payments table RLS policies
DROP POLICY IF EXISTS "Allow authenticated read sale_payments" ON public.sale_payments;
DROP POLICY IF EXISTS "Allow authenticated insert sale_payments" ON public.sale_payments;
DROP POLICY IF EXISTS "Allow authenticated update sale_payments" ON public.sale_payments;
DROP POLICY IF EXISTS "Allow authenticated delete sale_payments" ON public.sale_payments;

CREATE POLICY "Role-based read sale_payments"
ON public.sale_payments
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager') OR
  public.has_role(auth.uid(), 'accountant')
);

CREATE POLICY "Role-based insert sale_payments"
ON public.sale_payments
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager') OR
  public.has_role(auth.uid(), 'accountant')
);

CREATE POLICY "Role-based update sale_payments"
ON public.sale_payments
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager') OR
  public.has_role(auth.uid(), 'accountant')
);

CREATE POLICY "Role-based delete sale_payments"
ON public.sale_payments
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager')
);

-- Update suppliers table RLS policies
DROP POLICY IF EXISTS "Allow authenticated read suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Allow authenticated insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Allow authenticated update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Allow authenticated delete suppliers" ON public.suppliers;

CREATE POLICY "Role-based read suppliers"
ON public.suppliers
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager') OR
  public.has_role(auth.uid(), 'accountant')
);

CREATE POLICY "Role-based insert suppliers"
ON public.suppliers
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Role-based update suppliers"
ON public.suppliers
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Role-based delete suppliers"
ON public.suppliers
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager')
);

-- Update positions table RLS policies
DROP POLICY IF EXISTS "Allow authenticated read positions" ON public.positions;
DROP POLICY IF EXISTS "Allow authenticated insert positions" ON public.positions;
DROP POLICY IF EXISTS "Allow authenticated update positions" ON public.positions;
DROP POLICY IF EXISTS "Allow authenticated delete positions" ON public.positions;

CREATE POLICY "Role-based read positions"
ON public.positions
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Role-based insert positions"
ON public.positions
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Role-based update positions"
ON public.positions
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Role-based delete positions"
ON public.positions
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager')
);

-- Leave read-only tables with authenticated access (categories, products, etc.)
-- These are typically needed by all authenticated users