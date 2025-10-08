-- Create enum for person types
CREATE TYPE public.person_type AS ENUM ('customer', 'employee', 'supplier');

-- Create enum for contact sources (origem do cliente)
CREATE TYPE public.contact_source AS ENUM (
  'instagram',
  'facebook',
  'fachada',
  'radio',
  'outdoor',
  'google',
  'youtube',
  'indicacao',
  'whatsapp',
  'website',
  'outros'
);

-- Create people table (base table for all person types)
CREATE TABLE public.people (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type public.person_type NOT NULL,
  name character varying NOT NULL,
  document character varying,
  email character varying,
  phone character varying,
  phone_secondary character varying,
  
  -- Address fields
  zipcode character varying,
  address character varying,
  address_number character varying,
  address_complement character varying,
  neighborhood character varying,
  city character varying,
  state character varying(2),
  
  -- Additional info
  contact_source public.contact_source,
  notes text,
  active boolean DEFAULT true,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid
);

-- Create customers table (extends people for customer-specific data)
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE UNIQUE,
  birth_date date,
  customer_since date DEFAULT CURRENT_DATE,
  preferred_contact character varying,
  credit_limit numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create employees table (extends people for employee-specific data)
CREATE TABLE public.employees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE UNIQUE,
  hire_date date DEFAULT CURRENT_DATE,
  position character varying,
  department character varying,
  salary numeric,
  commission_rate numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create suppliers table (extends people for supplier-specific data)
CREATE TABLE public.suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE UNIQUE,
  company_name character varying,
  trade_name character varying,
  payment_terms character varying,
  delivery_time_days integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for people
CREATE POLICY "Allow authenticated read people"
  ON public.people FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert people"
  ON public.people FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update people"
  ON public.people FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete people"
  ON public.people FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for customers
CREATE POLICY "Allow authenticated read customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert customers"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update customers"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete customers"
  ON public.customers FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for employees
CREATE POLICY "Allow authenticated read employees"
  ON public.employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert employees"
  ON public.employees FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update employees"
  ON public.employees FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete employees"
  ON public.employees FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for suppliers
CREATE POLICY "Allow authenticated read suppliers"
  ON public.suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert suppliers"
  ON public.suppliers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update suppliers"
  ON public.suppliers FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete suppliers"
  ON public.suppliers FOR DELETE
  TO authenticated
  USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_people_updated_at
  BEFORE UPDATE ON public.people
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();