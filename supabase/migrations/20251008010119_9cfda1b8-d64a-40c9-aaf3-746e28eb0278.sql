-- Create positions table (cargos)
CREATE TABLE public.positions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name character varying NOT NULL,
  code character varying UNIQUE,
  description text,
  has_sales_commission boolean DEFAULT false,
  has_assembly_commission boolean DEFAULT false,
  has_delivery_commission boolean DEFAULT false,
  has_revenue_commission boolean DEFAULT false,
  revenue_commission_rate numeric DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create employee_positions table (relação many-to-many entre employees e positions)
CREATE TABLE public.employee_positions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  position_id uuid NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  started_at date DEFAULT CURRENT_DATE,
  ended_at date,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(employee_id, position_id)
);

-- Create commission_rules table (regras de comissão por cargo e categoria)
CREATE TABLE public.commission_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position_id uuid NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  commission_type character varying NOT NULL CHECK (commission_type IN ('sales', 'assembly', 'delivery')),
  rate numeric NOT NULL DEFAULT 0 CHECK (rate >= 0 AND rate <= 100),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(position_id, category_id, commission_type)
);

-- Enable RLS
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;

-- Policies for positions
CREATE POLICY "Allow authenticated read positions" ON public.positions FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert positions" ON public.positions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update positions" ON public.positions FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated delete positions" ON public.positions FOR DELETE USING (true);

-- Policies for employee_positions
CREATE POLICY "Allow authenticated read employee_positions" ON public.employee_positions FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert employee_positions" ON public.employee_positions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update employee_positions" ON public.employee_positions FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated delete employee_positions" ON public.employee_positions FOR DELETE USING (true);

-- Policies for commission_rules
CREATE POLICY "Allow authenticated read commission_rules" ON public.commission_rules FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert commission_rules" ON public.commission_rules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update commission_rules" ON public.commission_rules FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated delete commission_rules" ON public.commission_rules FOR DELETE USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_commission_rules_updated_at BEFORE UPDATE ON public.commission_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default positions
INSERT INTO public.positions (name, code, description, has_sales_commission, has_assembly_commission, has_delivery_commission, has_revenue_commission) VALUES
('Vendedor', 'VEND', 'Vendedor de produtos', true, false, false, false),
('Montador', 'MONT', 'Montador de móveis', false, true, false, false),
('Entregador', 'ENTR', 'Entregador', false, false, true, false),
('Gerente', 'GER', 'Gerente geral', true, false, false, true),
('Financeiro', 'FIN', 'Responsável financeiro', false, false, false, false),
('Auxiliar', 'AUX', 'Auxiliar geral', false, false, false, false);