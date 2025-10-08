-- Create purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_number VARCHAR NOT NULL UNIQUE,
  supplier_id UUID REFERENCES public.people(id) ON DELETE RESTRICT NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  status VARCHAR NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled')),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  shipping_cost NUMERIC DEFAULT 0,
  other_costs NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  payment_terms TEXT,
  access_token VARCHAR UNIQUE,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create purchase_items table
CREATE TABLE IF NOT EXISTS public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
  product_name VARCHAR NOT NULL,
  product_sku VARCHAR NOT NULL,
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  received_quantity NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create purchase_suggestions table
CREATE TABLE IF NOT EXISTS public.purchase_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  suggested_quantity NUMERIC NOT NULL,
  reason TEXT,
  priority VARCHAR DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ordered', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON public.purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON public.purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON public.purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product ON public.purchase_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_suggestions_product ON public.purchase_suggestions(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_suggestions_status ON public.purchase_suggestions(status);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for purchases
CREATE POLICY "Allow authenticated read purchases"
ON public.purchases FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'accountant')
);

CREATE POLICY "Allow public read with token"
ON public.purchases FOR SELECT
TO anon
USING (
  access_token IS NOT NULL AND 
  token_expires_at > now()
);

CREATE POLICY "Allow authenticated insert purchases"
ON public.purchases FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager')
);

CREATE POLICY "Allow authenticated update purchases"
ON public.purchases FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager')
);

CREATE POLICY "Allow authenticated delete purchases"
ON public.purchases FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager')
);

-- RLS Policies for purchase_items
CREATE POLICY "Allow authenticated read purchase_items"
ON public.purchase_items FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'accountant')
);

CREATE POLICY "Allow public read purchase_items with token"
ON public.purchase_items FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.purchases 
    WHERE purchases.id = purchase_items.purchase_id 
    AND purchases.access_token IS NOT NULL 
    AND purchases.token_expires_at > now()
  )
);

CREATE POLICY "Allow authenticated manage purchase_items"
ON public.purchase_items FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager')
);

-- RLS Policies for purchase_suggestions
CREATE POLICY "Allow authenticated manage suggestions"
ON public.purchase_suggestions FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager')
);

-- Create function to generate purchase number
CREATE OR REPLACE FUNCTION public.generate_purchase_number()
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  purchase_number VARCHAR;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(purchase_number FROM '[0-9]+') AS INTEGER)), 0) + 1
  INTO next_number
  FROM purchases
  WHERE purchase_number ~ '^CMP[0-9]+$';
  
  purchase_number := 'CMP' || LPAD(next_number::TEXT, 6, '0');
  RETURN purchase_number;
END;
$$;

-- Create function to generate access token
CREATE OR REPLACE FUNCTION public.generate_purchase_access_token()
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Create function to calculate purchase suggestions
CREATE OR REPLACE FUNCTION public.calculate_purchase_suggestions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  product_record RECORD;
  avg_monthly_sales NUMERIC;
  current_stock NUMERIC;
  suggested_qty NUMERIC;
  days_of_stock NUMERIC;
BEGIN
  -- Clear old pending suggestions
  DELETE FROM purchase_suggestions WHERE status = 'pending';
  
  -- Calculate suggestions for each product
  FOR product_record IN 
    SELECT 
      p.id,
      p.name,
      p.sku,
      COALESCE(s.quantity, 0) as stock_quantity,
      COALESCE(s.min_quantity, 0) as min_quantity,
      p.lead_time_days
    FROM products p
    LEFT JOIN stocks s ON s.product_id = p.id
    WHERE p.active = true
  LOOP
    -- Calculate average monthly sales from last 3 months
    SELECT COALESCE(AVG(monthly_qty), 0) INTO avg_monthly_sales
    FROM (
      SELECT 
        DATE_TRUNC('month', s.sale_date) as month,
        SUM(si.quantity) as monthly_qty
      FROM sales s
      JOIN sale_items si ON si.sale_id = s.id
      WHERE si.product_id = product_record.id
        AND s.sale_date >= CURRENT_DATE - INTERVAL '3 months'
        AND s.status != 'cancelled'
      GROUP BY DATE_TRUNC('month', s.sale_date)
    ) monthly_sales;
    
    current_stock := product_record.stock_quantity;
    
    -- Calculate days of stock remaining
    IF avg_monthly_sales > 0 THEN
      days_of_stock := (current_stock / (avg_monthly_sales / 30));
    ELSE
      days_of_stock := 999; -- No recent sales
    END IF;
    
    -- Determine if suggestion is needed
    IF current_stock <= product_record.min_quantity THEN
      -- Stock below minimum
      suggested_qty := GREATEST(avg_monthly_sales * 2, product_record.min_quantity * 2);
      
      INSERT INTO purchase_suggestions (product_id, suggested_quantity, reason, priority)
      VALUES (
        product_record.id,
        suggested_qty,
        format('Estoque abaixo do mínimo. Atual: %s, Mínimo: %s', current_stock, product_record.min_quantity),
        'urgent'
      );
      
    ELSIF days_of_stock < product_record.lead_time_days THEN
      -- Stock will run out before next delivery
      suggested_qty := avg_monthly_sales * 2;
      
      INSERT INTO purchase_suggestions (product_id, suggested_quantity, reason, priority)
      VALUES (
        product_record.id,
        suggested_qty,
        format('Estoque insuficiente para cobrir tempo de entrega. Dias de estoque: %s, Prazo: %s dias', 
               ROUND(days_of_stock), product_record.lead_time_days),
        'high'
      );
      
    ELSIF days_of_stock < 30 AND avg_monthly_sales > 0 THEN
      -- Stock running low
      suggested_qty := avg_monthly_sales * 1.5;
      
      INSERT INTO purchase_suggestions (product_id, suggested_quantity, reason, priority)
      VALUES (
        product_record.id,
        suggested_qty,
        format('Estoque baixo. Dias de estoque restantes: %s', ROUND(days_of_stock)),
        'normal'
      );
    END IF;
  END LOOP;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_purchases_updated_at
BEFORE UPDATE ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_suggestions_updated_at
BEFORE UPDATE ON public.purchase_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();