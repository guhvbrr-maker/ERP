-- Create enum for assistance status
CREATE TYPE public.assistance_status AS ENUM (
  'pending',
  'in_progress',
  'waiting_parts',
  'completed',
  'cancelled'
);

-- Create technical_assistances table
CREATE TABLE public.technical_assistances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistance_number VARCHAR NOT NULL UNIQUE,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  customer_name VARCHAR NOT NULL,
  customer_phone VARCHAR,
  customer_email VARCHAR,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name VARCHAR NOT NULL,
  product_sku VARCHAR,
  defect_description TEXT NOT NULL,
  solution_description TEXT,
  status assistance_status NOT NULL DEFAULT 'pending',
  priority VARCHAR DEFAULT 'normal',
  assigned_to UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  opened_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  completed_date DATE,
  warranty_status BOOLEAN DEFAULT false,
  service_cost NUMERIC DEFAULT 0,
  parts_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create assistance_history table for tracking changes
CREATE TABLE public.assistance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistance_id UUID NOT NULL REFERENCES public.technical_assistances(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  change_type VARCHAR NOT NULL,
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.technical_assistances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistance_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for technical_assistances
CREATE POLICY "Allow authenticated read assistances"
ON public.technical_assistances
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role) OR
  has_role(auth.uid(), 'salesperson'::app_role)
);

CREATE POLICY "Allow authenticated insert assistances"
ON public.technical_assistances
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role) OR
  has_role(auth.uid(), 'salesperson'::app_role)
);

CREATE POLICY "Allow authenticated update assistances"
ON public.technical_assistances
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role) OR
  has_role(auth.uid(), 'salesperson'::app_role)
);

CREATE POLICY "Allow authenticated delete assistances"
ON public.technical_assistances
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role)
);

-- RLS Policies for assistance_history
CREATE POLICY "Allow authenticated read history"
ON public.assistance_history
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role) OR
  has_role(auth.uid(), 'salesperson'::app_role)
);

CREATE POLICY "Allow authenticated insert history"
ON public.assistance_history
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Function to generate assistance number
CREATE OR REPLACE FUNCTION public.generate_assistance_number()
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  assistance_number VARCHAR;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(assistance_number FROM '[0-9]+') AS INTEGER)), 0) + 1
  INTO next_number
  FROM technical_assistances
  WHERE assistance_number ~ '^AST[0-9]+$';
  
  assistance_number := 'AST' || LPAD(next_number::TEXT, 6, '0');
  RETURN assistance_number;
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_assistances_updated_at
BEFORE UPDATE ON public.technical_assistances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to log status changes
CREATE OR REPLACE FUNCTION public.log_assistance_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO assistance_history (assistance_id, changed_by, change_type, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'status_change', OLD.status::TEXT, NEW.status::TEXT);
  END IF;
  
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO assistance_history (assistance_id, changed_by, change_type, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'assigned_to_change', OLD.assigned_to::TEXT, NEW.assigned_to::TEXT);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_assistance_changes
AFTER UPDATE ON public.technical_assistances
FOR EACH ROW
EXECUTE FUNCTION public.log_assistance_change();