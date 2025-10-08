-- Add fields to sale_deliveries for assembly and responsible person
ALTER TABLE sale_deliveries
ADD COLUMN requires_assembly BOOLEAN DEFAULT false,
ADD COLUMN delivery_employee_id UUID REFERENCES employees(id),
ADD COLUMN delivery_commission_amount NUMERIC DEFAULT 0;

-- Create assemblies table for product assemblies
CREATE TABLE assemblies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  sale_delivery_id UUID REFERENCES sale_deliveries(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR NOT NULL,
  assembly_employee_id UUID REFERENCES employees(id),
  status VARCHAR NOT NULL DEFAULT 'pending',
  is_showcase BOOLEAN DEFAULT false,
  scheduled_date DATE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  assembly_commission_amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on assemblies
ALTER TABLE assemblies ENABLE ROW LEVEL SECURITY;

-- RLS policies for assemblies
CREATE POLICY "Allow authenticated read assemblies"
ON assemblies FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'salesperson')
);

CREATE POLICY "Allow authenticated insert assemblies"
ON assemblies FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'salesperson')
);

CREATE POLICY "Allow authenticated update assemblies"
ON assemblies FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'salesperson')
);

CREATE POLICY "Allow authenticated delete assemblies"
ON assemblies FOR DELETE
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager')
);

-- Add trigger for updated_at on assemblies
CREATE TRIGGER update_assemblies_updated_at
BEFORE UPDATE ON assemblies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();