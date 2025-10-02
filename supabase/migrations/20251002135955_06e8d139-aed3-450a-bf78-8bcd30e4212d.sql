-- Create sales table
CREATE TABLE public.sales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_number character varying NOT NULL UNIQUE,
  customer_name character varying NOT NULL,
  customer_document character varying,
  customer_email character varying,
  customer_phone character varying,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  status character varying NOT NULL DEFAULT 'pending',
  payment_status character varying NOT NULL DEFAULT 'pending',
  delivery_status character varying NOT NULL DEFAULT 'pending',
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid
);

-- Create sale_items table
CREATE TABLE public.sale_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  product_name character varying NOT NULL,
  product_sku character varying NOT NULL,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  discount numeric DEFAULT 0,
  total numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create sale_payments table
CREATE TABLE public.sale_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  payment_date date NOT NULL,
  due_date date NOT NULL,
  amount numeric NOT NULL,
  payment_method character varying NOT NULL,
  status character varying NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create sale_deliveries table
CREATE TABLE public.sale_deliveries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  delivery_date date,
  scheduled_date date NOT NULL,
  address text NOT NULL,
  city character varying,
  state character varying,
  zipcode character varying,
  status character varying NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales
CREATE POLICY "Allow authenticated read sales" 
ON public.sales FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert sales" 
ON public.sales FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update sales" 
ON public.sales FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete sales" 
ON public.sales FOR DELETE USING (true);

-- RLS Policies for sale_items
CREATE POLICY "Allow authenticated read sale_items" 
ON public.sale_items FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert sale_items" 
ON public.sale_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update sale_items" 
ON public.sale_items FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete sale_items" 
ON public.sale_items FOR DELETE USING (true);

-- RLS Policies for sale_payments
CREATE POLICY "Allow authenticated read sale_payments" 
ON public.sale_payments FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert sale_payments" 
ON public.sale_payments FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update sale_payments" 
ON public.sale_payments FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete sale_payments" 
ON public.sale_payments FOR DELETE USING (true);

-- RLS Policies for sale_deliveries
CREATE POLICY "Allow authenticated read sale_deliveries" 
ON public.sale_deliveries FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert sale_deliveries" 
ON public.sale_deliveries FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update sale_deliveries" 
ON public.sale_deliveries FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete sale_deliveries" 
ON public.sale_deliveries FOR DELETE USING (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_sales_updated_at
BEFORE UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sale_payments_updated_at
BEFORE UPDATE ON public.sale_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sale_deliveries_updated_at
BEFORE UPDATE ON public.sale_deliveries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate sale number
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS character varying
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number integer;
  sale_number character varying;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(sale_number FROM '[0-9]+') AS integer)), 0) + 1
  INTO next_number
  FROM sales
  WHERE sale_number ~ '^VND[0-9]+$';
  
  sale_number := 'VND' || LPAD(next_number::text, 6, '0');
  RETURN sale_number;
END;
$$;

-- Insert default sale number setting
INSERT INTO public.settings (key, value, description)
VALUES 
  ('sale_number_auto', '{"enabled": true, "prefix": "VND", "start_number": 1, "current_number": 1}'::jsonb, 'Configuração de numeração automática de vendas');
