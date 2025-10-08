-- ============================================================================
-- ENHANCEMENTS FOR COMPLETE FURNITURE STORE ERP
-- Production Orders, SLA Tracking, Sales Commissions, and Advanced Features
-- ============================================================================

-- 1. PRODUCTION ORDERS / MANUFACTURING ORDERS
CREATE TABLE IF NOT EXISTS public.production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR NOT NULL UNIQUE,
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name VARCHAR NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  
  -- Status
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Aguardando início
    'in_progress',  -- Em produção
    'paused',       -- Pausado
    'quality_check', -- Em controle de qualidade
    'completed',    -- Concluído
    'cancelled'     -- Cancelado
  )),
  
  -- Dates
  scheduled_start_date DATE,
  actual_start_date DATE,
  scheduled_end_date DATE,
  actual_end_date DATE,
  
  -- Resources
  warehouse_id UUID REFERENCES public.warehouses(id),
  supervisor_employee_id UUID REFERENCES public.employees(id),
  assigned_to_employee_id UUID REFERENCES public.employees(id),
  
  -- Details
  priority VARCHAR DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  notes TEXT,
  production_cost NUMERIC(15,2) DEFAULT 0,
  
  -- Bill of Materials (BOM) - list of required materials/components
  bom_items JSONB, -- [{product_id, quantity, allocated}]
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_production_orders_sale ON public.production_orders(sale_id);
CREATE INDEX idx_production_orders_status ON public.production_orders(status);
CREATE INDEX idx_production_orders_product ON public.production_orders(product_id);
CREATE INDEX idx_production_orders_dates ON public.production_orders(scheduled_start_date, scheduled_end_date);

-- 2. PRODUCTION ORDER PROGRESS TRACKING
CREATE TABLE IF NOT EXISTS public.production_order_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id UUID REFERENCES public.production_orders(id) ON DELETE CASCADE NOT NULL,
  
  stage VARCHAR NOT NULL, -- cutting, assembly, finishing, quality_control, etc.
  stage_description TEXT,
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  
  completed_quantity INTEGER DEFAULT 0,
  rejected_quantity INTEGER DEFAULT 0,
  
  employee_id UUID REFERENCES public.employees(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_production_progress_order ON public.production_order_progress(production_order_id);

-- 3. SLA (SERVICE LEVEL AGREEMENT) CONFIGURATIONS
CREATE TABLE IF NOT EXISTS public.sla_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type of service
  service_type VARCHAR NOT NULL CHECK (service_type IN (
    'assistance',    -- Technical assistance
    'delivery',      -- Delivery service
    'assembly',      -- Assembly/installation
    'production'     -- Production/manufacturing
  )),
  
  -- Priority-based SLA
  priority VARCHAR NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Time limits (in hours)
  response_time_hours INTEGER NOT NULL, -- Time to first response
  resolution_time_hours INTEGER NOT NULL, -- Time to complete
  
  -- Business hours
  business_hours_only BOOLEAN DEFAULT true,
  
  -- Active
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(service_type, priority)
);

-- Insert default SLA configurations
INSERT INTO public.sla_configurations (service_type, priority, response_time_hours, resolution_time_hours) VALUES
-- Assistances
('assistance', 'urgent', 2, 24),
('assistance', 'high', 4, 48),
('assistance', 'normal', 8, 120),
('assistance', 'low', 24, 240),
-- Deliveries
('delivery', 'urgent', 4, 24),
('delivery', 'high', 8, 72),
('delivery', 'normal', 24, 168),
('delivery', 'low', 48, 336),
-- Assemblies
('assembly', 'urgent', 4, 48),
('assembly', 'high', 8, 72),
('assembly', 'normal', 24, 168),
('assembly', 'low', 48, 336),
-- Production
('production', 'urgent', 8, 72),
('production', 'high', 24, 168),
('production', 'normal', 48, 336),
('production', 'low', 96, 720)
ON CONFLICT (service_type, priority) DO NOTHING;

-- 4. SLA TRACKING - Add to existing assistance/delivery tables
ALTER TABLE public.assistances ADD COLUMN IF NOT EXISTS sla_response_due TIMESTAMPTZ;
ALTER TABLE public.assistances ADD COLUMN IF NOT EXISTS sla_resolution_due TIMESTAMPTZ;
ALTER TABLE public.assistances ADD COLUMN IF NOT EXISTS sla_status VARCHAR DEFAULT 'on_time' CHECK (sla_status IN ('on_time', 'at_risk', 'breached'));
ALTER TABLE public.assistances ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ;

-- 5. SALES COMMISSIONS
CREATE TABLE IF NOT EXISTS public.commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR NOT NULL,
  description TEXT,
  
  -- Commission type
  calculation_type VARCHAR NOT NULL CHECK (calculation_type IN (
    'percentage',     -- % of sale value
    'fixed',          -- Fixed amount per sale
    'tiered'          -- Different % based on volume
  )),
  
  -- Base calculation
  base_on VARCHAR DEFAULT 'total' CHECK (base_on IN (
    'total',          -- Total sale value
    'profit',         -- Profit margin
    'items'           -- Number of items
  )),
  
  -- Values
  commission_rate NUMERIC(5,2), -- Percentage (e.g., 5.00 for 5%)
  fixed_amount NUMERIC(15,2),   -- Fixed amount
  
  -- Tiers for tiered commission (JSONB array)
  -- [{min_value: 0, max_value: 10000, rate: 3}, {min_value: 10001, max_value: null, rate: 5}]
  tiers JSONB,
  
  -- Applicability
  applies_to_all_employees BOOLEAN DEFAULT true,
  specific_employees UUID[], -- Array of employee IDs
  applies_to_categories UUID[], -- Array of category IDs
  
  -- Status
  active BOOLEAN DEFAULT true,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. COMMISSION RECORDS
CREATE TABLE IF NOT EXISTS public.sales_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE RESTRICT NOT NULL,
  commission_rule_id UUID REFERENCES public.commission_rules(id),
  
  -- Calculation
  sale_total NUMERIC(15,2) NOT NULL,
  commission_rate NUMERIC(5,2),
  commission_amount NUMERIC(15,2) NOT NULL,
  
  -- Payment status
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- Reference
  payment_batch_id UUID,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sales_commissions_employee ON public.sales_commissions(employee_id);
CREATE INDEX idx_sales_commissions_sale ON public.sales_commissions(sale_id);
CREATE INDEX idx_sales_commissions_status ON public.sales_commissions(status);

-- 7. SALES TARGETS/GOALS
CREATE TABLE IF NOT EXISTS public.sales_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Period
  period_type VARCHAR NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  
  -- Target for
  target_type VARCHAR NOT NULL CHECK (target_type IN ('company', 'employee', 'category')),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  
  -- Goals
  target_revenue NUMERIC(15,2),
  target_units INTEGER,
  target_new_customers INTEGER,
  
  -- Tracking
  actual_revenue NUMERIC(15,2) DEFAULT 0,
  actual_units INTEGER DEFAULT 0,
  actual_new_customers INTEGER DEFAULT 0,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(period_start_date, period_end_date, target_type, employee_id, category_id)
);

CREATE INDEX idx_sales_targets_period ON public.sales_targets(period_start_date, period_end_date);
CREATE INDEX idx_sales_targets_employee ON public.sales_targets(employee_id);

-- 8. DELIVERY ROUTES AND OPTIMIZATION
CREATE TABLE IF NOT EXISTS public.delivery_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  route_name VARCHAR NOT NULL,
  route_date DATE NOT NULL,
  
  driver_employee_id UUID REFERENCES public.employees(id),
  vehicle_id VARCHAR, -- Could link to vehicles table if exists
  
  status VARCHAR DEFAULT 'planned' CHECK (status IN (
    'planned',
    'in_progress',
    'completed',
    'cancelled'
  )),
  
  -- Route details
  delivery_ids UUID[] NOT NULL, -- Array of delivery IDs
  optimized_order INTEGER[], -- Optimized order of deliveries
  
  -- Metrics
  estimated_distance_km NUMERIC(10,2),
  estimated_duration_minutes INTEGER,
  actual_distance_km NUMERIC(10,2),
  actual_duration_minutes INTEGER,
  
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_delivery_routes_date ON public.delivery_routes(route_date);
CREATE INDEX idx_delivery_routes_driver ON public.delivery_routes(driver_employee_id);

-- 9. PURCHASE APPROVALS WORKFLOW
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS approval_status VARCHAR DEFAULT 'not_required' 
  CHECK (approval_status IN ('not_required', 'pending', 'approved', 'rejected'));
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Approval threshold configuration
CREATE TABLE IF NOT EXISTS public.purchase_approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  min_amount NUMERIC(15,2) NOT NULL,
  max_amount NUMERIC(15,2),
  
  requires_approval BOOLEAN DEFAULT true,
  approver_role VARCHAR NOT NULL, -- 'manager', 'director', 'admin'
  
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Default rule: Purchases over R$ 5,000 require manager approval
INSERT INTO public.purchase_approval_rules (min_amount, max_amount, requires_approval, approver_role)
VALUES (5000, 20000, true, 'manager'),
       (20000, NULL, true, 'admin')
ON CONFLICT DO NOTHING;

-- 10. CUSTOMER SATISFACTION / FEEDBACK
CREATE TABLE IF NOT EXISTS public.customer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Related to
  feedback_type VARCHAR NOT NULL CHECK (feedback_type IN ('sale', 'assistance', 'delivery', 'product', 'general')),
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  assistance_id UUID REFERENCES public.assistances(id) ON DELETE SET NULL,
  
  -- Customer info
  customer_name VARCHAR,
  customer_email VARCHAR,
  customer_phone VARCHAR,
  
  -- Rating (1-5 stars)
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  
  -- Feedback
  title VARCHAR,
  comments TEXT,
  
  -- Follow-up
  requires_followup BOOLEAN DEFAULT false,
  followed_up_at TIMESTAMPTZ,
  followed_up_by UUID REFERENCES auth.users(id),
  followup_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_customer_feedback_type ON public.customer_feedback(feedback_type);
CREATE INDEX idx_customer_feedback_rating ON public.customer_feedback(rating);
CREATE INDEX idx_customer_feedback_sale ON public.customer_feedback(sale_id);

-- 11. TRIGGERS FOR AUTOMATIC COMMISSION CALCULATION
CREATE OR REPLACE FUNCTION public.calculate_sales_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule RECORD;
  v_commission_amount NUMERIC;
  v_base_amount NUMERIC;
BEGIN
  -- Only calculate commission when sale is completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Find applicable commission rule
    SELECT * INTO v_rule
    FROM commission_rules
    WHERE active = true
      AND (effective_from IS NULL OR effective_from <= CURRENT_DATE)
      AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
      AND (applies_to_all_employees = true OR NEW.employee_id = ANY(specific_employees))
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF FOUND THEN
      -- Calculate base amount
      v_base_amount := NEW.total;
      
      -- Calculate commission based on type
      IF v_rule.calculation_type = 'percentage' THEN
        v_commission_amount := v_base_amount * (v_rule.commission_rate / 100);
      ELSIF v_rule.calculation_type = 'fixed' THEN
        v_commission_amount := v_rule.fixed_amount;
      ELSIF v_rule.calculation_type = 'tiered' THEN
        -- Simplified tiered calculation (could be enhanced)
        v_commission_amount := v_base_amount * (v_rule.commission_rate / 100);
      END IF;
      
      -- Insert commission record
      INSERT INTO sales_commissions (
        sale_id,
        employee_id,
        commission_rule_id,
        sale_total,
        commission_rate,
        commission_amount,
        status
      ) VALUES (
        NEW.id,
        NEW.employee_id,
        v_rule.id,
        v_base_amount,
        v_rule.commission_rate,
        v_commission_amount,
        'pending'
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_calculate_sales_commission
AFTER INSERT OR UPDATE ON public.sales
FOR EACH ROW
WHEN (NEW.employee_id IS NOT NULL)
EXECUTE FUNCTION public.calculate_sales_commission();

-- 12. FUNCTION TO CALCULATE SLA DUE DATES
CREATE OR REPLACE FUNCTION public.calculate_sla_due_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sla RECORD;
BEGIN
  -- Get SLA configuration for assistances
  SELECT * INTO v_sla
  FROM sla_configurations
  WHERE service_type = 'assistance'
    AND priority = COALESCE(NEW.priority, 'normal')
    AND active = true
  LIMIT 1;
  
  IF FOUND THEN
    -- Calculate due dates (simplified - add hours directly)
    NEW.sla_response_due := NEW.created_at + (v_sla.response_time_hours || ' hours')::INTERVAL;
    NEW.sla_resolution_due := NEW.created_at + (v_sla.resolution_time_hours || ' hours')::INTERVAL;
    NEW.sla_status := 'on_time';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_calculate_assistance_sla
BEFORE INSERT ON public.assistances
FOR EACH ROW
EXECUTE FUNCTION public.calculate_sla_due_dates();

-- 13. FUNCTION TO AUTO-GENERATE PRODUCTION ORDER NUMBER
CREATE OR REPLACE FUNCTION public.generate_production_order_number()
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  order_number VARCHAR;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+') AS INTEGER)), 0) + 1
  INTO next_number
  FROM production_orders
  WHERE order_number ~ '^PRO[0-9]+$';
  
  order_number := 'PRO' || LPAD(next_number::TEXT, 6, '0');
  RETURN order_number;
END;
$$;

-- 14. RLS POLICIES
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_order_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_approval_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage these tables (simplified - adjust based on roles)
CREATE POLICY "Allow authenticated manage production_orders"
ON public.production_orders FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated manage production_order_progress"
ON public.production_order_progress FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated read sla_configurations"
ON public.sla_configurations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated manage commission_rules"
ON public.commission_rules FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated manage sales_commissions"
ON public.sales_commissions FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated manage sales_targets"
ON public.sales_targets FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated manage delivery_routes"
ON public.delivery_routes FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated read purchase_approval_rules"
ON public.purchase_approval_rules FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated manage customer_feedback"
ON public.customer_feedback FOR ALL
TO authenticated
USING (true);

-- 15. UPDATE TIMESTAMPS TRIGGER
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at_production_orders
BEFORE UPDATE ON public.production_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_commission_rules
BEFORE UPDATE ON public.commission_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_sales_commissions
BEFORE UPDATE ON public.sales_commissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_sales_targets
BEFORE UPDATE ON public.sales_targets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_delivery_routes
BEFORE UPDATE ON public.delivery_routes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.production_orders IS 'Manufacturing/production orders for custom furniture and assembly tracking';
COMMENT ON TABLE public.production_order_progress IS 'Stage-by-stage progress tracking for production orders';
COMMENT ON TABLE public.sla_configurations IS 'Service Level Agreement configurations for different service types';
COMMENT ON TABLE public.commission_rules IS 'Rules for calculating sales commissions';
COMMENT ON TABLE public.sales_commissions IS 'Individual commission records for sales';
COMMENT ON TABLE public.sales_targets IS 'Sales goals and targets for employees and categories';
COMMENT ON TABLE public.delivery_routes IS 'Optimized delivery routes for logistics';
COMMENT ON TABLE public.purchase_approval_rules IS 'Rules for purchase order approvals based on amount';
COMMENT ON TABLE public.customer_feedback IS 'Customer satisfaction ratings and feedback';
